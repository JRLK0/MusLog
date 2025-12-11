import { createClient } from "@/lib/supabase/server"
import { MatchList } from "@/components/match-list"

export default async function PartidasPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      player1:profiles!matches_player1_id_fkey(id, name),
      player2:profiles!matches_player2_id_fkey(id, name),
      player3:profiles!matches_player3_id_fkey(id, name),
      player4:profiles!matches_player4_id_fkey(id, name),
      creator:profiles!matches_created_by_fkey(id, name),
      season:seasons(id, name, is_active),
      validations:match_validations(
        id,
        player_id,
        validated,
        validated_at,
        created_at,
        player:profiles(id, name)
      )
    `)
    .order("played_at", { ascending: false })

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user?.id).single()

  return (
    <div className="p-4">
      <MatchList matches={matches || []} currentUserId={user?.id || ""} isAdmin={profile?.is_admin || false} />
    </div>
  )
}
