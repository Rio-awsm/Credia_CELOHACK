"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const connections_1 = require("../database/connections");
const blockchain_service_1 = require("../services/blockchain.service");
const database_types_1 = require("../types/database.types");
const response_util_1 = require("../utils/response.util");
class TaskController {
    /**
     * POST /api/tasks/create
     * Create a new task
     */
    static async createTask(req, res) {
        try {
            const taskData = req.body;
            const walletAddress = req.user.walletAddress;
            console.log(`\n📝 Creating task for requester: ${walletAddress}`);
            // Step 1: Validate requester has sufficient cUSD balance
            const balance = await blockchain_service_1.blockchainService.getCUSDBalance(walletAddress);
            const balanceNum = parseFloat(balance);
            if (balanceNum < taskData.paymentAmount) {
                response_util_1.ResponseUtil.error(res, `Insufficient balance. Required: ${taskData.paymentAmount} cUSD, Available: ${balanceNum} cUSD`, "INSUFFICIENT_BALANCE", 400);
                return;
            }
            // Step 2: Calculate duration in days
            const expiresAt = new Date(taskData.expiresAt);
            const now = new Date();
            const durationMs = expiresAt.getTime() - now.getTime();
            const durationInDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
            // Step 3: Create task on blockchain
            console.log("⛓️  Creating task on blockchain...");
            const blockchainResult = await blockchain_service_1.blockchainService.createTask(taskData.paymentAmount.toString(), durationInDays);
            // Step 4: Store task metadata in database
            console.log("💾 Storing task in database...");
            const task = await connections_1.prisma.task.create({
                data: {
                    requesterId: req.user.userId,
                    title: taskData.title,
                    description: taskData.description,
                    taskType: taskData.taskType,
                    paymentAmount: taskData.paymentAmount,
                    verificationCriteria: taskData.verificationCriteria,
                    maxSubmissions: taskData.maxSubmissions,
                    expiresAt: expiresAt,
                    contractTaskId: blockchainResult.taskId, // ← This should now work
                    status: database_types_1.TaskStatus.OPEN,
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
            await connections_1.prisma.user.update({
                where: { id: req.user.userId },
                data: {
                    totalTasksCreated: {
                        // ← This should now work
                        increment: 1,
                    },
                },
            });
            console.log(`✅ Task created successfully! ID: ${task.id}`);
            response_util_1.ResponseUtil.success(res, {
                task,
                blockchain: {
                    taskId: blockchainResult.taskId,
                    transactionHash: blockchainResult.txHash,
                },
            }, 201);
        }
        catch (error) {
            console.error("Create task error:", error);
            response_util_1.ResponseUtil.internalError(res, `Failed to create task: ${error}`);
        }
    }
    /**
     * GET /api/tasks/list
     * Get paginated list of tasks
     */
    static async listTasks(req, res) {
        try {
            const query = {
                status: req.query.status,
                taskType: req.query.taskType,
                limit: parseInt(req.query.limit) || 20,
                offset: parseInt(req.query.offset) || 0,
                sortBy: req.query.sortBy || "paymentAmount",
                sortOrder: req.query.sortOrder || "desc",
            };
            // Build where clause
            const where = {};
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
            const orderBy = {};
            orderBy[query.sortBy] = query.sortOrder;
            // Query tasks
            const [tasks, total] = await Promise.all([
                connections_1.prisma.task.findMany({
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
                connections_1.prisma.task.count({ where }),
            ]);
            // Add calculated fields
            const tasksWithExtras = tasks.map((task) => ({
                ...task,
                submissionCount: task._count.submissions,
                spotsRemaining: task.maxSubmissions - task._count.submissions,
                timeRemaining: task.expiresAt.getTime() - Date.now(),
                isExpiringSoon: task.expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000, // < 24 hours
            }));
            response_util_1.ResponseUtil.success(res, tasksWithExtras, 200, {
                page: Math.floor(query.offset / query.limit) + 1,
                limit: query.limit,
                total,
            });
        }
        catch (error) {
            console.error("List tasks error:", error);
            response_util_1.ResponseUtil.internalError(res, "Failed to fetch tasks");
        }
    }
    /**
     * GET /api/tasks/:taskId
     * Get single task details
     */
    static async getTask(req, res) {
        try {
            const { taskId } = req.params;
            const task = await connections_1.prisma.task.findUnique({
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
                response_util_1.ResponseUtil.notFound(res, "Task");
                return;
            }
            // Add calculated fields
            const taskWithExtras = {
                ...task,
                submissionCount: task._count.submissions,
                spotsRemaining: task.maxSubmissions - task._count.submissions,
                timeRemaining: task.expiresAt.getTime() - Date.now(),
                isExpired: task.expiresAt.getTime() < Date.now(),
                canSubmit: task.status === database_types_1.TaskStatus.OPEN &&
                    task.expiresAt.getTime() > Date.now() &&
                    task._count.submissions < task.maxSubmissions,
            };
            response_util_1.ResponseUtil.success(res, taskWithExtras);
        }
        catch (error) {
            console.error("Get task error:", error);
            response_util_1.ResponseUtil.internalError(res, "Failed to fetch task");
        }
    }
    /**
     * GET /api/tasks/my-tasks
     * Get tasks created by authenticated user
     */
    static async getMyTasks(req, res) {
        try {
            const userId = req.user.userId;
            const tasks = await connections_1.prisma.task.findMany({
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
            response_util_1.ResponseUtil.success(res, tasksWithStats);
        }
        catch (error) {
            console.error("Get my tasks error:", error);
            response_util_1.ResponseUtil.internalError(res, "Failed to fetch tasks");
        }
    }
}
exports.TaskController = TaskController;
