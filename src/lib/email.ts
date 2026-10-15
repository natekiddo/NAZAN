import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your-resend-api-key' || apiKey.trim() === '') {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export interface SendReminderEmailParams {
  toEmail: string;
  userName: string;
  title: string;
  message: string;
  reminderType: string;
  actionUrl?: string;
}

export async function sendReminderEmail({
  toEmail,
  userName,
  title,
  message,
  reminderType,
  actionUrl,
}: SendReminderEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!resend) {
    console.log(`[Email Simulation] To: ${toEmail} | Subject: ${title} | Type: ${reminderType}`);
    return {
      success: true,
      messageId: `simulated_${Date.now()}`,
    };
  }

  const badgeColor =
    reminderType === 'task_overdue'
      ? '#ef4444'
      : reminderType === 'task_due'
      ? '#f59e0b'
      : reminderType === 'project_deadline'
      ? '#8b5cf6'
      : '#3b82f6';

  const typeLabel =
    reminderType === 'task_overdue'
      ? 'Task Overdue'
      : reminderType === 'task_due'
      ? 'Task Deadline'
      : reminderType === 'project_deadline'
      ? 'Project Deadline'
      : 'Reminder';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #0f172a; padding: 24px; color: #ffffff;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;">⚡ ProjectHub</span>
      </div>
      <div style="margin-top: 12px; display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background-color: ${badgeColor}; color: #ffffff;">
        ${typeLabel}
      </div>
    </div>

    <div style="padding: 28px 24px;">
      <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: #0f172a;">${title}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">${message}</p>
      
      ${
        actionUrl
          ? `<a href="${actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; border-radius: 10px;">View in ProjectHub →</a>`
          : ''
      }
    </div>

    <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
      Sent to ${toEmail} by your ProjectHub workspace notifications.
    </div>
  </div>
</body>
</html>
`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `[ProjectHub] ${title}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error('Resend Exception:', err);
    return { success: false, error: err?.message || 'Email delivery failed' };
  }
}
