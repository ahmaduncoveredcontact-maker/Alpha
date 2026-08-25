import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { OnboardingSchema } from '@/lib/validators/schemas';
import { generateSlug } from '@/lib/utils/slugify';
import { generateAccessCode } from '@/lib/utils/generateCode';
import bcrypt from 'bcrypt';

export async function GET() {
  const { data: clients, error } = await supabaseServer.from('clients').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = OnboardingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  const data = parsed.data;
  const slug = data.slug || generateSlug(data.business_name);
  const accessCode = data.access_code || generateAccessCode(6);
  const hashed = await bcrypt.hash(accessCode, 10);
  const { data: client, error } = await supabaseServer.from('clients').insert({
    slug, business_name: data.business_name, phone_number: data.phone_number || null,
    business_hours: data.business_hours || null, contact_email: data.contact_email || null,
    services_offered: data.services_offered || null, price_ranges: data.price_ranges || null,
    service_area: data.service_area || null, calendar_link: data.calendar_link || null,
    voice_agent_instructions: data.voice_agent_instructions,
    website_contact_form_url: data.website_contact_form_url || null,
    outbound_calling_enabled: data.outbound_calling_enabled || false,
    consent_confirmed: data.consent_confirmed || false,
    review_business_name: data.review_business_name || null,
    google_review_link: data.google_review_link || null,
    delivery_address: data.delivery_address || null,
    manager_access_granted: data.manager_access_granted || false,
    access_code_hash: hashed,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (client.contact_email) {
    try {
      const { sendClientCredentials } = await import('@/lib/services/resend');
      await sendClientCredentials({ toEmail: client.contact_email, businessName: client.business_name, slug: client.slug, accessCode });
    } catch (e) { console.error('Email error:', e); }
  }
  return NextResponse.json({ id: client.id, slug: client.slug, access_code: accessCode });
}