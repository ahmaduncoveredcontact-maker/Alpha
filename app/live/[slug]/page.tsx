"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientLogin({ params }: { params: { slug: string } }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: params.slug, access_code: code }),
      });
      if (res.ok) router.push(`/live/${params.slug}/dashboard`);
      else { const data = await res.json(); setError(data.error || "Invalid access code"); }
    } catch { setError("An error occurred"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-2">Client Access</h1>
      <p className="text-muted-foreground mb-6">Enter your access code to view your dashboard.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium mb-1">Access Code</label>
          <input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background font-mono" placeholder="e.g. ABC123" required />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 disabled:opacity-50">{loading ? "Verifying..." : "Access Dashboard"}</button>
      </form>
    </div>
  );
}