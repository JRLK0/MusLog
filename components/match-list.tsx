"use client"

import { useState } from "react"
import type { Match } from "@/lib/types"
import { MatchCard } from "@/components/match-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MatchListProps {
  matches: Match[]
  currentUserId: string
  isAdmin: boolean
}

export function MatchList({ matches, currentUserId, isAdmin }: MatchListProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "validated">("all")

  const filteredMatches = matches.filter((match) => {
    if (filter === "all") return true
    return match.status === filter
  })

  const pendingCount = matches.filter((m) => m.status === "pending").length
  const validatedCount = matches.filter((m) => m.status === "validated").length

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
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Partidas</h1>
          <p className="text-sm text-muted-foreground">Gestiona y visualiza todas las partidas registradas</p>
        </div>
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
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-base">No hay partidas {filter !== "all" ? (filter === "pending" ? "pendientes" : "validadas") : ""}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMatches).map(([date, dateMatches]) => (
            <div key={date} className="space-y-3">
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 mb-2 border-b-2 border-gray-300 dark:border-gray-600">
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
              <div className="space-y-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
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
