import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || '',
    'X-Title': 'Alpha AI',
  },
});

export async function generateReviewReply(params: {
  businessName: string;
  serviceArea: string;
  reviewerName?: string;
  reviewText: string;
}): Promise<string> {
  const prompt = `
You are the owner of "${params.businessName}" in ${params.serviceArea}.
A customer left a 5-star review: "${params.reviewText}"

Write a short, warm, genuine thank-you reply (2-3 sentences) that:
- Thanks the customer by name if available (use "Customer" if not)
- Mentions the business name and service area
- Varies the wording – do not use a generic template
`;
  const response = await openai.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content?.trim() || 'Thank you for your kind review! We appreciate your support.';
}