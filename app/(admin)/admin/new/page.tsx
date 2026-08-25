"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateSlug } from "@/lib/utils/slugify";
import { generateAccessCode } from "@/lib/utils/generateCode";

export default function NewClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: "", phone_number: "", business_hours: "", contact_email: "",
    services_offered: "", price_ranges: "", service_area: "", calendar_link: "",
    voice_agent_instructions: "", website_contact_form_url: "",
    outbound_calling_enabled: false, consent_confirmed: false,
    review_business_name: "", google_review_link: "", delivery_address: "",
    manager_access_granted: false, access_code: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const slug = generateSlug(form.business_name);
    const accessCode = form.access_code || generateAccessCode(6);
    const payload = { ...form, slug, access_code: accessCode };
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/${data.slug}?generated=true&code=${accessCode}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create client");
      }
    } catch (err) { alert("An error occurred"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Add New Client</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Business Name *</label><input name="business_name" value={form.business_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" required /></div>
          <div><label className="block text-sm font-medium mb-1">Phone Number</label><input name="phone_number" value={form.phone_number} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" /></div>
          <div><label className="block text-sm font-medium mb-1">Business Hours</label><input name="business_hours" value={form.business_hours} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" placeholder="e.g. Mon-Fri 9am-5pm" /></div>
          <div><label className="block text-sm font-medium mb-1">Contact Email</label><input name="contact_email" type="email" value={form.contact_email} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" /></div>
          <div><label className="block text-sm font-medium mb-1">Services Offered</label><input name="services_offered" value={form.services_offered} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" /></div>
          <div><label className="block text-sm font-medium mb-1">Price Ranges</label><input name="price_ranges" value={form.price_ranges} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" /></div>
          <div><label className="block text-sm font-medium mb-1">Service Area / City</label><input name="service_area" value={form.service_area} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" /></div>
          <div><label className="block text-sm font-medium mb-1">Calendar Link</label><input name="calendar_link" value={form.calendar_link} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" placeholder="https://cal.com/..." /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Website Contact Form URL</label><input name="website_contact_form_url" value={form.website_contact_form_url} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" placeholder="https://..." /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Voice Agent Instructions *</label><textarea name="voice_agent_instructions" value={form.voice_agent_instructions} onChange={handleChange} rows={6} className="w-full px-3 py-2 border rounded-md bg-background font-mono text-sm" required placeholder="Write the exact script/instructions for the AI assistant..." /></div>
          <div><label className="block text-sm font-medium mb-1">Review Business Name</label><input name="review_business_name" value={form.review_business_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" /></div>
          <div><label className="block text-sm font-medium mb-1">Google Review Link</label><input name="google_review_link" value={form.google_review_link} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" /></div>
          <div><label className="block text-sm font-medium mb-1">Delivery Address</label><input name="delivery_address" value={form.delivery_address} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" /></div>
          <div><label className="block text-sm font-medium mb-1">Access Code (leave blank to generate)</label><input name="access_code" value={form.access_code} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background font-mono" placeholder="Auto-generated if empty" /></div>
          <div className="md:col-span-2 space-y-2">
            <label className="flex items-center gap-2"><input type="checkbox" name="outbound_calling_enabled" checked={form.outbound_calling_enabled} onChange={handleChange} /> Outbound Calling Enabled (tick after connecting real Twilio number)</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="consent_confirmed" checked={form.consent_confirmed} onChange={handleChange} /> Consent Checkbox Confirmed (tick after verifying website has consent checkbox)</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="manager_access_granted" checked={form.manager_access_granted} onChange={handleChange} /> Manager Access Granted (tick after adding service account to GBP)</label>
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:opacity-90 disabled:opacity-50">{loading ? "Generating..." : "Generate"}</button>
          <button type="button" onClick={() => router.push("/admin")} className="border px-6 py-2 rounded-md hover:bg-muted">Cancel</button>
        </div>
      </form>
    </div>
  );
}