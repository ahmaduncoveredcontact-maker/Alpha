import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { LeadWebhookSchema } from '@/lib/validators/schemas';
import { startOutboundCall } from '@/lib/services/vapi';
import { appendCallLog } from '@/lib/services/googleSheets';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = LeadWebhookSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const { name, phone, service, slug } = parsed.data;
  const { data: client, error } = await supabaseServer.from('clients').select('*').eq('slug', slug).single();
  if (error || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const canCall = client.outbound_calling_enabled && client.consent_confirmed;
  const logEntry = {
    client_slug: slug,
    timestamp: new Date().toISOString(),
    call_type: 'Web Lead Callback' as const,
    customer_name: name,
    customer_phone: phone,
    summary: service,
    status: canCall ? 'No Answer' : 'General Inquiry',
    booked_time: null,
    recording_url: null,
  };
  await appendCallLog(logEntry);

  if (canCall && client.vapi_assistant_id) {
    try {
      await startOutboundCall({ assistantId: client.vapi_assistant_id, phoneNumber: phone, leadName: name, service });
    } catch (e) { console.error('Outbound call failed:', e); }
  }
  return NextResponse.json({ success: true });
}