import nodemailer from 'nodemailer';
import { NOTIFICATION_TEMPLATES, compileTemplate } from './notificationTemplates';

export { NOTIFICATION_TEMPLATES, compileTemplate };

export async function sendEmailNotification(settings: any, toEmail: string, subject: string, text: string) {
  if (!settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.smtpPass) {
    throw new Error('SMTP credentials not configured.');
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: Number(settings.smtpPort),
    secure: Number(settings.smtpPort) === 465,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });

  await transporter.sendMail({
    from: settings.smtpFrom || settings.smtpUser,
    to: toEmail,
    subject: subject,
    text: text,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; line-height: 1.6; color: #334155; padding: 20px; border: 1px solid #f1f5f9; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px; margin-top: 0;">${settings.workshopName}</h2>
        <p style="white-space: pre-wrap; font-size: 15px; margin: 20px 0;">${text}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">Ez egy automatikus értesítés a(z) ${settings.workshopName} rendszeréből.</p>
      </div>
    `
  });
}

export async function sendSMSNotification(settings: any, toPhone: string, message: string) {
  if (!settings.smsApiUrl) {
    throw new Error('SMS API URL not configured.');
  }

  const cleanPhone = toPhone.replace(/\s+/g, '');
  const payload: any = {
    to: cleanPhone,
    message: message,
  };
  if (settings.smsSender) payload.sender = settings.smsSender;

  const res = await fetch(settings.smsApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': settings.smsApiKey || '',
      'Authorization': `Bearer ${settings.smsApiKey || ''}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`SMS Gateway returned HTTP ${res.status}: ${errText}`);
  }
}
