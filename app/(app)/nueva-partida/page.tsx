"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import type { Profile, SeasonPlayer } from "@/lib/types"
import { Trophy, Users, AlertCircle, X } from "lucide-react"

export default function NuevaPartidaPage() {
  const [players, setPlayers] = useState<Array<Profile | (SeasonPlayer & { type: "temp" })>>([])
  const [player1, setPlayer1] = useState("")
  const [player2, setPlayer2] = useState("")
  const [player3, setPlayer3] = useState("")
  const [player4, setPlayer4] = useState("")
  const [winnerTeam, setWinnerTeam] = useState<"1" | "2">("1")
  // Marcador inicial: 0-0
  const [team1Score, setTeam1Score] = useState("0")
  const [team2Score, setTeam2Score] = useState("0")
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().slice(0, 16))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSeasonName, setActiveSeasonName] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchPlayers() {
      const supabase = createClient()
      const { data: approved } = await supabase
        .from("profiles")
        .select("*")
        .eq("status", "approved")
        .or("is_active_player.is.null,is_active_player.eq.true")
        .order("name")

      // Buscar temporada activa y jugadores temporales activos de esa temporada
      const { data: activeSeason } = await supabase.from("seasons").select("id, name").eq("is_active", true).maybeSingle()
      let tempPlayers: SeasonPlayer[] = []
      if (activeSeason) {
        const { data: temps } = await supabase
          .from("season_players")
          .select("*")
          .eq("is_active", true)
          .eq("season_id", activeSeason.id)
          .order("name")
        tempPlayers = temps || []
      }

      if (approved) {
        // Filter out super admin from being selected in matches
        const filteredApproved = approved.filter(p => p.email !== 'admin@megia.eu')
        
        const normalized = [
          ...filteredApproved,
          ...tempPlayers.map((t) => ({ ...t, type: "temp" as const })),
        ]
        setPlayers(normalized)
      }
    }
    fetchPlayers()
  }, [])

  const [hasActiveSeason, setHasActiveSeason] = useState<boolean | null>(null)

  useEffect(() => {
    async function fetchActiveSeason() {
      const supabase = createClient()
      const { data } = await supabase.from("seasons").select("name").eq("is_active", true).maybeSingle()

      if (data) {
        setActiveSeasonName(data.name)
        setHasActiveSeason(true)
      } else {
        setHasActiveSeason(false)
      }
    }
    fetchActiveSeason()
  }, [])

  // Actualizar automáticamente el equipo ganador basado en la puntuación
  useEffect(() => {
    const score1 = Number.parseInt(team1Score) || 0
    const score2 = Number.parseInt(team2Score) || 0

    if (score1 > score2) {
      setWinnerTeam("1")
    } else if (score2 > score1) {
      setWinnerTeam("2")
    }
    // Si hay empate, mantener el valor actual
  }, [team1Score, team2Score])

  const selectedPlayers = [player1, player2, player3, player4].filter(Boolean)
  const hasDuplicates = new Set(selectedPlayers).size !== selectedPlayers.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!player1 || !player2 || !player3 || !player4) {
      setError("Debes seleccionar 4 jugadores")
      setIsLoading(false)
      return
    }

    if (hasDuplicates) {
      setError("No puedes seleccionar el mismo jugador más de una vez")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("No estás autenticado")
      }

      const parseSelection = (value: string) => {
        if (value.startsWith("temp:")) {
          return { type: "temp" as const, id: value.replace("temp:", "") }
        }
        return { type: "profile" as const, id: value }
      }

      const p1 = parseSelection(player1)
      const p2 = parseSelection(player2)
      const p3 = parseSelection(player3)
      const p4 = parseSelection(player4)

      const { error: insertError } = await supabase.from("matches").insert({
        created_by: user.id,
        played_at: new Date(playedAt).toISOString(),
        player1_id: p1.type === "profile" ? p1.id : null,
        player2_id: p2.type === "profile" ? p2.id : null,
        player3_id: p3.type === "profile" ? p3.id : null,
        player4_id: p4.type === "profile" ? p4.id : null,
        temp_player1_id: p1.type === "temp" ? p1.id : null,
        temp_player2_id: p2.type === "temp" ? p2.id : null,
        temp_player3_id: p3.type === "temp" ? p3.id : null,
        temp_player4_id: p4.type === "temp" ? p4.id : null,
        winner_team: Number.parseInt(winnerTeam),
        team1_score: Number.parseInt(team1Score),
        team2_score: Number.parseInt(team2Score),
        status: "pending",
      })

      if (insertError) throw insertError

      router.push("/partidas")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la partida")
    } finally {
      setIsLoading(false)
    }
  }

  const getValueForPlayer = (p: Profile | (SeasonPlayer & { type: "temp" })) => {
    return "type" in p && p.type === "temp" ? `temp:${p.id}` : p.id
  }

  const getAvailablePlayers = (currentSelection: string) => {
    return players.filter((p) => {
      const value = getValueForPlayer(p)
      return value === currentSelection || !selectedPlayers.includes(value)
    })
  }

  // Si no hay temporada activa, mostrar aviso
  if (hasActiveSeason === false) {
    return (
      <div className="p-4">
        <Card className="border-0 shadow-lg border-amber-300/50 border-2 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-900/10 dark:to-amber-800/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 shadow-md">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Temporada no activada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No se puede registrar una partida porque no hay una temporada activa. Por favor, contacta con un
                  administrador para que active una temporada.
                </p>
                <Button variant="outline" onClick={() => router.push("/temporadas")}>
                  Ver temporadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Nueva Partida
          </CardTitle>
          <CardDescription>
            Registra una nueva partida de Mus
            {activeSeasonName && (
              <span className="block mt-1 text-xs text-primary font-medium">
                Temporada activa: {activeSeasonName}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fecha y hora */}
            <div className="space-y-2">
              <Label htmlFor="playedAt">Fecha y hora</Label>
              <Input
                id="playedAt"
                type="datetime-local"
                value={playedAt}
                onChange={(e) => setPlayedAt(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Equipo 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary shadow-sm" />
                <Label className="text-base font-semibold">Equipo 1</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="player1" className="text-xs text-muted-foreground">
                    Jugador 1
                  </Label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Select value={player1} onValueChange={setPlayer1}>
                      <SelectTrigger className="h-12 flex-1">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailablePlayers(player1).map((p) => {
                          const value = getValueForPlayer(p)
                          const isTemp = "type" in p && p.type === "temp"
                          return (
                            <SelectItem key={value} value={value}>
                              {p.name}
                              {isTemp ? " (Temporal)" : ""}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {player1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-12 w-10 sm:w-12 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => setPlayer1("")}
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="player2" className="text-xs text-muted-foreground">
                    Jugador 2
                  </Label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Select value={player2} onValueChange={setPlayer2}>
                      <SelectTrigger className="h-12 flex-1">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailablePlayers(player2).map((p) => {
                          const value = getValueForPlayer(p)
                          const isTemp = "type" in p && p.type === "temp"
                          return (
                            <SelectItem key={value} value={value}>
                              {p.name}
                              {isTemp ? " (Temporal)" : ""}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {player2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-12 w-10 sm:w-12 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => setPlayer2("")}
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Equipo 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <Label className="text-base font-semibold">Equipo 2</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="player3" className="text-xs text-muted-foreground">
                    Jugador 3
                  </Label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Select value={player3} onValueChange={setPlayer3}>
                      <SelectTrigger className="h-12 flex-1">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailablePlayers(player3).map((p) => {
                          const value = getValueForPlayer(p)
                          const isTemp = "type" in p && p.type === "temp"
                          return (
                            <SelectItem key={value} value={value}>
                              {p.name}
                              {isTemp ? " (Temporal)" : ""}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {player3 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-12 w-10 sm:w-12 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => setPlayer3("")}
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="player4" className="text-xs text-muted-foreground">
                    Jugador 4
                  </Label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Select value={player4} onValueChange={setPlayer4}>
                      <SelectTrigger className="h-12 flex-1">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailablePlayers(player4).map((p) => {
                          const value = getValueForPlayer(p)
                          const isTemp = "type" in p && p.type === "temp"
                          return (
                            <SelectItem key={value} value={value}>
                              {p.name}
                              {isTemp ? " (Temporal)" : ""}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {player4 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-12 w-10 sm:w-12 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => setPlayer4("")}
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resultado */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Resultado</Label>
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Equipo 1</Label>
                  <Input
                    type="number"
                    min="0"
                    max="40"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(e.target.value)}
                    className="h-12 text-center text-lg font-bold"
                  />
                </div>
                <div className="text-center text-2xl font-bold text-muted-foreground pb-3">-</div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Equipo 2</Label>
                  <Input
                    type="number"
                    min="0"
                    max="40"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(e.target.value)}
                    className="h-12 text-center text-lg font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Ganador */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Equipo ganador</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={winnerTeam === "1" ? "default" : "outline"}
                  className={`h-14 transition-all duration-200 ${winnerTeam === "1" ? "bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg" : ""}`}
                  onClick={() => setWinnerTeam("1")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Equipo 1
                </Button>
                <Button
                  type="button"
                  variant={winnerTeam === "2" ? "default" : "outline"}
                  className={`h-14 transition-all duration-200 ${winnerTeam === "2" ? "bg-blue-600 hover:bg-blue-600/90 shadow-md hover:shadow-lg" : ""}`}
                  onClick={() => setWinnerTeam("2")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Equipo 2
                </Button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200"
              disabled={isLoading || hasDuplicates}
            >
              {isLoading ? "Registrando..." : "Registrar partida"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              La partida quedará pendiente de validación por los jugadores o un administrador.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
