import { NextFunction, Response } from 'express';
import { prisma } from '../database/connections';
import { AuthenticatedRequest } from '../types/api.types';
import { ResponseUtil } from '../utils/response.util';
import { SignatureUtil } from '../utils/signature.util';

export class AuthMiddleware {
  /**
   * Verify wallet signature authentication
   */
  static async verifyWallet(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Get auth headers
      const walletAddress = req.headers['x-wallet-address'] as string;
      const signature = req.headers['x-signature'] as string;
      const message = req.headers['x-message'] as string;
      const timestamp = parseInt(req.headers['x-timestamp'] as string);

      // Check if all required headers are present
      if (!walletAddress || !signature || !message || !timestamp) {
        ResponseUtil.unauthorized(res, 'Missing authentication headers');
        return;
      }

      // Validate timestamp (prevent replay attacks)
      if (!SignatureUtil.isTimestampValid(timestamp)) {
        ResponseUtil.unauthorized(res, 'Authentication expired. Please sign again.');
        return;
      }

      // Verify the expected message format
      const expectedMessage = SignatureUtil.generateAuthMessage(walletAddress, timestamp);
      if (message !== expectedMessage) {
        ResponseUtil.unauthorized(res, 'Invalid authentication message');
        return;
      }

      // Verify signature
      const isValid = SignatureUtil.verifySignature(message, signature, walletAddress);
      
      if (!isValid) {
        ResponseUtil.unauthorized(res, 'Invalid signature');
        return;
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
      });

      if (!user) {
        ResponseUtil.unauthorized(res, 'User not registered');
        return;
      }

      // Attach user to request
      req.user = {
        walletAddress: walletAddress.toLowerCase(),
        userId: user.id,
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      ResponseUtil.internalError(res, 'Authentication failed');
    }
  }

  /**
   * Optional authentication (doesn't fail if not authenticated)
   */
  static async optionalAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;
      const signature = req.headers['x-signature'] as string;

      if (walletAddress && signature) {
        // Try to authenticate
        await AuthMiddleware.verifyWallet(req, res, next);
      } else {
        // Continue without authentication
        next();
      }
    } catch (error) {
      // Continue without authentication
      next();
    }
  }
}
