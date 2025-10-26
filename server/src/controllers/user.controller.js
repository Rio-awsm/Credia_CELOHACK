"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const connections_1 = require("../database/connections");
const response_util_1 = require("../utils/response.util");
class UserController {
    /**
     * POST /api/users/register
     * Register a new user
     */
    static async register(req, res) {
        try {
            const userData = req.body;
            console.log(`\n👤 Registering user: ${userData.walletAddress}`);
            // Check if user already exists
            const existingUser = await connections_1.prisma.user.findUnique({
                where: { walletAddress: userData.walletAddress.toLowerCase() },
            });
            if (existingUser) {
                response_util_1.ResponseUtil.error(res, 'User already registered', 'USER_EXISTS', 409);
                return;
            }
            // Create user
            const user = await connections_1.prisma.user.create({
                data: {
                    walletAddress: userData.walletAddress.toLowerCase(),
                    phoneNumber: userData.phoneNumber,
                    role: userData.role,
                    reputationScore: 0,
                    totalEarnings: 0,
                },
            });
            console.log(`✅ User registered: ${user.id}`);
            response_util_1.ResponseUtil.success(res, {
                id: user.id,
                walletAddress: user.walletAddress,
                role: user.role,
                createdAt: user.createdAt,
            }, 201);
        }
        catch (error) {
            console.error('Register user error:', error);
            response_util_1.ResponseUtil.internalError(res, 'Failed to register user');
        }
    }
    /**
     * GET /api/users/profile
     * Get authenticated user's profile
     */
    static async getProfile(req, res) {
        try {
            const userId = req.user.userId;
            const user = await connections_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    _count: {
                        select: {
                            createdTasks: true,
                            submissions: true,
                            payments: true,
                        },
                    },
                },
            });
            if (!user) {
                response_util_1.ResponseUtil.notFound(res, 'User');
                return;
            }
            // Get additional stats
            const [approvedSubmissions, rejectedSubmissions, pendingSubmissions] = await Promise.all([
                connections_1.prisma.submission.count({
                    where: {
                        workerId: userId,
                        verificationStatus: 'approved',
                    },
                }),
                connections_1.prisma.submission.count({
                    where: {
                        workerId: userId,
                        verificationStatus: 'rejected',
                    },
                }),
                connections_1.prisma.submission.count({
                    where: {
                        workerId: userId,
                        verificationStatus: 'pending',
                    },
                }),
            ]);
            const profile = {
                id: user.id,
                walletAddress: user.walletAddress,
                phoneNumber: user.phoneNumber,
                role: user.role,
                reputationScore: user.reputationScore,
                totalEarnings: user.totalEarnings,
                createdAt: user.createdAt,
                stats: {
                    tasksCreated: user._count.createdTasks,
                    submissionsTotal: user._count.submissions,
                    submissionsApproved: approvedSubmissions,
                    submissionsRejected: rejectedSubmissions,
                    submissionsPending: pendingSubmissions,
                    paymentsReceived: user._count.payments,
                    approvalRate: user._count.submissions > 0
                        ? ((approvedSubmissions / user._count.submissions) * 100).toFixed(2)
                        : 0,
                },
            };
            response_util_1.ResponseUtil.success(res, profile);
        }
        catch (error) {
            console.error('Get profile error:', error);
            response_util_1.ResponseUtil.internalError(res, 'Failed to fetch profile');
        }
    }
    /**
     * GET /api/users/:walletAddress/public
     * Get public user profile (for displaying requester info)
     */
    static async getPublicProfile(req, res) {
        try {
            const { walletAddress } = req.params;
            const user = await connections_1.prisma.user.findUnique({
                where: { walletAddress: walletAddress.toLowerCase() },
                select: {
                    id: true,
                    walletAddress: true,
                    role: true,
                    reputationScore: true,
                    totalTasksCreated: true,
                    totalTasksCompleted: true,
                    createdAt: true,
                },
            });
            if (!user) {
                response_util_1.ResponseUtil.notFound(res, 'User');
                return;
            }
            response_util_1.ResponseUtil.success(res, user);
        }
        catch (error) {
            console.error('Get public profile error:', error);
            response_util_1.ResponseUtil.internalError(res, 'Failed to fetch user');
        }
    }
}
exports.UserController = UserController;
