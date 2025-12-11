import type { Match, PlayerStats } from "./types"

/**
 * Calcula las estadísticas de un jugador basándose en las partidas proporcionadas
 */
export function calculatePlayerStats(matches: Match[], playerId: string): PlayerStats {
  const playerMatches = matches.filter(
    (m) =>
      m.player1_id === playerId ||
      m.player2_id === playerId ||
      m.player3_id === playerId ||
      m.player4_id === playerId,
  )

  const wins = playerMatches.filter((m) => {
    const isInTeam1 = m.player1_id === playerId || m.player2_id === playerId
    return (isInTeam1 && m.winner_team === 1) || (!isInTeam1 && m.winner_team === 2)
  }).length

  const losses = playerMatches.length - wins
  const winRate = playerMatches.length > 0 ? (wins / playerMatches.length) * 100 : 0

  return {
    id: playerId,
    name: "", // Se debe completar con el nombre del perfil
    total_matches: playerMatches.length,
    wins,
    losses,
    win_rate: winRate,
  }
}

/**
 * Calcula estadísticas para todos los jugadores basándose en las partidas proporcionadas
 */
export function calculateAllPlayerStats(
  matches: Match[],
  profiles: Array<{ id: string; name: string }>,
): PlayerStats[] {
  const playerStatsMap = new Map<string, PlayerStats>()

  // Inicializar estadísticas para todos los perfiles
  profiles.forEach((profile) => {
    playerStatsMap.set(profile.id, {
      id: profile.id,
      name: profile.name,
      total_matches: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
    })
  })

  // Calcular estadísticas basándose en las partidas
  matches.forEach((match) => {
    const players = [match.player1_id, match.player2_id, match.player3_id, match.player4_id]

    players.forEach((playerId) => {
      const stats = playerStatsMap.get(playerId)
      if (!stats) return

      stats.total_matches++

      const isInTeam1 = match.player1_id === playerId || match.player2_id === playerId
      const isWinner = (isInTeam1 && match.winner_team === 1) || (!isInTeam1 && match.winner_team === 2)

      if (isWinner) {
        stats.wins++
      } else {
        stats.losses++
      }

      stats.win_rate = stats.total_matches > 0 ? (stats.wins / stats.total_matches) * 100 : 0
    })
  })

  return Array.from(playerStatsMap.values())
}


