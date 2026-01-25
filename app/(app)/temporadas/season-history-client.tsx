"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Season, Match, Profile, SeasonPlayer } from "@/lib/types"
import { calculateAllPlayerStats } from "@/lib/season-stats"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Users, Award, Crown, Medal, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"
import { PodiumIntro } from "@/components/podium-intro"

interface SeasonHistoryClientProps {
  seasons: Season[]
  matches: Match[]
  profiles: Array<{ id: string; name: string }>
  seasonPlayers: Array<Pick<SeasonPlayer, "id" | "name" | "season_id" | "is_active">>
}

export function SeasonHistoryClient({ seasons, matches, profiles, seasonPlayers }: SeasonHistoryClientProps) {
  const activeSeason = seasons.find((s) => s.is_active)
  const closedSeasons = seasons.filter((s) => !s.is_active)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    activeSeason?.id || (closedSeasons.length > 0 ? closedSeasons[0].id : ""),
  )
  const [showIntro, setShowIntro] = useState(true)
  const handleIntroComplete = useCallback(() => setShowIntro(false), [])

  // Calcular estadísticas para cada temporada
  const seasonStats = useMemo(() => {
    return seasons.map((season) => {
      const allSeasonMatches = matches.filter((m) => m.season_id === season.id)
      const validatedMatches = allSeasonMatches.filter((m) => m.status === "validated")
      const temps = seasonPlayers.filter((p) => p.season_id === season.id)
      const playersForSeason = [...profiles, ...temps.map((t) => ({ id: t.id, name: t.name }))]
      const stats = calculateAllPlayerStats(validatedMatches, playersForSeason)
      const activeStats = stats.filter((p) => p.total_matches > 0)

      // Ordenar por win rate y victorias
      const sortedStats = [...activeStats].sort((a, b) => {
        if (a.total_matches >= 3 && b.total_matches < 3) return -1
        if (b.total_matches >= 3 && a.total_matches < 3) return 1
        if (a.win_rate !== b.win_rate) return b.win_rate - a.win_rate
        return b.wins - a.wins
      })

      return {
        season,
        matches: allSeasonMatches,
        totalMatches: validatedMatches.length,
        playerStats: sortedStats,
      }
    })
  }, [seasons, matches, profiles, seasonPlayers])

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-amber-500" />
    if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />
    if (index === 2) return <Award className="h-4 w-4 text-amber-700" />
    return (
      <span className="w-4 h-4 flex items-center justify-center text-xs text-muted-foreground font-medium">
        {index + 1}
      </span>
    )
  }

  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId)
  const selectedStats = seasonStats.find((s) => s.season.id === selectedSeasonId)
  const playerStats = selectedStats?.playerStats ?? []
  const top3 = playerStats.slice(0, 3)
  const restPlayers = playerStats.slice(3)
  const showIntroSequence = showIntro && top3.length === 3

  const generateWhatsAppMessage = () => {
    if (!selectedSeason || !selectedStats) return ""

    const seasonName = selectedSeason.name
    const startDate = format(new Date(selectedSeason.start_date), "d MMM yyyy", { locale: es })
    const endDate = selectedSeason.end_date
      ? format(new Date(selectedSeason.end_date), "d MMM yyyy", { locale: es })
      : "Activa"
    const totalMatches = selectedStats.totalMatches

    // Filtrar solo jugadores que han jugado al menos una partida
    const playersWithMatches = selectedStats.playerStats.filter((p) => p.total_matches > 0)

    let message = `*${seasonName}*\n\n`
    message += `Fecha: ${startDate} - ${endDate}\n`
    message += `Total de partidas: ${totalMatches}\n\n`

    if (playersWithMatches.length > 0) {
      message += `*Ranking de Jugadores:*\n\n`

      playersWithMatches.forEach((player, index) => {
        const position = index + 1
        const medal = index === 0 ? "1. " : index === 1 ? "2. " : index === 2 ? "3. " : `${position}. `
        
        message += `${medal}*${player.name}*\n`
        message += `   ${player.wins} victorias - ${player.losses} derrotas\n`
        message += `   Partidas totales: ${player.total_matches}\n\n`
      })
    } else {
      message += `No hay partidas validadas en esta temporada.\n`
    }

    return message
  }

  const handleShareWhatsApp = () => {
    const message = generateWhatsAppMessage()
    if (!message) return

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="p-4 space-y-6">
      <AnimatePresence>
        {showIntroSequence ? (
          <PodiumIntro top3={top3} onComplete={handleIntroComplete} />
        ) : null}
      </AnimatePresence>
      <div>
        <h1 className="text-2xl font-bold mb-2">Temporada</h1>
        <p className="text-sm text-muted-foreground">Consulta las estadísticas de la temporada</p>
      </div>

      {/* Selector de temporada */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Seleccionar temporada</label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeSeason && (
                    <SelectItem value={activeSeason.id}>
                      {activeSeason.name} (Activa)
                    </SelectItem>
                  )}
                  {closedSeasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de temporada seleccionada */}
      {selectedSeason && selectedStats && (
        <Card className={`border-0 shadow-sm ${selectedSeason.is_active ? "border-emerald-200 border-2" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {selectedSeason.is_active ? (
                    <Badge className="bg-emerald-600 text-white">Activa</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100">
                      Cerrada
                    </Badge>
                  )}
                  <h3 className="text-lg font-semibold">{selectedSeason.name}</h3>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(selectedSeason.start_date), "d MMM yyyy", { locale: es })} -{" "}
                      {selectedSeason.end_date
                        ? format(new Date(selectedSeason.end_date), "d MMM yyyy", { locale: es })
                        : "Activa"}
                    </span>
                  </div>
                  {selectedSeason.creator && (
                    <div className="text-xs">Creada por {selectedSeason.creator.name}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className={`text-2xl font-bold ${selectedSeason.is_active ? "text-emerald-600" : "text-blue-600"}`}>
                    {selectedStats.totalMatches}
                  </div>
                  <div className="text-xs text-muted-foreground">Partidas validadas</div>
                </div>
                {selectedStats.totalMatches > 0 && (
                  <Button
                    onClick={handleShareWhatsApp}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir en WhatsApp
                  </Button>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!showIntroSequence && playerStats.length > 0 ? (
                <motion.div
                  key="ranking"
                  className="pt-4 border-t"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Ranking de Jugadores ({playerStats.length} jugadores)
                  </h4>
                  <div className="space-y-2">
                    {[...top3, ...restPlayers].map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {getRankIcon(index)}
                          <span className="font-medium">{player.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {player.total_matches} partidas
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-medium text-muted-foreground">
                            {player.win_rate.toFixed(1)}%
                          </span>
                          <div className="text-right">
                            <span className="text-base font-bold text-emerald-600">{player.wins}V</span>
                            <span className="mx-1 text-muted-foreground">-</span>
                            <span className="text-base font-bold text-red-600">{player.losses}D</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {!showIntroSequence && selectedStats.totalMatches === 0 && (
              <div className="pt-4 border-t text-center text-sm text-muted-foreground">
                No hay partidas validadas en esta temporada
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {seasons.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p>No hay temporadas registradas aún</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

