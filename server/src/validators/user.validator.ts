import { ethers } from 'ethers';
import { body } from 'express-validator';

export const userValidators = {
  register: [
    body('walletAddress')
      .trim()
      .notEmpty()
      .withMessage('Wallet address is required')
      .custom((value) => {
        if (!ethers.isAddress(value)) {
          throw new Error('Invalid wallet address');
        }
        return true;
      }),
    
    body('phoneNumber')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    
    body('role')
      .isIn(['requester', 'worker'])
      .withMessage('Role must be either requester or worker'),
  ],
};
