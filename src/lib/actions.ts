'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir, unlink, stat, readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { publishUpdate } from './realtime';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { 
  STATUSES, 
  PRIORITIES, 
  WorkOrderCreateSchema, 
  WorkOrderUpdateSchema, 
  LineItemSchema, 
  SettingsSchema, 
  SignatureSchema 
} from './validation';

// Helper to trigger real-time updates
async function triggerUpdate(workOrderId?: string) {
  if (workOrderId) {
    await publishUpdate(`order-${workOrderId}`);
  }
  await publishUpdate('dashboard');
}

// System note helper
async function logActivity(workOrderId: string, text: string) {
  await prisma.note.create({
    data: {
      workOrderId,
      text: `[RENDSZER] ${text}`,
    },
  });
}

// System log helper for Global Audit Log
async function recordSystemActivity(type: 'INFO' | 'WARNING' | 'SUCCESS' | 'SYSTEM', message: string, entityId?: string) {
  try {
    await prisma.activityLog.create({
      data: { type, message, entityId }
    });
  } catch (e) {
    console.error('Failed to record activity:', e);
  }
}

export async function createWorkOrder(formData: FormData) {
  const rawData = {
    customerName: formData.get('customerName'),
    customerContact: formData.get('customerContact'),
    deviceType: formData.get('deviceType'),
    serialNumber: formData.get('serialNumber'),
    condition: formData.get('condition'),
    complaint: formData.get('complaint'),
    accessories: formData.get('accessories'),
    estimatedPrice: formData.get('estimatedPrice'),
    warranty: formData.get('warranty'),
    warrantyExpiry: formData.get('warrantyExpiry'),
    priority: formData.get('priority') || undefined,
    estimatedDone: formData.get('estimatedDone'),
  };

  const parsed = WorkOrderCreateSchema.parse(rawData);

  const workOrder = await prisma.workOrder.create({
    data: {
      ...parsed,
      status: 'Átvétel alatt',
      statusHistory: {
        create: { status: 'Átvétel alatt' }
      }
    },
  });

  await logActivity(workOrder.id, 'Munkalap létrehozva.');
  await recordSystemActivity('SUCCESS', `Új munkalap rögzítve: ${parsed.deviceType || 'Ismeretlen'} (${parsed.customerName || 'Névtelen'})`, workOrder.id);
  await triggerUpdate();
  const redirect = (await import('next/navigation')).redirect;
  redirect(`/t/${workOrder.id}`);
}

export async function getSettings() {
  let settings = await prisma.settings.findFirst({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: 1, baseUrl: 'http://localhost:3000', workshopName: 'Cellnet Kft. Szerviz' }
    });
  }
  return settings;
}

export async function updateSettings(
  baseUrl: string, 
  workshopName: string, 
  technicianName: string, 
  address: string, 
  phone: string, 
  email: string, 
  website: string, 
  googleReviewUrl?: string,
  declarationTemplate?: string,
  backupInterval?: string,
  nasBackupPath?: string,
  smtpHost?: string,
  smtpPort?: string | number,
  smtpUser?: string,
  smtpPass?: string,
  smtpFrom?: string,
  smsApiUrl?: string,
  smsApiKey?: string,
  smsSender?: string
) {
  const parsed = SettingsSchema.parse({
    baseUrl,
    workshopName,
    technicianName,
    address,
    phone,
    email,
    website,
    googleReviewUrl,
    declarationTemplate,
    backupInterval,
    nasBackupPath,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpFrom,
    smsApiUrl,
    smsApiKey,
    smsSender,
  });

  if (parsed.declarationTemplate) {
    parsed.declarationTemplate = DOMPurify.sanitize(parsed.declarationTemplate, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: [],
    });
  }

  await prisma.settings.update({
    where: { id: 1 },
    data: parsed
  });
  revalidatePath('/');
  revalidatePath('/settings');
  await triggerUpdate();
}

export async function updateRepresentativeSignature(signatureData: string | null) {
  const validatedSignature = z.string().nullable().parse(signatureData);
  await prisma.settings.update({
    where: { id: 1 },
    data: { representativeSignature: validatedSignature },
  });

  revalidatePath('/settings');
  revalidatePath('/');
  await triggerUpdate();
}
export async function uploadLogo(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { success: false };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const extension = file.name.split('.').pop() || 'png';
  const fileName = `logo-${Date.now()}.${extension}`;
  const filePath = `/uploads/${fileName}`;
  const fullPath = join(process.cwd(), 'public', filePath);

  const settings = await getSettings();
  if (settings.logoPath) {
    try {
      await unlink(join(process.cwd(), 'public', settings.logoPath));
    } catch (e) {}
  }

  await writeFile(fullPath, buffer);
  await prisma.settings.update({
    where: { id: 1 },
    data: { logoPath: filePath }
  });

  revalidatePath('/settings');
  revalidatePath('/');
  await triggerUpdate();
  return { success: true, logoPath: filePath };
}

export async function deleteLogo() {
  const settings = await getSettings();
  if (settings.logoPath) {
    try {
      await unlink(join(process.cwd(), 'public', settings.logoPath));
    } catch (e) {}
    await prisma.settings.update({
      where: { id: 1 },
      data: { logoPath: null }
    });
  }
  revalidatePath('/settings');
  revalidatePath('/');
  await triggerUpdate();
}

export async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));

  const [urgent, today, ready, active, archived] = await Promise.all([
    prisma.workOrder.count({ where: { priority: 'Sürgős', NOT: { status: 'Kiadva' } } }),
    prisma.workOrder.count({ where: { estimatedDone: { gte: todayStart, lte: todayEnd }, NOT: { status: 'Kiadva' } } }),
    prisma.workOrder.count({ where: { status: 'Kész / Átvehető' } }),
    prisma.workOrder.count({ where: { NOT: { status: 'Kiadva' } } }),
    prisma.workOrder.count({ where: { status: 'Kiadva' } })
  ]);

  return { urgent, today, ready, active, archived };
}

export async function getStorageUsage() {
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  const archivesDir = join(process.cwd(), 'public', 'archives');
  
  let totalSize = 0;
  
  async function getDirSize(dir: string) {
    if (!existsSync(dir)) return;
    const files = await readdir(dir);
    for (const file of files) {
      const stats = await stat(join(dir, file));
      totalSize += stats.size;
    }
  }

  await getDirSize(uploadsDir);
  await getDirSize(archivesDir);

  const totalJobs = await prisma.workOrder.count();
  
  return {
    sizeBytes: totalSize,
    sizeFormatted: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
    totalJobs
  };
}

export async function getPreviousRepairs(serialNumber: string, currentId: string) {
  if (!serialNumber || serialNumber === '-' || serialNumber.length < 3) return [];
  return prisma.workOrder.findMany({
    where: { 
      serialNumber,
      NOT: { id: currentId }
    },
    include: { photos: true, notes: true, lineItems: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function runCleanup() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oldOrders = await prisma.workOrder.findMany({
    where: {
      status: 'Kiadva',
      updatedAt: { lte: thirtyDaysAgo },
      photos: { some: {} }
    },
    include: { photos: true }
  });

  let purgedCount = 0;
  for (const order of oldOrders) {
    for (const photo of order.photos) {
      try {
        await unlink(join(process.cwd(), 'public', photo.filePath));
      } catch (e) {}
    }
    await prisma.photo.deleteMany({ where: { workOrderId: order.id } });
    purgedCount++;
  }

  await triggerUpdate();
  revalidatePath('/');
  revalidatePath('/settings');
  return { success: true, purgedCount };
}

export async function archiveWorkOrderPdf(formData: FormData) {
  const workOrderId = z.string().cuid().parse(formData.get('workOrderId'));
  const pdfBase64 = z.string().min(1, 'PDF data cannot be empty').parse(formData.get('pdfData'));

  try {
    const archiveDir = join(process.cwd(), 'public', 'archives');
    if (!existsSync(archiveDir)) {
      await mkdir(archiveDir, { recursive: true });
    }

    const buffer = Buffer.from(pdfBase64.split(',')[1], 'base64');
    const fileName = `munkalap-${workOrderId}-${Date.now()}.pdf`;
    const filePath = `/archives/${fileName}`;
    const fullPath = join(process.cwd(), 'public', filePath);
    
    await writeFile(fullPath, buffer);
    
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { archivedPdfPath: filePath }
    });
    
    await triggerUpdate(workOrderId);
    return { success: true, filePath };
  } catch (error) {
    console.error('Archive error:', error);
    return { success: false };
  }
}

export async function addNote(formData: FormData) {
  const workOrderId = z.string().cuid().parse(formData.get('workOrderId'));
  const text = z.string().trim().min(1, 'A jegyzet nem lehet üres').max(2000).parse(formData.get('text'));

  await prisma.note.create({
    data: {
      workOrderId,
      text,
    },
  });

  await triggerUpdate(workOrderId);
  revalidatePath(`/t/${workOrderId}`);
}

export async function addLineItem(formData: FormData) {
  const rawData = {
    workOrderId: formData.get('workOrderId'),
    description: formData.get('description'),
    amount: formData.get('amount'),
  };

  const parsed = LineItemSchema.parse(rawData);

  await prisma.lineItem.create({
    data: parsed
  });

  await logActivity(parsed.workOrderId, `Tétel hozzáadva: ${parsed.description} (${parsed.amount.toLocaleString('hu-HU')} Ft)`);
  await triggerUpdate(parsed.workOrderId);
  revalidatePath(`/t/${parsed.workOrderId}`);
}

export async function deleteLineItem(id: string, workOrderId: string) {
  const parsedId = z.string().cuid().parse(id);
  const parsedWorkOrderId = z.string().cuid().parse(workOrderId);

  const item = await prisma.lineItem.findUnique({ where: { id: parsedId } });
  if (item) {
    await prisma.lineItem.delete({ where: { id: parsedId } });
    await logActivity(parsedWorkOrderId, `Tétel törölve: ${item.description}`);
  }
  await triggerUpdate(parsedWorkOrderId);
  revalidatePath(`/t/${parsedWorkOrderId}`);
}

export async function updateStatus(workOrderId: string, status: string) {
  const parsedWorkOrderId = z.string().cuid().parse(workOrderId);
  const parsedStatus = z.enum(STATUSES).parse(status);

  const oldOrder = await prisma.workOrder.findUnique({ where: { id: parsedWorkOrderId } });
  const updatedOrder = await prisma.workOrder.update({
    where: { id: parsedWorkOrderId },
    data: { 
      status: parsedStatus,
      statusHistory: {
        create: { status: parsedStatus }
      }
    },
    include: {
      notes: { orderBy: { createdAt: 'desc' } },
      photos: { orderBy: { createdAt: 'desc' } },
      statusHistory: { orderBy: { createdAt: 'desc' } },
      lineItems: { orderBy: { createdAt: 'desc' } },
    }
  });

  // If status is "Kiadva" (Handed over), generate and archive PDF server-side automatically
  if (parsedStatus === 'Kiadva' && !updatedOrder.archivedPdfPath) {
    try {
      const settings = await getSettings();
      const { renderToBuffer } = await import('@react-pdf/renderer');
      const React = await import('react');
      const { WorkOrderDocument } = await import('./pdfTemplates');
      const sharp = (await import('sharp')).default;

      // Pre-process logo
      let logoBase64: string | null = null;
      if (settings.logoPath) {
        const logoDiskPath = join(process.cwd(), 'public', settings.logoPath);
        try {
          if (existsSync(logoDiskPath)) {
            const extension = settings.logoPath.split('.').pop()?.toLowerCase();
            const buffer = await readFile(logoDiskPath);
            if (extension === 'webp') {
              const pngBuffer = await sharp(logoDiskPath).png().toBuffer();
              logoBase64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;
            } else {
              const mimeType = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 'image/png';
              logoBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
            }
          }
        } catch (err) {
          console.error('Failed to load logo for PDF:', err);
        }
      }

      // Pre-process photos (convert WebP to JPEG on-the-fly)
      const photosWithBase64 = await Promise.all(
        updatedOrder.photos.map(async (photo) => {
          const photoDiskPath = join(process.cwd(), 'public', photo.filePath);
          try {
            if (existsSync(photoDiskPath)) {
              const buffer = await sharp(photoDiskPath).jpeg({ quality: 85 }).toBuffer();
              return {
                ...photo,
                base64Src: `data:image/jpeg;base64,${buffer.toString('base64')}`,
              };
            }
          } catch (err) {
            console.error(`Failed to convert WebP to JPEG for PDF: ${photo.filePath}`, err);
          }
          return { ...photo, base64Src: null };
        })
      );

      const workOrderForPdf = {
        ...updatedOrder,
        photos: photosWithBase64,
      };

      const settingsForPdf = {
        ...settings,
        logoPath: logoBase64,
      };

      const buffer = await renderToBuffer(
        React.createElement(WorkOrderDocument, { workOrder: workOrderForPdf, settings: settingsForPdf }) as any
      );

      const archiveDir = join(process.cwd(), 'public', 'archives');
      if (!existsSync(archiveDir)) {
        await mkdir(archiveDir, { recursive: true });
      }

      const fileName = `munkalap-${parsedWorkOrderId}-${Date.now()}.pdf`;
      const filePath = `/archives/${fileName}`;
      const fullPath = join(archiveDir, fileName);

      await writeFile(fullPath, buffer);

      await prisma.workOrder.update({
        where: { id: parsedWorkOrderId },
        data: { archivedPdfPath: filePath }
      });
    } catch (pdfError) {
      console.error('Failed to automatically archive PDF on Kiadva status change:', pdfError);
    }
  }

  await logActivity(parsedWorkOrderId, `Státusz módosítva: ${oldOrder?.status} -> ${parsedStatus}`);
  await triggerUpdate(parsedWorkOrderId);
  revalidatePath(`/t/${parsedWorkOrderId}`);
}

export async function updatePhotoDescription(photoId: string, description: string, workOrderId: string) {
  const parsedPhotoId = z.string().cuid().parse(photoId);
  const parsedDescription = z.string().trim().max(1000).parse(description);
  const parsedWorkOrderId = z.string().cuid().parse(workOrderId);

  await prisma.photo.update({
    where: { id: parsedPhotoId },
    data: { description: parsedDescription },
  });

  await triggerUpdate(parsedWorkOrderId);
  revalidatePath(`/t/${parsedWorkOrderId}`);
}

export async function deletePhoto(photoId: string, workOrderId: string) {
  const parsedPhotoId = z.string().cuid().parse(photoId);
  const parsedWorkOrderId = z.string().cuid().parse(workOrderId);

  const photo = await prisma.photo.findUnique({ where: { id: parsedPhotoId } });
  if (photo) {
    try {
      await unlink(join(process.cwd(), 'public', photo.filePath));
    } catch (e) {}
    await prisma.photo.delete({ where: { id: parsedPhotoId } });
    await logActivity(parsedWorkOrderId, 'Fotó törölve.');
  }
  await triggerUpdate(parsedWorkOrderId);
  revalidatePath(`/t/${parsedWorkOrderId}`);
}

export async function updateWorkOrderDetails(formData: FormData) {
  const rawData = {
    id: formData.get('id'),
    customerName: formData.get('customerName'),
    customerContact: formData.get('customerContact'),
    deviceType: formData.get('deviceType'),
    serialNumber: formData.get('serialNumber'),
    condition: formData.get('condition'),
    complaint: formData.get('complaint'),
    accessories: formData.get('accessories'),
    estimatedPrice: formData.get('estimatedPrice'),
    warranty: formData.get('warranty'),
    warrantyExpiry: formData.get('warrantyExpiry'),
    estimatedDone: formData.get('estimatedDone'),
  };

  const parsed = WorkOrderUpdateSchema.parse(rawData);

  await prisma.workOrder.update({
    where: { id: parsed.id },
    data: {
      customerName: parsed.customerName,
      customerContact: parsed.customerContact,
      deviceType: parsed.deviceType,
      serialNumber: parsed.serialNumber,
      condition: parsed.condition,
      complaint: parsed.complaint,
      accessories: parsed.accessories,
      estimatedPrice: parsed.estimatedPrice,
      warranty: parsed.warranty,
      warrantyExpiry: parsed.warrantyExpiry,
      estimatedDone: parsed.estimatedDone,
    },
  });

  await logActivity(parsed.id, 'Munkalap adatai módosítva.');
  await triggerUpdate(parsed.id);
  revalidatePath(`/t/${parsed.id}`);
  revalidatePath('/');
}

export async function updatePriority(workOrderId: string, priority: string) {
  const parsedWorkOrderId = z.string().cuid().parse(workOrderId);
  const parsedPriority = z.enum(PRIORITIES).parse(priority);

  const oldOrder = await prisma.workOrder.findUnique({ where: { id: parsedWorkOrderId } });
  await prisma.workOrder.update({
    where: { id: parsedWorkOrderId },
    data: { priority: parsedPriority },
  });

  await logActivity(parsedWorkOrderId, `Prioritás módosítva: ${oldOrder?.priority} -> ${parsedPriority}`);
  await triggerUpdate(parsedWorkOrderId);
  revalidatePath(`/t/${parsedWorkOrderId}`);
  revalidatePath('/');
}

export async function toggleSignatureQueue(workOrderId: string, status: boolean) {
  const parsedWorkOrderId = z.string().cuid().parse(workOrderId);
  const parsedStatus = z.boolean().parse(status);

  await prisma.workOrder.update({
    where: { id: parsedWorkOrderId },
    data: { isWaitingForSignature: parsedStatus }
  });

  await logActivity(parsedWorkOrderId, parsedStatus ? 'Munkalap aláírásra váró sorba helyezve.' : 'Munkalap eltávolítva az aláírási sorból.');
  await triggerUpdate(parsedWorkOrderId);
  revalidatePath(`/t/${parsedWorkOrderId}`);
  revalidatePath('/sign');
  revalidatePath('/');
}

export async function saveSignature(workOrderId: string, signatureData: string) {
  const parsed = SignatureSchema.parse({ workOrderId, signatureData });
  const settings = await getSettings();
  
  await prisma.workOrder.update({
    where: { id: parsed.workOrderId },
    data: { 
      signatureData: parsed.signatureData,
      signedAt: new Date(),
      isWaitingForSignature: false,
      signedDeclarationText: settings.declarationTemplate
    }
  });

  await logActivity(parsed.workOrderId, 'Munkalap digitálisan aláírva.');
  await recordSystemActivity('SUCCESS', `Munkalap aláírva: ${parsed.workOrderId}`, parsed.workOrderId);
  await triggerUpdate(parsed.workOrderId);
  revalidatePath(`/t/${parsed.workOrderId}`);
  revalidatePath('/sign');
  revalidatePath('/');
}

export async function voidSignature(workOrderId: string) {
  const parsedWorkOrderId = z.string().cuid().parse(workOrderId);

  await prisma.workOrder.update({
    where: { id: parsedWorkOrderId },
    data: { 
      signatureData: null,
      signedAt: null,
      signedDeclarationText: null,
      isWaitingForSignature: false
    }
  });

  await logActivity(parsedWorkOrderId, 'Aláírás érvénytelenítve.');
  await recordSystemActivity('WARNING', `Aláírás érvénytelenítve: ${parsedWorkOrderId}`, parsedWorkOrderId);
  await triggerUpdate(parsedWorkOrderId);
  revalidatePath(`/t/${parsedWorkOrderId}`);
  revalidatePath('/sign');
  revalidatePath('/');
}

export async function deleteWorkOrder(workOrderId: string) {
  const parsedWorkOrderId = z.string().cuid().parse(workOrderId);

  const order = await prisma.workOrder.findUnique({
    where: { id: parsedWorkOrderId },
    include: { photos: true }
  });

  if (!order) return { success: false };

  for (const photo of order.photos) {
    try {
      await unlink(join(process.cwd(), 'public', photo.filePath));
    } catch (e) {}
  }

  if (order.archivedPdfPath) {
    try {
      await unlink(join(process.cwd(), 'public', order.archivedPdfPath));
    } catch (e) {}
  }

  await prisma.$transaction([
    prisma.statusLog.deleteMany({ where: { workOrderId: parsedWorkOrderId } }),
    prisma.note.deleteMany({ where: { workOrderId: parsedWorkOrderId } }),
    prisma.lineItem.deleteMany({ where: { workOrderId: parsedWorkOrderId } }),
    prisma.photo.deleteMany({ where: { workOrderId: parsedWorkOrderId } }),
    prisma.workOrder.delete({ where: { id: parsedWorkOrderId } }),
  ]);

  await triggerUpdate();
  revalidatePath('/');
  const redirect = (await import('next/navigation')).redirect;
  redirect('/');
}

export async function triggerManualBackup() {
  const { runBackupJob } = await import('./backup');
  await runBackupJob();
  revalidatePath('/settings');
  revalidatePath('/');
}

export async function triggerRestoreBackup(formData: FormData) {
  const file = formData.get('backupFile') as File;
  if (!file || file.size === 0) {
    throw new Error('Nem választott ki fájlt.');
  }

  const tempDir = join(process.cwd(), 'prisma/data/temp');
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  const tempPath = join(tempDir, `restore-${Date.now()}.zip`);
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(tempPath, Buffer.from(arrayBuffer));

  try {
    const { restoreBackup } = await import('./backup');
    await restoreBackup(tempPath);
  } finally {
    if (existsSync(tempPath)) {
      await unlink(tempPath);
    }
  }

  revalidatePath('/settings');
  revalidatePath('/');
}

export async function sendNotificationEmailAction(workOrderId: string, templateKey: string) {
  try {
    const parsedId = z.string().cuid().parse(workOrderId);
    const parsedTemplateKey = z.enum(['intake', 'diagnostic', 'waiting_parts', 'ready', 'unrepairable', 'warranty_expiring']).parse(templateKey);

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: parsedId }
    });

    if (!workOrder || !workOrder.customerContact) {
      return { success: false, error: 'Munkalap vagy elérhetőség nem található.' };
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = workOrder.customerContact.match(emailRegex);
    if (!match) {
      return { success: false, error: 'Nem található érvényes email cím az ügyfél adatai között.' };
    }
    const toEmail = match[0];

    const settings = await getSettings();
    const { NOTIFICATION_TEMPLATES, compileTemplate, sendEmailNotification } = await import('./notifications');
    const template = NOTIFICATION_TEMPLATES[parsedTemplateKey];
    const message = compileTemplate(template.text, workOrder, settings);

    await sendEmailNotification(settings, toEmail, `${settings.workshopName} - Értesítés`, message);
    await logActivity(parsedId, `Email értesítés elküldve (${template.title}) -> ${toEmail}`);
    return { success: true };
  } catch (err: any) {
    console.error('Error sending Email:', err);
    return { success: false, error: err.message || 'Ismeretlen hiba történt az email küldése során.' };
  }
}

export async function sendNotificationSMSAction(workOrderId: string, templateKey: string) {
  try {
    const parsedId = z.string().cuid().parse(workOrderId);
    const parsedTemplateKey = z.enum(['intake', 'diagnostic', 'waiting_parts', 'ready', 'unrepairable', 'warranty_expiring']).parse(templateKey);

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: parsedId }
    });

    if (!workOrder || !workOrder.customerContact) {
      return { success: false, error: 'Munkalap vagy elérhetőség nem található.' };
    }

    const phoneRegex = /(?:\+?)[0-9\s-]{7,15}/;
    const match = workOrder.customerContact.match(phoneRegex);
    if (!match) {
      return { success: false, error: 'Nem található érvényes telefonszám az ügyfél adatai között.' };
    }
    const toPhone = match[0].replace(/\s+/g, '');

    const settings = await getSettings();
    const { NOTIFICATION_TEMPLATES, compileTemplate, sendSMSNotification } = await import('./notifications');
    const template = NOTIFICATION_TEMPLATES[parsedTemplateKey];
    const message = compileTemplate(template.text, workOrder, settings);

    await sendSMSNotification(settings, toPhone, message);
    await logActivity(parsedId, `SMS értesítés elküldve (${template.title}) -> ${toPhone}`);
    return { success: true };
  } catch (err: any) {
    console.error('Error sending SMS:', err);
    return { success: false, error: err.message || 'Ismeretlen hiba történt az SMS küldése során.' };
  }
}

export async function getSMSBalanceAction() {
  try {
    const settings = await getSettings();
    if (!settings.smsApiUrl || !settings.smsApiKey) {
      return { isConfigured: false };
    }

    if (settings.smsApiUrl.includes('bulkgate.com')) {
      const [appId, appToken] = (settings.smsApiKey || '').split(':');
      if (!appId || !appToken) {
        return { isConfigured: true, error: 'A BulkGate hitelesítéshez "ApplicationID:ApplicationToken" formátum szükséges az API kulcs mezőben.' };
      }

      const res = await fetch('https://portal.bulkgate.com/api/1.0/simple/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          application_id: appId,
          application_token: appToken
        }),
        next: { revalidate: 60 }
      });

      if (!res.ok) {
        return { isConfigured: true, error: `BulkGate returned HTTP ${res.status}` };
      }

      const data = await res.json().catch(() => null);
      if (data && (data.status === 'success' || data.balance)) {
        const balanceVal = Number(data.balance?.amount ?? data.data?.credit ?? 0);
        const currencyVal = data.balance?.currency ?? data.data?.currency ?? 'EUR';
        
        let isLow = false;
        if (currencyVal === 'HUF') {
          isLow = balanceVal < 1000;
        } else if (currencyVal === 'EUR') {
          isLow = balanceVal < 3;
        } else {
          isLow = balanceVal < 10;
        }

        return {
          isConfigured: true,
          success: true,
          balance: balanceVal,
          currency: currencyVal,
          isLow: isLow
        };
      } else {
        return {
          isConfigured: true,
          success: false,
          error: data?.error || 'Ismeretlen BulkGate API hiba'
        };
      }
    }

    if (settings.smsApiUrl.includes('seeme.hu') || settings.smsApiUrl.includes('seememobile.com')) {
      const params = new URLSearchParams({
        key: settings.smsApiKey,
        method: 'balance',
        format: 'json'
      });
      const url = `${settings.smsApiUrl}${settings.smsApiUrl.includes('?') ? '&' : '?'}${params.toString()}`;
      
      const res = await fetch(url, { next: { revalidate: 60 } }); // Cache it for 1 minute
      if (!res.ok) {
        return { isConfigured: true, error: `SeeMe returned HTTP ${res.status}` };
      }
      
      const data = await res.json().catch(() => null);
      if (data && data.result === 'OK') {
        const balanceVal = Number(data.balance);
        return {
          isConfigured: true,
          success: true,
          balance: balanceVal,
          currency: data.currency || 'HUF',
          isLow: balanceVal < 1000
        };
      } else {
        return {
          isConfigured: true,
          success: false,
          error: data?.message || 'Ismeretlen SeeMe API hiba'
        };
      }
    }
    
    return { isConfigured: false };
  } catch (err: any) {
    console.error('Error fetching SMS balance:', err);
    return { isConfigured: false, error: err.message };
  }
}
