import { prisma } from '../database/connections';

export enum NotificationType {
  SUBMISSION_APPROVED = 'SUBMISSION_APPROVED',
  SUBMISSION_REJECTED = 'SUBMISSION_REJECTED',
  PAYMENT_RELEASED = 'PAYMENT_RELEASED',
  TASK_EXPIRED = 'TASK_EXPIRED',
}

export interface NotificationData {
  type: NotificationType;
  taskId: string;
  submissionId: string;
  result?: any;
  amount?: number;
  txHash?: string;
}

export class NotificationService {
  /**
   * Send notification to user
   */
  async send(userId: string, data: NotificationData): Promise<void> {
    try {
      console.log(`\n📬 Sending notification to user ${userId}`);
      console.log(`Type: ${data.type}`);

      // Get user details
      const user = await prisma.user.findUnique({
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
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't throw - notifications are not critical
    }
  }

  /**
   * Save in-app notification (can be fetched by frontend)
   */
  private async sendInAppNotification(
    userId: string,
    data: NotificationData
  ): Promise<void> {
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
  private async sendEmail(email: string | null, data: NotificationData): Promise<void> {
    if (!email) return;

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
  private async sendPushNotification(
    fcmToken: string | null,
    data: NotificationData
  ): Promise<void> {
    if (!fcmToken) return;

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
  private getNotificationTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
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
  private getNotificationMessage(data: NotificationData): string {
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
  private logNotification(walletAddress: string, data: NotificationData): void {
    console.log(`\n📋 Notification Log:`);
    console.log(`To: ${walletAddress}`);
    console.log(`Type: ${data.type}`);
    console.log(`Data:`, JSON.stringify(data, null, 2));
  }

  /**
   * Batch send notifications
   */
  async sendBatch(notifications: Array<{ userId: string; data: NotificationData }>): Promise<void> {
    console.log(`\n📬 Sending batch of ${notifications.length} notifications...`);
    
    await Promise.all(
      notifications.map((notification) =>
        this.send(notification.userId, notification.data)
      )
    );
    
    console.log(`✅ Batch notifications sent`);
  }
}

export const notificationService = new NotificationService();
