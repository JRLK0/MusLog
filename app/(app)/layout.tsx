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
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 shadow-lg">
          <span className="text-4xl">⏳</span>
        </div>
        <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Cuenta pendiente de aprobación</h1>
        <p className="text-muted-foreground max-w-sm">
          Tu cuenta está siendo revisada por un administrador. Te notificaremos cuando esté aprobada.
        </p>
      </div>
    )
  }

  if (profile?.status === "rejected") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-4 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 shadow-lg">
          <span className="text-4xl">❌</span>
        </div>
        <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Cuenta rechazada</h1>
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

  // Get active season
  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("name")
    .eq("is_active", true)
    .single()

  // Obtener partidas pendientes donde el usuario es participante y no ha validado
  let pendingMatchesCount = 0
  if (user?.id) {
    const { data: pendingMatches } = await supabase
      .from("matches")
      .select(`
        id,
        player1_id,
        player2_id,
        player3_id,
        player4_id,
        validations:match_validations(
          player_id,
          validated
        )
      `)
      .eq("status", "pending")
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)

    if (pendingMatches) {
      // Filtrar partidas donde el usuario no ha validado
      pendingMatchesCount = pendingMatches.filter((match) => {
        const userValidation = match.validations?.find((v: any) => v.player_id === user.id)
        return !userValidation || !userValidation.validated
      }).length
    }
  }

  return (
    <div className="flex min-h-svh flex-col pb-16">
      <Header
        title="MusLog"
        userName={profile?.name}
        isAdmin={profile?.is_admin}
        pendingUsersCount={pendingUsersCount}
        pendingMatchesCount={pendingMatchesCount}
        activeSeasonName={activeSeason?.name || null}
      />
      <main className="flex-1">{children}</main>
      <BottomNav isAdmin={profile?.is_admin} />
    </div>
  )
}
