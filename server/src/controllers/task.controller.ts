import { Response } from "express";
import { prisma } from "../database/connections";
import { blockchainService } from "../services/blockchain.service";
import {
    AuthenticatedRequest,
    CreateTaskDto,
    TaskListQuery,
} from "../types/api.types";
import { TaskStatus } from "../types/database.types";
import { ResponseUtil } from "../utils/response.util";

export class TaskController {
  /**
   * POST /api/tasks/create
   * Create a new task
   */
  static async createTask(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const taskData: CreateTaskDto = req.body;
      const walletAddress = req.user!.walletAddress;

      console.log(`\n📝 Creating task for requester: ${walletAddress}`);

      // Step 1: Validate requester has sufficient cUSD balance
      const balance = await blockchainService.getCUSDBalance(walletAddress);
      const balanceNum = parseFloat(balance);

      if (balanceNum < taskData.paymentAmount) {
        ResponseUtil.error(
          res,
          `Insufficient balance. Required: ${taskData.paymentAmount} cUSD, Available: ${balanceNum} cUSD`,
          "INSUFFICIENT_BALANCE",
          400
        );
        return;
      }

      // Step 2: Calculate duration in days
      const expiresAt = new Date(taskData.expiresAt);
      const now = new Date();
      const durationMs = expiresAt.getTime() - now.getTime();
      const durationInDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

      // Step 3: Create task on blockchain
      console.log("⛓️  Creating task on blockchain...");
      const blockchainResult = await blockchainService.createTask(
        taskData.paymentAmount.toString(),
        durationInDays
      );

    

      // Step 4: Store task metadata in database
      console.log("💾 Storing task in database...");
      const task = await prisma.task.create({
        data: {
          requesterId: req.user!.userId!,
          title: taskData.title,
          description: taskData.description,
          taskType: taskData.taskType,
          paymentAmount: taskData.paymentAmount,
          verificationCriteria: taskData.verificationCriteria,
          maxSubmissions: taskData.maxSubmissions,
          expiresAt: expiresAt,
          contractTaskId: blockchainResult.taskId, // ← This should now work
          status: TaskStatus.OPEN,
        },
        include: {
          requester: {
            select: {
              id: true,
              walletAddress: true,
              reputationScore: true,
            },
          },
        },
      });

      // Update requester's task count
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          totalTasksCreated: {
            // ← This should now work
            increment: 1,
          },
        },
      });

      console.log(`✅ Task created successfully! ID: ${task.id}`);

      ResponseUtil.success(
        res,
        {
          task,
          blockchain: {
            taskId: blockchainResult.taskId,
            transactionHash: blockchainResult.txHash,
          },
        },
        201
      );
    } catch (error) {
      console.error("Create task error:", error);
      ResponseUtil.internalError(res, `Failed to create task: ${error}`);
    }
  }

  /**
   * GET /api/tasks/list
   * Get paginated list of tasks
   */
  static async listTasks(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const query: TaskListQuery = {
        status: req.query.status as TaskStatus,
        taskType: req.query.taskType as any,
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
        sortBy: (req.query.sortBy as any) || "paymentAmount",
        sortOrder: (req.query.sortOrder as any) || "desc",
      };

      // Build where clause
      const where: any = {};

      if (query.status) {
        where.status = query.status;
      }

      if (query.taskType) {
        where.taskType = query.taskType;
      }

      // Only show non-expired tasks
      where.expiresAt = {
        gt: new Date(),
      };

      // Build orderBy clause
      const orderBy: any = {};
      orderBy[query.sortBy!] = query.sortOrder;

      // Query tasks
      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          orderBy,
          skip: query.offset,
          take: query.limit,
          include: {
            requester: {
              select: {
                id: true,
                walletAddress: true,
                reputationScore: true,
              },
            },
            _count: {
              select: {
                submissions: true,
              },
            },
          },
        }),
        prisma.task.count({ where }),
      ]);

      // Add calculated fields
      const tasksWithExtras = tasks.map((task) => ({
        ...task,
        submissionCount: task._count.submissions,
        spotsRemaining: task.maxSubmissions - task._count.submissions,
        timeRemaining: task.expiresAt.getTime() - Date.now(),
        isExpiringSoon:
          task.expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000, // < 24 hours
      }));

      ResponseUtil.success(res, tasksWithExtras, 200, {
        page: Math.floor(query.offset! / query.limit!) + 1,
        limit: query.limit,
        total,
      });
    } catch (error) {
      console.error("List tasks error:", error);
      ResponseUtil.internalError(res, "Failed to fetch tasks");
    }
  }

  /**
   * GET /api/tasks/:taskId
   * Get single task details
   */
  static async getTask(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { taskId } = req.params;

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          requester: {
            select: {
              id: true,
              walletAddress: true,
              reputationScore: true,
              totalTasksCreated: true,
            },
          },
          submissions: {
            select: {
              id: true,
              workerId: true,
              verificationStatus: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      });

      if (!task) {
        ResponseUtil.notFound(res, "Task");
        return;
      }

      // Add calculated fields
      const taskWithExtras = {
        ...task,
        submissionCount: task._count.submissions,
        spotsRemaining: task.maxSubmissions - task._count.submissions,
        timeRemaining: task.expiresAt.getTime() - Date.now(),
        isExpired: task.expiresAt.getTime() < Date.now(),
        canSubmit:
          task.status === TaskStatus.OPEN &&
          task.expiresAt.getTime() > Date.now() &&
          task._count.submissions < task.maxSubmissions,
      };

      ResponseUtil.success(res, taskWithExtras);
    } catch (error) {
      console.error("Get task error:", error);
      ResponseUtil.internalError(res, "Failed to fetch task");
    }
  }

  /**
   * GET /api/tasks/my-tasks
   * Get tasks created by authenticated user
   */
  static async getMyTasks(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.userId!;

      const tasks = await prisma.task.findMany({
        where: { requesterId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              submissions: true,
              payments: true,
            },
          },
        },
      });

      const tasksWithStats = tasks.map((task) => ({
        ...task,
        submissionCount: task._count.submissions,
        paymentCount: task._count.payments,
        spotsRemaining: task.maxSubmissions - task._count.submissions,
      }));

      ResponseUtil.success(res, tasksWithStats);
    } catch (error) {
      console.error("Get my tasks error:", error);
      ResponseUtil.internalError(res, "Failed to fetch tasks");
    }
  }
}
