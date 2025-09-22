import { MailService } from '@sendgrid/mail';

// SMS Service (Mock implementation - replace with actual SMS provider)
class SMSService {
  static async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      console.log(`SMS to ${to}: ${message}`);
      // In production, integrate with SMS provider like Twilio, AWS SNS, etc.
      // For now, we'll simulate success
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }
}

// Email Service using SendGrid
class EmailService {
  private static mailService: MailService;

  static initialize() {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY not configured - email features will be disabled');
      return;
    }
    
    this.mailService = new MailService();
    this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
  }

  static async sendReceiptEmail(
    to: string,
    customerName: string,
    receiptId: string,
    htmlContent: string,
    pdfAttachment?: Buffer
  ): Promise<boolean> {
    if (!this.mailService) {
      console.warn('Email service not initialized');
      return false;
    }

    try {
      const emailData: any = {
        to,
        from: 'noreply@aryenrecreation.com', // Replace with your verified sender
        subject: `Payment Receipt - ${receiptId} | Aryen Sports Arena`,
        html: htmlContent,
        text: `Dear ${customerName},\n\nThank you for your payment. Please find your receipt attached.\n\nReceipt ID: ${receiptId}\n\nBest regards,\nAryen Sports Arena Team`
      };

      if (pdfAttachment) {
        emailData.attachments = [
          {
            content: pdfAttachment.toString('base64'),
            filename: `receipt-${receiptId}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ];
      }

      await this.mailService.send(emailData);
      console.log(`Receipt email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }
}

// Initialize email service
EmailService.initialize();

export { SMSService, EmailService };