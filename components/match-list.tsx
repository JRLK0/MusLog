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

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todas ({matches.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendientes ({pendingCount})</TabsTrigger>
          <TabsTrigger value="validated">Validadas ({validatedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay partidas {filter !== "all" ? (filter === "pending" ? "pendientes" : "validadas") : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} currentUserId={currentUserId} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  )
}
