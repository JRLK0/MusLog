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
      temp_player1:season_players!matches_temp_player1_id_fkey(id, name, season_id),
      temp_player2:season_players!matches_temp_player2_id_fkey(id, name, season_id),
      temp_player3:season_players!matches_temp_player3_id_fkey(id, name, season_id),
      temp_player4:season_players!matches_temp_player4_id_fkey(id, name, season_id),
      season:seasons(id, name, is_active)
    `)
    .eq("status", "validated")

  // Get all profiles for stats calculation
  const { data: profiles } = await supabase.from("profiles").select("id, name").eq("status", "approved")

  const { data: seasonPlayers } = await supabase.from("season_players").select("id, name, season_id, is_active")

  return (
    <SeasonHistoryClient
      seasons={seasons || []}
      matches={matches || []}
      profiles={profiles || []}
      seasonPlayers={seasonPlayers || []}
    />
  )
}


