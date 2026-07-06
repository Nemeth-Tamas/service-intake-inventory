import { z } from 'zod';

export const STATUSES = [
  "Átvétel alatt",
  "Diagnosztika",
  "Alkatrészre vár",
  "Javítás alatt",
  "Kész / Átvehető",
  "Javíthatatlan",
  "Kiadva",
] as const;

export const PRIORITIES = [
  "Sürgős",
  "Magas",
  "Normál",
  "Alacsony",
] as const;

export const WorkOrderCreateSchema = z.object({
  customerName: z.string().trim().max(255).nullish().transform(val => val || null),
  customerContact: z.string().trim().max(255).nullish().transform(val => val || null),
  deviceType: z.string().trim().max(255).nullish().transform(val => val || null),
  serialNumber: z.string().trim().max(255).nullish().transform(val => val || null),
  condition: z.string().trim().max(2000).nullish().transform(val => val || null),
  complaint: z.string().trim().max(2000).nullish().transform(val => val || null),
  accessories: z.string().trim().max(1000).nullish().transform(val => val || null),
  estimatedPrice: z.string().trim().max(255).nullish().transform(val => val || null),
  warranty: z.string().trim().max(255).nullish().transform(val => val || null),
  warrantyExpiry: z.preprocess((val) => {
    if (!val) return null;
    const d = new Date(val as string);
    return isNaN(d.getTime()) ? null : d;
  }, z.date().nullable()),
  priority: z.enum(PRIORITIES).default('Normál'),
  estimatedDone: z.preprocess((val) => {
    if (!val) return null;
    const d = new Date(val as string);
    return isNaN(d.getTime()) ? null : d;
  }, z.date().nullable()),
});

export const WorkOrderUpdateSchema = WorkOrderCreateSchema.extend({
  id: z.string().cuid(),
});

export const LineItemSchema = z.object({
  workOrderId: z.string().cuid(),
  description: z.string().trim().min(1, 'A leírás nem lehet üres').max(255),
  amount: z.preprocess((val) => {
    if (typeof val === 'number') return val;
    const parsed = parseInt(val as string);
    return isNaN(parsed) ? 0 : parsed;
  }, z.number().int().min(0, 'Az összeg nem lehet negatív')),
});

const urlPreprocessor = (val: any) => {
  if (typeof val !== 'string' || val.trim() === '') return val;
  let s = val.trim();
  if (!/^https?:\/\//i.test(s)) {
    s = 'https://' + s;
  }
  return s;
};

export const SettingsSchema = z.object({
  baseUrl: z.preprocess(urlPreprocessor, z.string().url('A bázis URL formátuma érvénytelen').max(255)),
  workshopName: z.string().trim().min(1, 'A műhely név nem lehet üres').max(255),
  technicianName: z.string().trim().max(255).nullish().transform(val => val || null),
  address: z.string().trim().max(500).nullish().transform(val => val || null),
  phone: z.string().trim().max(50).nullish().transform(val => val || null),
  email: z.string().trim().email('Az email formátuma érvénytelen').or(z.literal('')).nullish().transform(val => val || null),
  website: z.preprocess(urlPreprocessor, z.string().url('A weboldal formátuma érvénytelen').or(z.literal('')).nullish().transform(val => val || null)),
  googleReviewUrl: z.preprocess(urlPreprocessor, z.string().url('A Google értékelés URL formátuma érvénytelen').or(z.literal('')).nullish().transform(val => val || null)),
  declarationTemplate: z.string().trim().max(5000).optional(),
  backupInterval: z.enum(['none', 'daily', 'weekly']).default('none'),
  nasBackupPath: z.string().trim().max(1000).nullish().transform(val => val || null),
  smtpHost: z.string().trim().nullish().transform(val => val || null),
  smtpPort: z.preprocess((val) => {
    if (val === null || val === undefined || val === '') return null;
    const p = parseInt(val as string);
    return isNaN(p) ? null : p;
  }, z.number().int().nullish()).transform(val => val || null),
  smtpUser: z.string().trim().nullish().transform(val => val || null),
  smtpPass: z.string().trim().nullish().transform(val => val || null),
  smtpFrom: z.string().trim().nullish().transform(val => val || null),
  smsApiUrl: z.preprocess(urlPreprocessor, z.string().url('Az SMS API URL formátuma érvénytelen').or(z.literal('')).nullish().transform(val => val || null)),
  smsApiKey: z.string().trim().nullish().transform(val => val || null),
  smsSender: z.string().trim().nullish().transform(val => val || null),
});

export const SignatureSchema = z.object({
  workOrderId: z.string().cuid(),
  signatureData: z.string().min(1, 'Az aláírás nem lehet üres'),
});

export const PhotoUploadSchema = z.object({
  workOrderId: z.string().cuid(),
  file: z.any()
    .refine((file) => {
      return file && typeof file === 'object' && 'size' in file && file.size > 0;
    }, 'A fájl nem lehet üres')
    .refine((file) => {
      if (!file || !('name' in file)) return false;
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'].includes(extension || '');
    }, 'Csak képfájlok tölthetők fel (JPG, PNG, HEIC, WEBP)'),
});
