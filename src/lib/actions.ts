'use server'

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function createWorkOrder(formData: FormData) {
  const customerName = formData.get('customerName') as string;
  const customerContact = formData.get('customerContact') as string;
  const deviceType = formData.get('deviceType') as string;
  const serialNumber = formData.get('serialNumber') as string;
  const condition = formData.get('condition') as string;
  const complaint = formData.get('complaint') as string;

  const workOrder = await prisma.workOrder.create({
    data: {
      customerName,
      customerContact,
      deviceType,
      serialNumber,
      condition,
      complaint,
      status: 'Átvétel alatt',
    },
  });

  const redirect = (await import('next/navigation')).redirect;
  redirect(`/t/${workOrder.id}`);
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

  revalidatePath(`/t/${workOrderId}`);
}
