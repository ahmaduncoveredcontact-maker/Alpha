import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!getAdminSession()) redirect("/admin-login");
  return <>{children}</>;
}