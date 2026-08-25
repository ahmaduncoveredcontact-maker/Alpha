-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  phone_number TEXT,
  business_hours TEXT,
  contact_email TEXT,
  services_offered TEXT,
  price_ranges TEXT,
  service_area TEXT,
  calendar_link TEXT,
  voice_agent_instructions TEXT NOT NULL,
  website_contact_form_url TEXT,
  outbound_calling_enabled BOOLEAN DEFAULT false,
  consent_confirmed BOOLEAN DEFAULT false,
  review_business_name TEXT,
  google_review_link TEXT,
  delivery_address TEXT,
  manager_access_granted BOOLEAN DEFAULT false,
  access_code_hash TEXT NOT NULL,
  vapi_assistant_id TEXT,
  qr_main_url TEXT,
  qr_wallpaper_url TEXT,
  qr_sticker_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client review checks (for auto-responder)
CREATE TABLE client_review_checks (
  client_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  last_checked_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by slug
CREATE INDEX idx_clients_slug ON clients(slug);
