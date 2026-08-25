"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/types";

export default function ClientEditForm({ client }: { client: Client }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    outbound_calling_enabled: client.outbound_calling_enabled || false,
    consent_confirmed: client.consent_confirmed || false,
    manager_access_granted: client.manager_access_granted || false,
    google_review_link: client.google_review_link || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { alert("Client updated successfully"); router.refresh(); }
      else { const err = await res.json(); alert(err.error || "Failed to update"); }
    } catch { alert("An error occurred"); }
    finally { setLoading(false); }
  };

  const checklistItems = [
    { label: "Order and ship 1 NFC card", done: false, note: client.delivery_address ? `to ${client.delivery_address}` : "no address provided" },
    { label: "Connect real Twilio number in Vapi", done: client.outbound_calling_enabled, note: "then tick Outbound Enabled" },
    { label: "Verify website consent checkbox", done: client.consent_confirmed, note: "then tick Consent Confirmed" },
    { label: "Add service account as Manager on GBP", done: client.manager_access_granted, note: "then tick Manager Access" },
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <h2 className="text-lg font-semibold">Toggles</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2"><input type="checkbox" name="outbound_calling_enabled" checked={form.outbound_calling_enabled} onChange={handleChange} /> Outbound Calling Enabled</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="consent_confirmed" checked={form.consent_confirmed} onChange={handleChange} /> Consent Checkbox Confirmed</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="manager_access_granted" checked={form.manager_access_granted} onChange={handleChange} /> Manager Access Granted</label>
        </div>
        <div><label className="block text-sm font-medium mb-1">Google Review Link</label><input name="google_review_link" value={form.google_review_link} onChange={handleChange} className="w-full px-3 py-2 border rounded-md bg-background" /></div>
        <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50">{loading ? "Saving..." : "Save Changes"}</button>
      </form>
      <div>
        <h2 className="text-lg font-semibold mb-2">Manual Checklist</h2>
        <ul className="space-y-2">
          {checklistItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 p-2 border rounded-md">
              <span className="text-lg">{item.done ? "✅" : "⏳"}</span>
              <div><p className="font-medium">{item.label}</p>{item.note && <p className="text-sm text-muted-foreground">{item.note}</p>}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}