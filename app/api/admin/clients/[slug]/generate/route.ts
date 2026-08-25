import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { createVapiAssistant } from '@/lib/services/vapi';
import { generateQRImages } from '@/lib/services/qr';

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const { data: client, error } = await supabaseServer.from('clients').select('*').eq('slug', params.slug).single();
  if (error || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  let assistantId;
  try {
    const result = await createVapiAssistant({
      name: client.business_name,
      instructions: client.voice_agent_instructions,
      schedulingLink: client.calendar_link || undefined,
    });
    assistantId = result.assistantId;
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create Vapi assistant' }, { status: 500 });
  }

  const reviewLink = client.google_review_link || `${process.env.NEXT_PUBLIC_BASE_URL}/r/${client.slug}`;
  let qrUrls;
  try {
    qrUrls = await generateQRImages({ slug: client.slug, businessName: client.business_name, reviewLink, primaryColor: '#2563EB' });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to generate QR codes' }, { status: 500 });
  }

  const { data: updated, error: updateError } = await supabaseServer
    .from('clients')
    .update({ vapi_assistant_id: assistantId, qr_main_url: qrUrls.mainUrl, qr_wallpaper_url: qrUrls.wallpaperUrl, qr_sticker_url: qrUrls.stickerUrl })
    .eq('id', client.id)
    .select()
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ message: 'Generate completed successfully', client: updated });
}