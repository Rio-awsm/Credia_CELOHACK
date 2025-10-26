"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentStatus = exports.VerificationStatus = exports.TaskStatus = exports.TaskType = exports.UserRole = void 0;
// Enums
var UserRole;
(function (UserRole) {
    UserRole["REQUESTER"] = "requester";
    UserRole["WORKER"] = "worker";
})(UserRole || (exports.UserRole = UserRole = {}));
var TaskType;
(function (TaskType) {
    TaskType["TEXT_VERIFICATION"] = "text_verification";
    TaskType["IMAGE_LABELING"] = "image_labeling";
    TaskType["SURVEY"] = "survey";
    TaskType["CONTENT_MODERATION"] = "content_moderation";
})(TaskType || (exports.TaskType = TaskType = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["OPEN"] = "open";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["EXPIRED"] = "expired";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["APPROVED"] = "approved";
    VerificationStatus["REJECTED"] = "rejected";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
