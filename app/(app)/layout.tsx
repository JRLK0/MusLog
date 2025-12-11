import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/bottom-nav"
import { Header } from "@/components/header"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Check if user is approved
  if (profile?.status === "pending") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <span className="text-3xl">⏳</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Cuenta pendiente de aprobación</h1>
        <p className="text-muted-foreground max-w-sm">
          Tu cuenta está siendo revisada por un administrador. Te notificaremos cuando esté aprobada.
        </p>
      </div>
    )
  }

  if (profile?.status === "rejected") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <span className="text-3xl">❌</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Cuenta rechazada</h1>
        <p className="text-muted-foreground max-w-sm">
          Tu solicitud de registro ha sido rechazada. Contacta con un administrador para más información.
        </p>
      </div>
    )
  }

  let pendingUsersCount = 0
  if (profile?.is_admin) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")

    pendingUsersCount = count || 0
  }

  return (
    <div className="flex min-h-svh flex-col pb-16">
      <Header
        title="Mus Tracker"
        userName={profile?.name}
        isAdmin={profile?.is_admin}
        pendingUsersCount={pendingUsersCount}
      />
      <main className="flex-1">{children}</main>
      <BottomNav isAdmin={profile?.is_admin} />
    </div>
  )
}
