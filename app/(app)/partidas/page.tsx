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
      temp_player1:season_players!matches_temp_player1_id_fkey(id, name, season_id),
      temp_player2:season_players!matches_temp_player2_id_fkey(id, name, season_id),
      temp_player3:season_players!matches_temp_player3_id_fkey(id, name, season_id),
      temp_player4:season_players!matches_temp_player4_id_fkey(id, name, season_id),
      creator:profiles!matches_created_by_fkey(id, name),
      canceled_by_profile:profiles!matches_canceled_by_fkey(id, name),
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

  // Obtener temporadas para el filtro
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, is_active")
    .order("created_at", { ascending: false })

  // Obtener jugadores aprobados para el filtro
  const { data: players } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("status", "approved")
    .or("is_active_player.is.null,is_active_player.eq.true")
    .order("name")

  // Obtener solo jugadores temporales activos para el filtro (los inactivos pueden aparecer en partidas históricas)
  const { data: tempPlayers } = await supabase
    .from("season_players")
    .select("id, name, season_id, is_active")
    .eq("is_active", true)
    .order("name")

  return (
    <div className="p-4">
      <MatchList 
        matches={matches || []} 
        currentUserId={user?.id || ""} 
        isAdmin={profile?.is_admin || false}
        seasons={seasons || []}
        players={(players || []).concat(
          (tempPlayers || []).map((p) => ({ ...p, is_temp: true })),
        )}
      />
    </div>
  )
}

