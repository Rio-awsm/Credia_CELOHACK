"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = exports.NotificationType = void 0;
const connections_1 = require("../database/connections");
var NotificationType;
(function (NotificationType) {
    NotificationType["SUBMISSION_APPROVED"] = "SUBMISSION_APPROVED";
    NotificationType["SUBMISSION_REJECTED"] = "SUBMISSION_REJECTED";
    NotificationType["PAYMENT_RELEASED"] = "PAYMENT_RELEASED";
    NotificationType["TASK_EXPIRED"] = "TASK_EXPIRED";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
class NotificationService {
    /**
     * Send notification to user
     */
    async send(userId, data) {
        try {
            console.log(`\n📬 Sending notification to user ${userId}`);
            console.log(`Type: ${data.type}`);
            // Get user details
            const user = await connections_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                console.error('User not found for notification');
                return;
            }
            // Log notification
            this.logNotification(user.walletAddress, data);
            // Send via different channels
            await Promise.all([
                this.sendInAppNotification(userId, data),
                // Add more channels as needed:
                // this.sendEmail(user.email, data),
                // this.sendPushNotification(user.fcmToken, data),
                // this.sendSMS(user.phoneNumber, data),
            ]);
            console.log(`✅ Notification sent successfully`);
        }
        catch (error) {
            console.error('Failed to send notification:', error);
            // Don't throw - notifications are not critical
        }
    }
    /**
     * Save in-app notification (can be fetched by frontend)
     */
    async sendInAppNotification(userId, data) {
        // Store in database for in-app display
        const notification = {
            userId,
            type: data.type,
            title: this.getNotificationTitle(data.type),
            message: this.getNotificationMessage(data),
            data: JSON.stringify(data),
            read: false,
            createdAt: new Date(),
        };
        console.log('📱 In-app notification created:', notification);
        // TODO: Store in notifications table (create migration if needed)
        // await prisma.notification.create({ data: notification });
    }
    /**
     * Send email notification (placeholder)
     */
    async sendEmail(email, data) {
        if (!email)
            return;
        console.log(`📧 Email notification to ${email}:`, {
            subject: this.getNotificationTitle(data.type),
            body: this.getNotificationMessage(data),
        });
        // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        // await emailService.send({
        //   to: email,
        //   subject: this.getNotificationTitle(data.type),
        //   html: this.getEmailTemplate(data),
        // });
    }
    /**
     * Send push notification (placeholder)
     */
    async sendPushNotification(fcmToken, data) {
        if (!fcmToken)
            return;
        console.log(`🔔 Push notification:`, {
            token: fcmToken,
            title: this.getNotificationTitle(data.type),
            body: this.getNotificationMessage(data),
        });
        // TODO: Integrate with Firebase Cloud Messaging
        // await admin.messaging().send({
        //   token: fcmToken,
        //   notification: {
        //     title: this.getNotificationTitle(data.type),
        //     body: this.getNotificationMessage(data),
        //   },
        //   data: data,
        // });
    }
    /**
     * Get notification title
     */
    getNotificationTitle(type) {
        const titles = {
            [NotificationType.SUBMISSION_APPROVED]: '✅ Submission Approved!',
            [NotificationType.SUBMISSION_REJECTED]: '❌ Submission Rejected',
            [NotificationType.PAYMENT_RELEASED]: '💰 Payment Released!',
            [NotificationType.TASK_EXPIRED]: '⏰ Task Expired',
        };
        return titles[type];
    }
    /**
     * Get notification message
     */
    getNotificationMessage(data) {
        switch (data.type) {
            case NotificationType.SUBMISSION_APPROVED:
                return `Your submission has been approved! Payment of ${data.amount} cUSD is being processed.`;
            case NotificationType.SUBMISSION_REJECTED:
                return `Your submission was rejected. Reason: ${data.result?.reasoning || 'Did not meet criteria'}`;
            case NotificationType.PAYMENT_RELEASED:
                return `Payment of ${data.amount} cUSD has been sent to your wallet. Tx: ${data.txHash}`;
            case NotificationType.TASK_EXPIRED:
                return `Task has expired without completion.`;
            default:
                return 'You have a new notification';
        }
    }
    /**
     * Log notification for debugging
     */
    logNotification(walletAddress, data) {
        console.log(`\n📋 Notification Log:`);
        console.log(`To: ${walletAddress}`);
        console.log(`Type: ${data.type}`);
        console.log(`Data:`, JSON.stringify(data, null, 2));
    }
    /**
     * Batch send notifications
     */
    async sendBatch(notifications) {
        console.log(`\n📬 Sending batch of ${notifications.length} notifications...`);
        await Promise.all(notifications.map((notification) => this.send(notification.userId, notification.data)));
        console.log(`✅ Batch notifications sent`);
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
