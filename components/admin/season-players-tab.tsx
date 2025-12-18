"use client"

import { useEffect, useMemo, useState } from "react"
import type { Season, SeasonPlayer } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, Plus, RefreshCw, Search, Power, PowerOff } from "lucide-react"

interface SeasonPlayersTabProps {
  activeSeason: Season | null
}

export function SeasonPlayersTab({ activeSeason }: SeasonPlayersTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [players, setPlayers] = useState<SeasonPlayer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<SeasonPlayer[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  const canCreate = Boolean(activeSeason)

  const fetchActivePlayers = async () => {
    if (!activeSeason) return
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("season_players")
        .select("*")
        .eq("season_id", activeSeason.id)
        .order("created_at", { ascending: true })
      setPlayers(data || [])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivePlayers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeason?.id])

  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    if (!term.trim()) {
      setSuggestions([])
      return
    }
    setSearching(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("season_players")
        .select("*")
        .ilike("name", `%${term}%`)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5)
      setSuggestions(data || [])
    } finally {
      setSearching(false)
    }
  }

  const handleCreate = async () => {
    if (!activeSeason) return
    const name = searchTerm.trim()
    if (!name) return
    setProcessingId("create")
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      await supabase.from("season_players").insert({
        name,
        season_id: activeSeason.id,
        created_by: user?.id || null,
        is_active: true,
      })
      setSearchTerm("")
      setSuggestions([])
      await fetchActivePlayers()
      router.refresh()
    } finally {
      setProcessingId(null)
    }
  }

  const handleReactivate = async (playerId: string) => {
    if (!activeSeason) return
    setProcessingId(playerId)
    try {
      const supabase = createClient()
      await supabase
        .from("season_players")
        .update({
          season_id: activeSeason.id,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", playerId)
      setSearchTerm("")
      setSuggestions([])
      await fetchActivePlayers()
      router.refresh()
    } finally {
      setProcessingId(null)
    }
  }

  const handleToggleActive = async (playerId: string, currentStatus: boolean) => {
    if (!activeSeason) return
    setProcessingId(playerId)
    try {
      const supabase = createClient()
      await supabase
        .from("season_players")
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", playerId)
      await fetchActivePlayers()
      router.refresh()
    } finally {
      setProcessingId(null)
    }
  }

  const inactiveSuggestion = useMemo(() => {
    return suggestions.find((s) => !s.is_active)
  }, [suggestions])

  return (
    <div className="space-y-4">
      {!activeSeason && (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 text-amber-700 bg-amber-50">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">No hay temporada activa</p>
              <p className="text-sm">Crea o activa una temporada para añadir jugadores temporales.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Añadir o reactivar jugador temporal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Nombre del jugador"
            disabled={!canCreate || processingId !== null}
          />

          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={!canCreate || !searchTerm.trim() || processingId !== null}
              className="flex-1"
            >
              {processingId === "create" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Crear nuevo jugador
            </Button>
            <Button variant="outline" onClick={fetchActivePlayers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {searchTerm && inactiveSuggestion && (
            <Card className="border border-amber-200 bg-amber-50">
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium text-amber-800">
                  ¿Reactivar "{inactiveSuggestion.name}" de otra temporada?
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleReactivate(inactiveSuggestion.id)}
                    disabled={processingId === inactiveSuggestion.id}
                  >
                    {processingId === inactiveSuggestion.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Reactivar en temporada actual
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSuggestions([])}
                  >
                    Crear uno nuevo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Jugadores temporales de la temporada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando jugadores...
            </div>
          ) : players.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay jugadores temporales en esta temporada.</p>
          ) : (
            players.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="font-medium truncate">{player.name}</p>
                  <p className="text-xs text-muted-foreground">Creado el {new Date(player.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={player.is_active ? "default" : "secondary"}>
                    {player.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                  <Button
                    onClick={() => handleToggleActive(player.id, player.is_active)}
                    disabled={processingId === player.id}
                    variant="outline"
                    size="sm"
                    className={player.is_active ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}
                    title={player.is_active ? "Desactivar jugador (no se podrá agregar a nuevas partidas)" : "Activar jugador"}
                  >
                    {processingId === player.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : player.is_active ? (
                      <>
                        <PowerOff className="h-4 w-4 mr-1" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-1" />
                        Activar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

