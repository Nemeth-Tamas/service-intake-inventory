'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { publishUpdate } from './realtime';

// Helper to trigger real-time updates
async function triggerUpdate(workOrderId?: string) {
  if (workOrderId) {
    await publishUpdate(`order-${workOrderId}`);
  }
  await publishUpdate('dashboard');
}

export async function createWorkOrder(formData: FormData) {
  const customerName = formData.get('customerName') as string;
  const customerContact = formData.get('customerContact') as string;
  const deviceType = formData.get('deviceType') as string;
  const serialNumber = formData.get('serialNumber') as string;
  const condition = formData.get('condition') as string;
  const complaint = formData.get('complaint') as string;
  const priority = formData.get('priority') as string || 'Normál';
  const estimatedDoneStr = formData.get('estimatedDone') as string;
  const estimatedDone = estimatedDoneStr ? new Date(estimatedDoneStr) : null;

  const workOrder = await prisma.workOrder.create({
    data: {
      customerName,
      customerContact,
      deviceType,
      serialNumber,
      condition,
      complaint,
      priority,
      estimatedDone,
      status: 'Átvétel alatt',
      statusHistory: {
        create: { status: 'Átvétel alatt' }
      }
    },
  });

  await triggerUpdate();
  const redirect = (await import('next/navigation')).redirect;
  redirect(`/t/${workOrder.id}`);
}

export async function getSettings() {
  let settings = await prisma.settings.findFirst({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: 1, baseUrl: 'http://localhost:3000' }
    });
  }
  return settings;
}

export async function updateSettings(baseUrl: string) {
  await prisma.settings.update({
    where: { id: 1 },
    data: { baseUrl }
  });
  revalidatePath('/');
  revalidatePath('/settings');
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
}

export async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(now.setHours(23, 59, 59, 999));

  const [urgent, today, ready] = await Promise.all([
    prisma.workOrder.count({ where: { priority: 'Sürgős', NOT: { status: 'Kiadva' } } }),
    prisma.workOrder.count({ where: { estimatedDone: { gte: todayStart, lte: todayEnd }, NOT: { status: 'Kiadva' } } }),
    prisma.workOrder.count({ where: { status: 'Kész / Átvehető' } })
  ]);

  return { urgent, today, ready };
}

export async function getPreviousRepairs(serialNumber: string, currentId: string) {
  if (!serialNumber || serialNumber === '-' || serialNumber.length < 3) return [];
  return prisma.workOrder.findMany({
    where: { 
      serialNumber,
      NOT: { id: currentId }
    },
    include: { photos: true, notes: true },
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
  const workOrderId = formData.get('workOrderId') as string;
  const pdfBase64 = formData.get('pdfData') as string;

  if (!workOrderId || !pdfBase64) return { success: false };

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
  const workOrderId = formData.get('workOrderId') as string;
  const text = formData.get('text') as string;

  await prisma.note.create({
    data: {
      workOrderId,
      text,
    },
  });

  await triggerUpdate(workOrderId);
  revalidatePath(`/t/${workOrderId}`);
}

export async function updateStatus(workOrderId: string, status: string) {
  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { 
      status,
      statusHistory: {
        create: { status }
      }
    },
  });

  await triggerUpdate(workOrderId);
  revalidatePath(`/t/${workOrderId}`);
}

export async function updatePhotoDescription(photoId: string, description: string, workOrderId: string) {
  await prisma.photo.update({
    where: { id: photoId },
    data: { description },
  });

  await triggerUpdate(workOrderId);
  revalidatePath(`/t/${workOrderId}`);
}

export async function deletePhoto(photoId: string, workOrderId: string) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (photo) {
    try {
      await unlink(join(process.cwd(), 'public', photo.filePath));
    } catch (e) {}
    await prisma.photo.delete({ where: { id: photoId } });
  }
  await triggerUpdate(workOrderId);
  revalidatePath(`/t/${workOrderId}`);
}

export async function updateWorkOrderDetails(formData: FormData) {
  const id = formData.get('id') as string;
  const customerName = formData.get('customerName') as string;
  const customerContact = formData.get('customerContact') as string;
  const deviceType = formData.get('deviceType') as string;
  const serialNumber = formData.get('serialNumber') as string;
  const condition = formData.get('condition') as string;
  const complaint = formData.get('complaint') as string;
  const estimatedDoneStr = formData.get('estimatedDone') as string;
  const estimatedDone = estimatedDoneStr ? new Date(estimatedDoneStr) : null;

  await prisma.workOrder.update({
    where: { id },
    data: {
      customerName,
      customerContact,
      deviceType,
      serialNumber,
      condition,
      complaint,
      estimatedDone,
    },
  });

  await triggerUpdate(id);
  revalidatePath(`/t/${id}`);
  revalidatePath('/');
}

export async function updatePriority(workOrderId: string, priority: string) {
  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { priority },
  });

  await triggerUpdate(workOrderId);
  revalidatePath(`/t/${workOrderId}`);
  revalidatePath('/');
}

export async function deleteWorkOrder(workOrderId: string) {
  const order = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
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
    prisma.statusLog.deleteMany({ where: { workOrderId } }),
    prisma.note.deleteMany({ where: { workOrderId } }),
    prisma.photo.deleteMany({ where: { workOrderId } }),
    prisma.workOrder.delete({ where: { id: workOrderId } }),
  ]);

  await triggerUpdate();
  revalidatePath('/');
  const redirect = (await import('next/navigation')).redirect;
  redirect('/');
}
