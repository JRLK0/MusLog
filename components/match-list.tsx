"use client"

import { useState, useMemo } from "react"
import type { Match, Season, Profile } from "@/lib/types"
import { MatchCard } from "@/components/match-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X, Filter, ChevronDown, ChevronUp, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface MatchListProps {
  matches: Match[]
  currentUserId: string
  isAdmin: boolean
  seasons: Season[]
  players: Array<Profile & { is_temp?: boolean; season_id?: string; is_active?: boolean }>
}

export function MatchList({ matches, currentUserId, isAdmin, seasons, players }: MatchListProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "validated">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<string>("all")
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Función de búsqueda
  const matchesSearch = (match: Match, query: string): boolean => {
    if (!query.trim()) return true
    
    const lowerQuery = query.toLowerCase()
    const searchableText = [
      match.player1?.name || "",
      match.player2?.name || "",
      match.player3?.name || "",
      match.player4?.name || "",
      match.creator?.name || "",
      match.temp_player1?.name || "",
      match.temp_player2?.name || "",
      match.temp_player3?.name || "",
      match.temp_player4?.name || "",
      format(new Date(match.played_at), "d MMM yyyy", { locale: es }),
      format(new Date(match.played_at), "EEEE", { locale: es }),
      match.team1_score.toString(),
      match.team2_score.toString(),
      `${match.team1_score} - ${match.team2_score}`,
    ].join(" ").toLowerCase()

    return searchableText.includes(lowerQuery)
  }

  // Función de filtrado combinado
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      // Filtro de estado
      if (filter !== "all") {
        if (filter === "validated") {
          // Incluimos tanto 'validated' como 'canceled' en la pestaña de validadas
          // pero el usuario puede ver la diferencia por el badge
          if (match.status !== "validated" && match.status !== "canceled") return false
        } else if (match.status !== filter) {
          return false
        }
      }

      // Búsqueda de texto
      if (!matchesSearch(match, searchQuery)) return false

      // Filtro de temporada
      if (selectedSeason !== "all") {
        if (selectedSeason === "current") {
          if (!match.season?.is_active) return false
        } else {
          if (match.season_id !== selectedSeason) return false
        }
      }

      // Filtro de jugador
      if (selectedPlayer !== "all") {
        const playerIds = [
          match.player1_id,
          match.player2_id,
          match.player3_id,
          match.player4_id,
          match.temp_player1_id,
          match.temp_player2_id,
          match.temp_player3_id,
          match.temp_player4_id,
        ].filter(Boolean)
        if (!playerIds.includes(selectedPlayer)) return false
      }

      // Filtro de rango de fechas
      if (dateFrom || dateTo) {
        const matchDate = new Date(match.played_at)
        matchDate.setHours(0, 0, 0, 0)
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom)
          fromDate.setHours(0, 0, 0, 0)
          if (matchDate < fromDate) return false
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo)
          toDate.setHours(23, 59, 59, 999)
          if (matchDate > toDate) return false
        }
      }

      return true
    })
  }, [matches, filter, searchQuery, selectedSeason, selectedPlayer, dateFrom, dateTo])

  const pendingCount = matches.filter((m) => m.status === "pending").length
  const validatedCount = matches.filter((m) => m.status === "validated" || m.status === "canceled").length

  // Contar filtros activos
  const activeFiltersCount = [
    selectedSeason !== "all",
    selectedPlayer !== "all",
    dateFrom !== "",
    dateTo !== "",
  ].filter(Boolean).length

  const clearFilters = () => {
    setSelectedSeason("all")
    setSelectedPlayer("all")
    setDateFrom("")
    setDateTo("")
    setSearchQuery("")
  }

  // Agrupar partidas por fecha para separadores visuales
  const groupedMatches = filteredMatches.reduce((acc, match) => {
    const date = new Date(match.played_at).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(match)
    return acc
  }, {} as Record<string, typeof filteredMatches>)

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Partidas</h1>
          <p className="text-sm text-muted-foreground">Gestiona y visualiza todas las partidas registradas</p>
        </div>

        {/* Campo de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por jugador, fecha, puntuación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-11 shadow-sm focus:shadow-md transition-shadow"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Botón de filtros */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              Limpiar
            </Button>
          )}
        </div>

        {/* Panel de filtros avanzados */}
        {showFilters && (
          <div className="space-y-3 p-4 border rounded-lg bg-card shadow-md animate-in slide-in-from-top-2 duration-200">
            {/* Filtro de temporada */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Temporada</label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las temporadas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las temporadas</SelectItem>
                  {seasons.filter(s => s.is_active).length > 0 && (
                    <SelectItem value="current">
                      Temporada actual ({seasons.find(s => s.is_active)?.name})
                    </SelectItem>
                  )}
                  {seasons.filter(s => !s.is_active).map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de jugador */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Jugador</label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los jugadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los jugadores</SelectItem>
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} {player.is_temp ? "(Temporal)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de rango de fechas */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Rango de fechas
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Desde</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Hasta</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs de estado */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="font-medium">
              Todas ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="font-medium">
              Pendientes ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="validated" className="font-medium">
              Validadas ({validatedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Contador de resultados */}
        {filteredMatches.length !== matches.length && (
          <div className="text-sm text-muted-foreground text-center py-2">
            Mostrando {filteredMatches.length} de {matches.length} partidas
          </div>
        )}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-base font-medium">No hay partidas {filter !== "all" ? (filter === "pending" ? "pendientes" : "validadas") : ""}</p>
          {(searchQuery || activeFiltersCount > 0) && (
            <p className="text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMatches).map(([date, dateMatches]) => (
            <div key={date} className="space-y-3">
              <div className="sticky top-0 z-10 bg-emerald-50/80 dark:bg-emerald-950/50 backdrop-blur-md py-3 mb-2 border-b-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
                <h2 className="text-base font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                  <span className="text-muted-foreground font-normal normal-case text-sm">
                    {new Date(dateMatches[0].played_at).toLocaleDateString('es-ES', { weekday: 'long' })}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span>{date}</span>
                  <span className="ml-auto text-xs font-normal normal-case text-muted-foreground">
                    {dateMatches.length} {dateMatches.length === 1 ? 'partida' : 'partidas'}
                  </span>
                </h2>
              </div>
              <div className="space-y-2 pl-2 border-l-2 border-emerald-200 dark:border-emerald-800">
                {dateMatches.map((match) => (
                  <MatchCard key={match.id} match={match} currentUserId={currentUserId} isAdmin={isAdmin} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
