import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from "lucide-react"

interface PlayerStats {
  id: string
  name: string
  total_matches: number
  wins: number
  losses: number
  win_rate: number
}

export default async function JugadoresPage() {
  const supabase = await createClient()

  // Get all approved players
  const { data: profiles } = await supabase.from("profiles").select("id, name").eq("status", "approved")

  // Get all validated matches
  const { data: matches } = await supabase.from("matches").select("*").eq("status", "validated")

  // Calculate stats for each player
  const playerStats: PlayerStats[] = (profiles || []).map((profile) => {
    const playerMatches = (matches || []).filter(
      (m) =>
        m.player1_id === profile.id ||
        m.player2_id === profile.id ||
        m.player3_id === profile.id ||
        m.player4_id === profile.id,
    )

    const wins = playerMatches.filter((m) => {
      const isInTeam1 = m.player1_id === profile.id || m.player2_id === profile.id
      return (isInTeam1 && m.winner_team === 1) || (!isInTeam1 && m.winner_team === 2)
    }).length

    const losses = playerMatches.length - wins
    const winRate = playerMatches.length > 0 ? (wins / playerMatches.length) * 100 : 0

    return {
      id: profile.id,
      name: profile.name,
      total_matches: playerMatches.length,
      wins,
      losses,
      win_rate: winRate,
    }
  })

  // Sort by win rate (with minimum 3 matches) then by total wins
  const sortedStats = [...playerStats].sort((a, b) => {
    if (a.total_matches >= 3 && b.total_matches < 3) return -1
    if (b.total_matches >= 3 && a.total_matches < 3) return 1
    if (a.win_rate !== b.win_rate) return b.win_rate - a.win_rate
    return b.wins - a.wins
  })

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-amber-500" />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />
    if (index === 2) return <Award className="h-5 w-5 text-amber-700" />
    return (
      <span className="w-5 h-5 flex items-center justify-center text-sm text-muted-foreground font-medium">
        {index + 1}
      </span>
    )
  }

  const getTrendIcon = (winRate: number) => {
    if (winRate >= 60) return <TrendingUp className="h-4 w-4 text-emerald-500" />
    if (winRate <= 40) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="p-4 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{playerStats.length}</p>
            <p className="text-xs text-muted-foreground">Jugadores activos</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{matches?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Partidas validadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold px-1">Clasificación</h2>

        {sortedStats.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No hay jugadores registrados aún</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedStats.map((player, index) => (
              <Card
                key={player.id}
                className={`border-0 shadow-sm overflow-hidden ${index < 3 ? "ring-1 ring-emerald-100" : ""}`}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">{getRankIcon(index)}</div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{player.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                          <Trophy className="h-3 w-3 mr-1" />
                          {player.wins}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {player.total_matches} partidas
                        </Badge>
                      </div>
                    </div>

                    {/* Win Rate */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1">
                        {getTrendIcon(player.win_rate)}
                        <span
                          className={`text-lg font-bold ${
                            player.win_rate >= 60
                              ? "text-emerald-600"
                              : player.win_rate <= 40
                                ? "text-red-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {player.win_rate.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {player.wins}V - {player.losses}D
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-gray-100">
                    <div
                      className={`h-full transition-all ${
                        player.win_rate >= 60 ? "bg-emerald-500" : player.win_rate <= 40 ? "bg-red-400" : "bg-gray-300"
                      }`}
                      style={{ width: `${player.win_rate}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <p className="text-xs text-center text-muted-foreground px-4">
        Solo se cuentan las partidas validadas. Las estadísticas se actualizan en tiempo real.
      </p>
    </div>
  )
}
