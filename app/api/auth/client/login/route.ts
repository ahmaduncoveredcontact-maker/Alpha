import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { setClientSession } from '@/lib/auth/session';
import bcrypt from 'bcrypt';
import { ClientLoginSchema } from '@/lib/validators/schemas';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = ClientLoginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { slug, access_code } = parsed.data;
  const { data: client, error } = await supabaseServer.from('clients').select('access_code_hash').eq('slug', slug).single();
  if (error || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  const isValid = await bcrypt.compare(access_code, client.access_code_hash);
  if (!isValid) return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
  setClientSession(slug);
  return NextResponse.json({ success: true });
}