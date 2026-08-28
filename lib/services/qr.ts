import QRCode from 'qrcode';
import { supabaseServer } from '@/lib/supabase/server';

export async function generateQRImages(params: {
  slug: string;
  businessName: string;
  reviewLink: string;
  primaryColor?: string;
}): Promise<{ mainUrl: string; wallpaperUrl: string; stickerUrl: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const qrData = `${baseUrl}/r/${params.slug}`;

  const mainBuffer = await QRCode.toBuffer(qrData, {
    width: 500,
    margin: 2,
    color: { dark: params.primaryColor || '#2563EB', light: '#FFFFFF' },
  });
  const wallpaperBuffer = await QRCode.toBuffer(qrData, {
    width: 1200,
    margin: 4,
    color: { dark: params.primaryColor || '#2563EB', light: '#F0F4FF' },
  });
  const stickerBuffer = await QRCode.toBuffer(qrData, {
    width: 300,
    margin: 1,
    color: { dark: params.primaryColor || '#2563EB', light: '#FFFFFF' },
  });

  const upload = async (buffer: Buffer, filename: string) => {
    const { data, error } = await supabaseServer.storage
      .from('qrcodes')
      .upload(`${params.slug}/${filename}`, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });
    if (error) throw new Error(`QR upload failed: ${error.message}`);
    const { data: urlData } = supabaseServer.storage.from('qrcodes').getPublicUrl(`${params.slug}/${filename}`);
    return urlData.publicUrl;
  };

  const now = Date.now();
  const mainUrl = await upload(mainBuffer, `main-${now}.png`);
  const wallpaperUrl = await upload(wallpaperBuffer, `wallpaper-${now}.png`);
  const stickerUrl = await upload(stickerBuffer, `sticker-${now}.png`);

  return { mainUrl, wallpaperUrl, stickerUrl };
}