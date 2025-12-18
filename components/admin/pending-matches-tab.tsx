"use client"

import { useState } from "react"
import type { Match } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Check, X, Trophy } from "lucide-react"

interface PendingMatchesTabProps {
  matches: Match[]
}

export function PendingMatchesTab({ matches }: PendingMatchesTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  const handleAction = async (matchId: string, action: "validated" | "rejected") => {
    setProcessingId(matchId)
    try {
      const supabase = createClient()
      await supabase.from("matches").update({ status: action, updated_at: new Date().toISOString() }).eq("id", matchId)

      router.refresh()
    } catch (error) {
      console.error("Error updating match:", error)
    } finally {
      setProcessingId(null)
    }
  }

  if (matches.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-emerald-200" />
          <p>No hay partidas pendientes de validación</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => {
        const team1Players = [match.player1 || match.temp_player1, match.player2 || match.temp_player2]
        const team2Players = [match.player3 || match.temp_player3, match.player4 || match.temp_player4]
        const isTeam1Winner = match.winner_team === 1

        // Obtener información de validaciones
        const validations = match.validations || []
        const profilePlayers = [match.player1, match.player2, match.player3, match.player4]
        
        const validatedPlayers = validations
          .filter((v) => v.validated)
          .map((v) => v.player?.name || profilePlayers.find((p) => p?.id === v.player_id)?.name)
          .filter(Boolean)
        
        const pendingPlayers = profilePlayers
          .filter((p) => {
            if (!p) return false
            const validation = validations.find((v) => v.player_id === p.id)
            return !validation || !validation.validated
          })
          .map((p) => p?.name)
          .filter(Boolean)

        return (
          <Card key={match.id} className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{format(new Date(match.played_at), "d MMM yyyy, HH:mm", { locale: es })}</span>
                <span>Por {match.creator?.name}</span>
              </div>

              {/* Teams */}
              <div className="space-y-2">
                <div
                  className={`flex items-center justify-between p-2 rounded ${isTeam1Winner ? "bg-emerald-50" : "bg-gray-50"}`}
                >
                  <div className="flex items-center gap-2">
                    {isTeam1Winner && <Trophy className="h-4 w-4 text-emerald-600" />}
                    <span className="text-sm font-medium">{team1Players.map((p) => p?.name).join(" & ")}</span>
                  </div>
                  <span className="font-bold">{match.team1_score}</span>
                </div>
                <div
                  className={`flex items-center justify-between p-2 rounded ${!isTeam1Winner ? "bg-blue-50" : "bg-gray-50"}`}
                >
                  <div className="flex items-center gap-2">
                    {!isTeam1Winner && <Trophy className="h-4 w-4 text-blue-600" />}
                    <span className="text-sm font-medium">{team2Players.map((p) => p?.name).join(" & ")}</span>
                  </div>
                  <span className="font-bold">{match.team2_score}</span>
                </div>
              </div>

              {/* Estado de validaciones */}
              {validations.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  {validatedPlayers.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Validado por: </span>
                      <span className="font-medium text-emerald-600">{validatedPlayers.join(", ")}</span>
                    </div>
                  )}
                  {pendingPlayers.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Pendiente: </span>
                      <span className="font-medium text-amber-600">{pendingPlayers.join(", ")}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAction(match.id, "validated")}
                  disabled={processingId === match.id}
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Validar
                </Button>
                <Button
                  onClick={() => handleAction(match.id, "rejected")}
                  disabled={processingId === match.id}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Rechazar
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
