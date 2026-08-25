"use client";

import { useEffect, useState } from "react";
import type { Client, CallLog } from "@/types";

export default function ClientDashboard({ client }: { client: Client }) {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [stats, setStats] = useState({ totalCalls: 0, bookings: 0, reviewsReplied: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [callsRes, statsRes] = await Promise.all([
          fetch(`/api/client/${client.slug}/calls`),
          fetch(`/api/client/${client.slug}/stats`),
        ]);
        if (callsRes.ok) setCalls(await callsRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [client.slug]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{client.business_name}</h1>
      <p className="text-muted-foreground mb-6">Welcome to your dashboard.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-md p-4 text-center"><p className="text-sm text-muted-foreground">Total Calls (this week)</p><p className="text-2xl font-bold">{stats.totalCalls}</p></div>
        <div className="border rounded-md p-4 text-center"><p className="text-sm text-muted-foreground">Bookings</p><p className="text-2xl font-bold">{stats.bookings}</p></div>
        <div className="border rounded-md p-4 text-center"><p className="text-sm text-muted-foreground">Reviews Replied</p><p className="text-2xl font-bold">{stats.reviewsReplied}</p></div>
      </div>
      <h2 className="text-xl font-semibold mb-4">Call Log</h2>
      {calls.length === 0 ? <p className="text-muted-foreground">No calls yet.</p> : (
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="p-2 text-left">Time</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Customer</th><th className="p-2 text-left">Summary</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Recording</th></tr></thead>
            <tbody>
              {calls.map((call, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{new Date(call.timestamp).toLocaleString()}</td>
                  <td className="p-2">{call.call_type}</td>
                  <td className="p-2">{call.customer_name} <span className="text-xs text-muted-foreground">{call.customer_phone}</span></td>
                  <td className="p-2">{call.summary}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs ${call.status === "Booked" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : call.status === "General Inquiry" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>{call.status}</span></td>
                  <td className="p-2">{call.recording_url ? <a href={call.recording_url} target="_blank" className="text-primary hover:underline">Listen</a> : <span className="text-muted-foreground text-xs">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2 className="text-xl font-semibold mt-8 mb-4">Your Review QR Code</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {client.qr_main_url && <div className="border rounded-md p-4 text-center"><img src={client.qr_main_url} alt="QR Code" className="mx-auto max-w-[150px]" /><p className="text-sm mt-2">Main QR</p><a href={client.qr_main_url} download className="text-primary text-sm hover:underline">Download</a></div>}
        {client.qr_wallpaper_url && <div className="border rounded-md p-4 text-center"><img src={client.qr_wallpaper_url} alt="Wallpaper QR" className="mx-auto max-w-[150px]" /><p className="text-sm mt-2">Lock‑screen Wallpaper</p><a href={client.qr_wallpaper_url} download className="text-primary text-sm hover:underline">Download</a></div>}
        {client.qr_sticker_url && <div className="border rounded-md p-4 text-center"><img src={client.qr_sticker_url} alt="Sticker QR" className="mx-auto max-w-[150px]" /><p className="text-sm mt-2">Printable Sticker</p><a href={client.qr_sticker_url} download className="text-primary text-sm hover:underline">Download</a></div>}
      </div>
      {client.google_review_link && <p className="mt-4 text-sm">Review link: <a href={client.google_review_link} target="_blank" className="text-primary hover:underline">{client.google_review_link}</a></p>}
    </div>
  );
}