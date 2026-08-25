export interface Client {
  id: string;
  slug: string;
  business_name: string;
  phone_number: string | null;
  business_hours: string | null;
  contact_email: string | null;
  services_offered: string | null;
  price_ranges: string | null;
  service_area: string | null;
  calendar_link: string | null;
  voice_agent_instructions: string;
  website_contact_form_url: string | null;
  outbound_calling_enabled: boolean;
  consent_confirmed: boolean;
  review_business_name: string | null;
  google_review_link: string | null;
  delivery_address: string | null;
  manager_access_granted: boolean;
  access_code_hash: string;
  vapi_assistant_id: string | null;
  qr_main_url: string | null;
  qr_wallpaper_url: string | null;
  qr_sticker_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  client_slug: string;
  timestamp: string;
  call_type: 'Inbound Receptionist' | 'Web Lead Callback';
  customer_name: string;
  customer_phone: string;
  summary: string;
  status: 'Booked' | 'General Inquiry' | 'No Answer';
  booked_time: string | null;
  recording_url: string | null;
}

export interface LeadPayload {
  name: string;
  phone: string;
  service: string;
  slug: string;
}

export interface VapiCallEndPayload {
  // Adjust based on actual Vapi webhook structure
  callId: string;
  assistantId: string;
  customerName?: string;
  customerPhone?: string;
  summary?: string;
  status?: 'booked' | 'inquiry' | 'no-answer';
  bookedTime?: string;
  recordingUrl?: string;
}

export interface ReviewCheckResult {
  clientId: string;
  newReviews: {
    reviewId: string;
    reviewerName?: string;
    rating: number;
    text: string;
    createTime: string;
  }[];
}
