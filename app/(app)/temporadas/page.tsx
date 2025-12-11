import { createClient } from "@/lib/supabase/server"
import { SeasonHistoryClient } from "./season-history-client"

export default async function TemporadasPage() {
  const supabase = await createClient()

  // Get all seasons ordered by creation date
  const { data: seasons } = await supabase
    .from("seasons")
    .select(`
      *,
      creator:profiles!seasons_created_by_fkey(id, name)
    `)
    .order("created_at", { ascending: false })

  // Get all validated matches with player info
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      player1:profiles!matches_player1_id_fkey(id, name),
      player2:profiles!matches_player2_id_fkey(id, name),
      player3:profiles!matches_player3_id_fkey(id, name),
      player4:profiles!matches_player4_id_fkey(id, name),
      season:seasons(id, name, is_active)
    `)
    .eq("status", "validated")

  // Get all profiles for stats calculation
  const { data: profiles } = await supabase.from("profiles").select("id, name").eq("status", "approved")

  return (
    <SeasonHistoryClient
      seasons={seasons || []}
      matches={matches || []}
      profiles={profiles || []}
    />
  )
}


