import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { parseVapiWebhook } from '@/lib/services/vapi';
import { appendCallLog } from '@/lib/services/googleSheets';
import { sendCallSummaryEmail } from '@/lib/services/resend';

export async function POST(request: Request) {
  const payload = await request.json();
  const callData = parseVapiWebhook(payload);
  if (!callData.assistantId) return NextResponse.json({ error: 'Missing assistant ID' }, { status: 400 });
  const { data: client, error } = await supabaseServer.from('clients').select('*').eq('vapi_assistant_id', callData.assistantId).single();
  if (error || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const statusMap: Record<string, 'Booked' | 'General Inquiry' | 'No Answer'> = {
    booked: 'Booked', inquiry: 'General Inquiry', 'no-answer': 'No Answer'
  };
  const status = callData.status ? statusMap[callData.status] || 'General Inquiry' : 'General Inquiry';
  const logEntry = {
    client_slug: client.slug,
    timestamp: new Date().toISOString(),
    call_type: 'Inbound Receptionist' as const,
    customer_name: callData.customerName || 'Unknown',
    customer_phone: callData.customerPhone || '',
    summary: callData.summary || '',
    status,
    booked_time: callData.bookedTime || null,
    recording_url: callData.recordingUrl || null,
  };
  await appendCallLog(logEntry);
  if (client.contact_email) {
    try {
      await sendCallSummaryEmail({
        toEmail: client.contact_email,
        businessName: client.business_name,
        customerName: logEntry.customer_name,
        customerPhone: logEntry.customer_phone,
        summary: logEntry.summary,
        bookedTime: logEntry.booked_time || undefined,
      });
    } catch (e) { console.error('Email error:', e); }
  }
  return NextResponse.json({ success: true });
}