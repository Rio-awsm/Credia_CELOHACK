"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const submission_controller_1 = require("../controllers/submission.controller");
const router = (0, express_1.Router)();
// Submit task (with moderation)
router.post('/submissions', submission_controller_1.SubmissionController.submitTask);
// Get moderation stats (admin only)
router.get('/moderation/stats', submission_controller_1.SubmissionController.getModerationStats);
exports.default = router;
