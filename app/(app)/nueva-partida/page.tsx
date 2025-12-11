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
import type { Profile } from "@/lib/types"
import { Trophy, Users, AlertCircle } from "lucide-react"

export default function NuevaPartidaPage() {
  const [players, setPlayers] = useState<Profile[]>([])
  const [player1, setPlayer1] = useState("")
  const [player2, setPlayer2] = useState("")
  const [player3, setPlayer3] = useState("")
  const [player4, setPlayer4] = useState("")
  const [winnerTeam, setWinnerTeam] = useState<"1" | "2">("1")
  const [team1Score, setTeam1Score] = useState("3")
  const [team2Score, setTeam2Score] = useState("0")
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().slice(0, 16))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSeasonName, setActiveSeasonName] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchPlayers() {
      const supabase = createClient()
      const { data } = await supabase.from("profiles").select("*").eq("status", "approved").order("name")

      if (data) {
        setPlayers(data)
      }
    }
    fetchPlayers()
  }, [])

  const [hasActiveSeason, setHasActiveSeason] = useState<boolean | null>(null)

  useEffect(() => {
    async function fetchActiveSeason() {
      const supabase = createClient()
      const { data } = await supabase.from("seasons").select("name").eq("is_active", true).single()

      if (data) {
        setActiveSeasonName(data.name)
        setHasActiveSeason(true)
      } else {
        setHasActiveSeason(false)
      }
    }
    fetchActiveSeason()
  }, [])

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

      const { error: insertError } = await supabase.from("matches").insert({
        created_by: user.id,
        played_at: new Date(playedAt).toISOString(),
        player1_id: player1,
        player2_id: player2,
        player3_id: player3,
        player4_id: player4,
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

  const getAvailablePlayers = (currentSelection: string) => {
    return players.filter((p) => p.id === currentSelection || !selectedPlayers.includes(p.id))
  }

  // Si no hay temporada activa, mostrar aviso
  if (hasActiveSeason === false) {
    return (
      <div className="p-4">
        <Card className="border-0 shadow-sm border-amber-200 border-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
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
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-600" />
            Nueva Partida
          </CardTitle>
          <CardDescription>
            Registra una nueva partida de Mus
            {activeSeasonName && (
              <span className="block mt-1 text-xs text-emerald-600 font-medium">
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
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <Label className="text-base font-semibold">Equipo 1</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="player1" className="text-xs text-muted-foreground">
                    Jugador 1
                  </Label>
                  <Select value={player1} onValueChange={setPlayer1}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailablePlayers(player1).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="player2" className="text-xs text-muted-foreground">
                    Jugador 2
                  </Label>
                  <Select value={player2} onValueChange={setPlayer2}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailablePlayers(player2).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Equipo 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <Label className="text-base font-semibold">Equipo 2</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="player3" className="text-xs text-muted-foreground">
                    Jugador 3
                  </Label>
                  <Select value={player3} onValueChange={setPlayer3}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailablePlayers(player3).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="player4" className="text-xs text-muted-foreground">
                    Jugador 4
                  </Label>
                  <Select value={player4} onValueChange={setPlayer4}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailablePlayers(player4).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={winnerTeam === "1" ? "default" : "outline"}
                  className={`h-14 ${winnerTeam === "1" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                  onClick={() => setWinnerTeam("1")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Equipo 1
                </Button>
                <Button
                  type="button"
                  variant={winnerTeam === "2" ? "default" : "outline"}
                  className={`h-14 ${winnerTeam === "2" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
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
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
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
