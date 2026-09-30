import { redirect } from "next/navigation"
import { verifyAdminSession } from "@/lib/admin-auth"

export default async function AdminRootPage() {
  const { isAdmin } = await verifyAdminSession()
  if (isAdmin) {
    redirect("/admin/dashboard")
  }
  redirect("/admin/login")
}

