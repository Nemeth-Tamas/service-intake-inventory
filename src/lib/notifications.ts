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
  // Strip accents to ensure GSM-7 encoding (160 character limit per SMS instead of 70 Unicode UCS-2 limit)
  let cleanMessage = stripHungarianAccents(message);

  if (cleanMessage.length > 160) {
    // If the message exceeds 160 characters, dynamically remove the tracking link and its description
    cleanMessage = cleanMessage.replace(/[\s\.]*(?:[a-zA-Z\s]+:)?\s*https?:\/\/\S+/gi, '');
    
    // Fallback: If it's still too long, truncate it
    if (cleanMessage.length > 160) {
      cleanMessage = cleanMessage.substring(0, 157) + '...';
    }
  }

  if (settings.smsApiUrl.includes('bulkgate.com')) {
    const [appId, appToken] = (settings.smsApiKey || '').split(':');
    if (!appId || !appToken) {
      throw new Error('A BulkGate hitelesítéshez "ApplicationID:ApplicationToken" formátum szükséges az API kulcs mezőben.');
    }

    const payload: any = {
      application_id: appId,
      application_token: appToken,
      number: cleanPhone,
      text: cleanMessage,
      unicode: false
    };

    if (settings.smsSender) {
      if (/^\d+$/.test(settings.smsSender)) {
        payload.sender_id = 'gSystem';
        payload.sender_id_value = settings.smsSender;
      } else {
        payload.sender_id = 'gText';
        payload.sender_id_value = settings.smsSender;
      }
    }

    const res = await fetch(settings.smsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`BulkGate SMS Gateway returned HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json().catch(() => null);
    if (data && data.error) {
      throw new Error(`BulkGate API hiba: ${data.error} (Kód: ${data.code})`);
    }
    return;
  }

  if (settings.smsApiUrl.includes('seeme.hu') || settings.smsApiUrl.includes('seememobile.com')) {
    // Seeme expects numbers in international format without leading + or 00, e.g. 36201234567
    let seemePhone = cleanPhone.replace(/^\+|^00/, '');
    if (seemePhone.startsWith('06')) {
      seemePhone = '36' + seemePhone.substring(2);
    } else if (/^(20|30|70|50)\d{7}$/.test(seemePhone)) {
      seemePhone = '36' + seemePhone;
    }

    const params = new URLSearchParams({
      key: settings.smsApiKey || '',
      number: seemePhone,
      message: cleanMessage,
      format: 'json'
    });
    if (settings.smsSender) {
      params.append('sender', settings.smsSender);
    }

    const url = `${settings.smsApiUrl}${settings.smsApiUrl.includes('?') ? '&' : '?'}${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`SeeMe SMS Gateway returned HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json().catch(() => null);
    if (data && data.result === 'ERR') {
      throw new Error(`SeeMe API hiba: ${data.message || 'Ismeretlen hiba'} (Kód: ${data.code})`);
    }
    return;
  }

  const payload: any = {
    to: cleanPhone,
    message: cleanMessage,
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

function stripHungarianAccents(text: string): string {
  const mapping: { [key: string]: string } = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o', 'ú': 'u', 'ü': 'u', 'ű': 'u',
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ö': 'O', 'Ő': 'O', 'Ú': 'U', 'Ü': 'U', 'Ű': 'U'
  };
  return text.split('').map(char => mapping[char] || char).join('');
}
