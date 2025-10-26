"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const connections_1 = require("../database/connections");
const response_util_1 = require("../utils/response.util");
const signature_util_1 = require("../utils/signature.util");
class AuthMiddleware {
    /**
     * Verify wallet signature authentication
     */
    static async verifyWallet(req, res, next) {
        try {
            // Get auth headers
            const walletAddress = req.headers['x-wallet-address'];
            const signature = req.headers['x-signature'];
            const encodedMessage = req.headers['x-message'];
            const timestamp = parseInt(req.headers['x-timestamp']);
            // Check if all required headers are present
            if (!walletAddress || !signature || !encodedMessage || !timestamp) {
                response_util_1.ResponseUtil.unauthorized(res, 'Missing authentication headers');
                return;
            }
            // Decode the Base64-encoded message
            let message;
            try {
                message = decodeURIComponent(Buffer.from(encodedMessage, 'base64').toString());
            }
            catch (decodeError) {
                response_util_1.ResponseUtil.unauthorized(res, 'Invalid message encoding');
                return;
            }
            // Validate timestamp (prevent replay attacks)
            if (!signature_util_1.SignatureUtil.isTimestampValid(timestamp)) {
                response_util_1.ResponseUtil.unauthorized(res, 'Authentication expired. Please sign again.');
                return;
            }
            // Verify the expected message format
            const expectedMessage = signature_util_1.SignatureUtil.generateAuthMessage(walletAddress, timestamp);
            if (message !== expectedMessage) {
                response_util_1.ResponseUtil.unauthorized(res, 'Invalid authentication message');
                return;
            }
            // Verify signature
            const isValid = signature_util_1.SignatureUtil.verifySignature(message, signature, walletAddress);
            if (!isValid) {
                response_util_1.ResponseUtil.unauthorized(res, 'Invalid signature');
                return;
            }
            // Get user from database
            const user = await connections_1.prisma.user.findUnique({
                where: { walletAddress: walletAddress.toLowerCase() },
            });
            if (!user) {
                response_util_1.ResponseUtil.unauthorized(res, 'User not registered');
                return;
            }
            // Attach user to request
            req.user = {
                walletAddress: walletAddress.toLowerCase(),
                userId: user.id,
            };
            next();
        }
        catch (error) {
            console.error('Auth middleware error:', error);
            response_util_1.ResponseUtil.internalError(res, 'Authentication failed');
        }
    }
    /**
     * Optional authentication (doesn't fail if not authenticated)
     */
    static async optionalAuth(req, res, next) {
        try {
            const walletAddress = req.headers['x-wallet-address'];
            const signature = req.headers['x-signature'];
            if (walletAddress && signature) {
                // Try to authenticate
                await AuthMiddleware.verifyWallet(req, res, next);
            }
            else {
                // Continue without authentication
                next();
            }
        }
        catch (error) {
            // Continue without authentication
            next();
        }
    }
}
exports.AuthMiddleware = AuthMiddleware;
