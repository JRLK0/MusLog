import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminTabs } from "@/components/admin/admin-tabs"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/partidas")
  }

  // Get pending users
  const { data: pendingUsers } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Get all users for management
  const { data: allUsers } = await supabase.from("profiles").select("*").order("name")

  // Get pending matches
  const { data: pendingMatches } = await supabase
    .from("matches")
    .select(`
      *,
      player1:profiles!matches_player1_id_fkey(id, name),
      player2:profiles!matches_player2_id_fkey(id, name),
      player3:profiles!matches_player3_id_fkey(id, name),
      player4:profiles!matches_player4_id_fkey(id, name),
      creator:profiles!matches_created_by_fkey(id, name)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  return (
    <div className="p-4">
      <AdminTabs pendingUsers={pendingUsers || []} allUsers={allUsers || []} pendingMatches={pendingMatches || []} />
    </div>
  )
}
