const VAPI_BASE = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_API_KEY = process.env.VAPI_API_KEY;

export async function createVapiAssistant(params: {
  name: string;
  instructions: string;
  schedulingLink?: string;
}) {
  const response = await fetch(`${VAPI_BASE}/assistant`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: params.name,
      systemPrompt: params.instructions,
      scheduling: params.schedulingLink ? { url: params.schedulingLink } : undefined,
    }),
  });
  if (!response.ok) throw new Error('Vapi assistant creation failed');
  const data = await response.json();
  return { assistantId: data.id };
}

export async function startOutboundCall(params: {
  assistantId: string;
  phoneNumber: string;
  leadName: string;
  service: string;
}) {
  const response = await fetch(`${VAPI_BASE}/call`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assistantId: params.assistantId,
      to: params.phoneNumber,
      customPayload: { leadName: params.leadName, service: params.service },
    }),
  });
  if (!response.ok) throw new Error('Vapi outbound call failed');
  const data = await response.json();
  return { callId: data.id };
}

export function parseVapiWebhook(payload: any) {
  return {
    callId: payload.callId || payload.id,
    assistantId: payload.assistantId,
    customerName: payload.customerName || payload.callerName,
    customerPhone: payload.customerPhone || payload.callerPhone,
    summary: payload.summary || payload.transcript,
    status: payload.status || (payload.booked ? 'booked' : 'inquiry'),
    bookedTime: payload.bookedTime,
    recordingUrl: payload.recordingUrl,
  };
}