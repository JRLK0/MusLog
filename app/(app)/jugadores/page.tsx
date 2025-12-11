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
      season:seasons(id, name, is_active)
    `)
    .eq("status", "validated")

  // Get all seasons
  const { data: seasons } = await supabase.from("seasons").select("*").order("created_at", { ascending: false })

  return <PlayerStatsClient profiles={profiles || []} matches={matches || []} seasons={seasons || []} />
}
