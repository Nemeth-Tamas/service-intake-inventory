import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publishUpdate } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Érvénytelen JSON törzs' }, { status: 400 });
    }

    console.log('Incoming SMS Webhook payload:', JSON.stringify(body));

    // Handle standard capcom6/android-sms-gateway payload format
    const event = body.event;
    const smsPayload = body.payload;

    if (!smsPayload || !smsPayload.sender || !smsPayload.message) {
      // Return 200 to acknowledge anyway to prevent retry loops for invalid/heartbeat events
      return NextResponse.json({ success: true, message: 'Figyelmen kívül hagyott vagy hiányos payload.' });
    }

    const sender = smsPayload.sender;
    const messageText = smsPayload.message;
    const cleanSender = cleanPhoneNumber(sender);

    if (cleanSender.length < 7) {
      return NextResponse.json({ success: true, message: 'Telefonszám túl rövid a kereséshez.' });
    }

    // Retrieve all active or non-archived work orders
    const workOrders = await prisma.workOrder.findMany({
      where: {
        customerContact: { not: null }
      }
    });

    // Suffix match on the last 9 digits (common for Hungarian mobile numbers) or min length of either
    const matchedOrders = workOrders.filter(order => {
      const cleanContact = cleanPhoneNumber(order.customerContact || '');
      if (cleanContact.length < 7) return false;
      const minLen = Math.min(cleanSender.length, cleanContact.length);
      const suffixLen = Math.min(9, minLen);
      return cleanSender.slice(-suffixLen) === cleanContact.slice(-suffixLen);
    });

    if (matchedOrders.length === 0) {
      console.log(`Nem találtunk hozzá tartozó munkalapot ehhez a számtól: ${sender}`);
      // Record global activity log for unrecognized incoming SMS
      await prisma.activityLog.create({
        data: {
          type: 'WARNING',
          message: `SMS érkezett ismeretlen számtól (${sender}): ${messageText}`,
        }
      });
      await publishUpdate('dashboard');
      return NextResponse.json({ success: true, matchedCount: 0 });
    }

    for (const order of matchedOrders) {
      // 1. Create a note on the work order
      await prisma.note.create({
        data: {
          workOrderId: order.id,
          text: `[BEJÖVŐ SMS] ${messageText}`
        }
      });

      // 2. Record system activity log
      await prisma.activityLog.create({
        data: {
          type: 'INFO',
          message: `SMS érkezett ügyféltől (${sender}) a(z) ${order.id} munkalaphoz: ${messageText}`,
          entityId: order.id
        }
      });

      // 3. Trigger realtime updates
      await publishUpdate(`order-${order.id}`);
    }

    await publishUpdate('dashboard');

    return NextResponse.json({ success: true, matchedCount: matchedOrders.length });
  } catch (err: any) {
    console.error('Hiba történt a bejövő SMS feldolgozása során:', err);
    return NextResponse.json({ error: err.message || 'Belső szerverhiba' }, { status: 500 });
  }
}
