import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
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

  if (!profile || profile.status !== "approved") {
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header title="Mi Perfil" userName={profile.name} />

      <main className="flex-1 p-4 pb-24">
        <ProfileForm profile={profile} userEmail={user.email || ""} />
      </main>
    </div>
  )
}
