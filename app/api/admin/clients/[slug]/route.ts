import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const { data: client, error } = await supabaseServer.from('clients').select('*').eq('slug', params.slug).single();
  if (error || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  const body = await request.json();
  const update: any = {};
  if (typeof body.outbound_calling_enabled === 'boolean') update.outbound_calling_enabled = body.outbound_calling_enabled;
  if (typeof body.consent_confirmed === 'boolean') update.consent_confirmed = body.consent_confirmed;
  if (typeof body.manager_access_granted === 'boolean') update.manager_access_granted = body.manager_access_granted;
  if (body.google_review_link !== undefined) update.google_review_link = body.google_review_link;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  const { data: client, error } = await supabaseServer.from('clients').update(update).eq('slug', params.slug).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(client);
}