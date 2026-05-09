'use server';

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { archivePdf as dbArchive } from './actions';

export async function savePdfToArchive(workOrderId: string, base64Data: string) {
  try {
    const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
    const fileName = `munkalap-${workOrderId}-${Date.now()}.pdf`;
    const filePath = `/archives/${fileName}`;
    const fullPath = join(process.cwd(), 'public', filePath);
    
    await writeFile(fullPath, buffer);
    await dbArchive(workOrderId, filePath);
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Archive error:', error);
    return { success: false };
  }
}
