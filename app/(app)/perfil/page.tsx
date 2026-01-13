import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  console.log("[PerfilPage] User ID:", user.id)
  console.log("[PerfilPage] Profile fetched:", profile)

  if (!profile || profile.status !== "approved") {
    console.log("[PerfilPage] Redirecting to login because status is", profile?.status)
    redirect("/auth/login")
  }

  return (
    <div className="p-4">
      <ProfileForm profile={profile} userEmail={user.email || ""} />
    </div>
  )
}
