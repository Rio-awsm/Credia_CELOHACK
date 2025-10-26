"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationAction = exports.ModerationSeverity = void 0;
// Severity levels
var ModerationSeverity;
(function (ModerationSeverity) {
    ModerationSeverity["NONE"] = "NONE";
    ModerationSeverity["LOW"] = "LOW";
    ModerationSeverity["MEDIUM"] = "MEDIUM";
    ModerationSeverity["HIGH"] = "HIGH";
    ModerationSeverity["CRITICAL"] = "CRITICAL";
})(ModerationSeverity || (exports.ModerationSeverity = ModerationSeverity = {}));
// Moderation actions
var ModerationAction;
(function (ModerationAction) {
    ModerationAction["APPROVE"] = "APPROVE";
    ModerationAction["FLAG_REVIEW"] = "FLAG_REVIEW";
    ModerationAction["AUTO_REJECT"] = "AUTO_REJECT";
})(ModerationAction || (exports.ModerationAction = ModerationAction = {}));
