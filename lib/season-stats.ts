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
  players: Array<{ id: string; name: string }>,
): PlayerStats[] {
  const playerStatsMap = new Map<string, PlayerStats>()

  // Inicializar estadísticas para todos los jugadores (registrados o temporales)
  players.forEach((player) => {
    playerStatsMap.set(player.id, {
      id: player.id,
      name: player.name,
      total_matches: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
    })
  })

  // Calcular estadísticas basándose en las partidas
  matches.forEach((match) => {
    const playersInMatch = [
      { id: match.player1_id, name: match.player1?.name },
      { id: match.player2_id, name: match.player2?.name },
      { id: match.player3_id, name: match.player3?.name },
      { id: match.player4_id, name: match.player4?.name },
      { id: match.temp_player1_id, name: match.temp_player1?.name },
      { id: match.temp_player2_id, name: match.temp_player2?.name },
      { id: match.temp_player3_id, name: match.temp_player3?.name },
      { id: match.temp_player4_id, name: match.temp_player4?.name },
    ].filter((p) => p.id)

    playersInMatch.forEach((player) => {
      const stats = playerStatsMap.get(player.id!)
      if (!stats) return
      stats.total_matches++

      const isInTeam1 =
        match.player1_id === player.id || match.player2_id === player.id || match.temp_player1_id === player.id || match.temp_player2_id === player.id
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


