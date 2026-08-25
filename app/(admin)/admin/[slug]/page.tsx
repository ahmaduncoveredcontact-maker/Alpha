import { supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ClientEditForm from "./ClientEditForm";

export default async function EditClientPage({ params, searchParams }: { params: { slug: string }; searchParams: { generated?: string; code?: string } }) {
  const { data: client, error } = await supabaseServer.from("clients").select("*").eq("slug", params.slug).single();
  if (error || !client) notFound();
  const generated = searchParams.generated === "true";
  const accessCode = searchParams.code || "";
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Client: {client.business_name}</h1>
        <a href={`/live/${client.slug}`} target="_blank" className="text-primary hover:underline">View Live Page →</a>
      </div>
      {generated && accessCode && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-800 dark:text-green-200 p-4 rounded-md mb-6">
          <p className="font-bold">✅ Client created successfully!</p>
          <p><strong>Access Code:</strong> <code className="bg-white dark:bg-black px-2 py-1 rounded">{accessCode}</code></p>
          <p className="text-sm mt-1">Share this code with the client to log in at <code>/live/{client.slug}</code>.</p>
        </div>
      )}
      <ClientEditForm client={client} />
    </div>
  );
}