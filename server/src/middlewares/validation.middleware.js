"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMiddleware = void 0;
const express_validator_1 = require("express-validator");
const response_util_1 = require("../utils/response.util");
class ValidationMiddleware {
    /**
     * Validate request using express-validator
     */
    static validate(validations) {
        return async (req, res, next) => {
            // Run all validations
            await Promise.all(validations.map((validation) => validation.run(req)));
            // Check for errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return response_util_1.ResponseUtil.validationError(res, errors.array());
            }
            next();
        };
    }
}
exports.ValidationMiddleware = ValidationMiddleware;
