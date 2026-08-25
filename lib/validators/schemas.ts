import { z } from 'zod';

export const OnboardingSchema = z.object({
  business_name: z.string().min(1),
  phone_number: z.string().optional(),
  business_hours: z.string().optional(),
  contact_email: z.string().email().optional(),
  services_offered: z.string().optional(),
  price_ranges: z.string().optional(),
  service_area: z.string().optional(),
  calendar_link: z.string().url().optional(),
  voice_agent_instructions: z.string().min(1),
  website_contact_form_url: z.string().url().optional(),
  outbound_calling_enabled: z.boolean().default(false),
  consent_confirmed: z.boolean().default(false),
  review_business_name: z.string().optional(),
  google_review_link: z.string().url().optional(),
  delivery_address: z.string().optional(),
  manager_access_granted: z.boolean().default(false),
  access_code: z.string().optional(),
});

export const LeadWebhookSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  service: z.string().min(1),
  slug: z.string().min(1),
});

export const ClientLoginSchema = z.object({
  slug: z.string().min(1),
  access_code: z.string().min(1),
});
