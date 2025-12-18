import { createClient } from "@/lib/supabase/server"
import { PlayerStatsClient } from "./player-stats-client"

export default async function JugadoresPage() {
  const supabase = await createClient()

  // Get all approved players
  const { data: profiles } = await supabase.from("profiles").select("id, name").eq("status", "approved")

  // Get all validated matches with season info
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      player1:profiles!matches_player1_id_fkey(id, name),
      player2:profiles!matches_player2_id_fkey(id, name),
      player3:profiles!matches_player3_id_fkey(id, name),
      player4:profiles!matches_player4_id_fkey(id, name),
      season:seasons(id, name, is_active),
      temp_player1:season_players!matches_temp_player1_id_fkey(id, name, season_id),
      temp_player2:season_players!matches_temp_player2_id_fkey(id, name, season_id),
      temp_player3:season_players!matches_temp_player3_id_fkey(id, name, season_id),
      temp_player4:season_players!matches_temp_player4_id_fkey(id, name, season_id)
    `)
    .eq("status", "validated")

  // Get all season players (activos e inactivos)
  const { data: seasonPlayers } = await supabase.from("season_players").select("id, name, season_id, is_active")

  // Get all seasons
  const { data: seasons } = await supabase.from("seasons").select("*").order("created_at", { ascending: false })

  return (
    <PlayerStatsClient
      profiles={profiles || []}
      seasonPlayers={seasonPlayers || []}
      matches={matches || []}
      seasons={seasons || []}
    />
  )
}
