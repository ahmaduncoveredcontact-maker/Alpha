import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL!;

export async function sendClientCredentials(params: {
  toEmail: string;
  businessName: string;
  slug: string;
  accessCode: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.toEmail,
    subject: `Your ${params.businessName} Live Page Access`,
    html: `
      <h2>Welcome, ${params.businessName}!</h2>
      <p>Your live page: <a href="${process.env.NEXT_PUBLIC_BASE_URL}/live/${params.slug}">${process.env.NEXT_PUBLIC_BASE_URL}/live/${params.slug}</a></p>
      <p><strong>Access code:</strong> ${params.accessCode}</p>
    `,
  });
}

export async function sendCallSummaryEmail(params: {
  toEmail: string;
  businessName: string;
  customerName: string;
  customerPhone: string;
  summary: string;
  bookedTime?: string;
}) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.toEmail,
    subject: `New Call for ${params.businessName}`,
    html: `
      <h2>📞 Call Received</h2>
      <p><strong>Customer:</strong> ${params.customerName} (${params.customerPhone})</p>
      <p><strong>Summary:</strong> ${params.summary}</p>
      ${params.bookedTime ? `<p><strong>Booked:</strong> ${new Date(params.bookedTime).toLocaleString()}</p>` : ''}
    `,
  });
}