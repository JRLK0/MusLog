"use client"

import { useState } from "react"
import type { Match } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, Trophy, XCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface MatchCardProps {
  match: Match
  currentUserId: string
  isAdmin: boolean
}

export function MatchCard({ match, currentUserId, isAdmin }: MatchCardProps) {
  const [isValidating, setIsValidating] = useState(false)
  const router = useRouter()

  const isParticipant = [match.player1_id, match.player2_id, match.player3_id, match.player4_id].includes(currentUserId)

  const team1Players = [match.player1, match.player2]
  const team2Players = [match.player3, match.player4]
  const isTeam1Winner = match.winner_team === 1

  const handleValidate = async () => {
    setIsValidating(true)
    try {
      const supabase = createClient()

      if (isAdmin) {
        // Admin validates the match directly
        await supabase
          .from("matches")
          .update({ status: "validated", updated_at: new Date().toISOString() })
          .eq("id", match.id)
      } else {
        // Player validates their participation
        await supabase
          .from("match_validations")
          .update({ validated: true, validated_at: new Date().toISOString() })
          .eq("match_id", match.id)
          .eq("player_id", currentUserId)
      }

      router.refresh()
    } catch (error) {
      console.error("Error validating match:", error)
    } finally {
      setIsValidating(false)
    }
  }

  const statusConfig = {
    pending: { label: "Pendiente", icon: Clock, color: "bg-amber-100 text-amber-800" },
    validated: { label: "Validada", icon: CheckCircle, color: "bg-emerald-100 text-emerald-800" },
    rejected: { label: "Rechazada", icon: XCircle, color: "bg-red-100 text-red-800" },
  }

  const status = statusConfig[match.status]
  const StatusIcon = status.icon

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Header with date and status */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
          <span className="text-xs text-muted-foreground">
            {format(new Date(match.played_at), "d MMM yyyy, HH:mm", { locale: es })}
          </span>
          <Badge variant="secondary" className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        {/* Teams */}
        <div className="p-4 space-y-3">
          {/* Team 1 */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${isTeam1Winner ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50"}`}
          >
            <div className="flex items-center gap-2">
              {isTeam1Winner && <Trophy className="h-4 w-4 text-emerald-600" />}
              <div>
                <p className={`text-sm font-medium ${isTeam1Winner ? "text-emerald-800" : ""}`}>
                  {team1Players.map((p) => p?.name).join(" & ")}
                </p>
                <p className="text-xs text-muted-foreground">Equipo 1</p>
              </div>
            </div>
            <span className={`text-xl font-bold ${isTeam1Winner ? "text-emerald-600" : "text-muted-foreground"}`}>
              {match.team1_score}
            </span>
          </div>

          {/* Team 2 */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg ${!isTeam1Winner ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}
          >
            <div className="flex items-center gap-2">
              {!isTeam1Winner && <Trophy className="h-4 w-4 text-blue-600" />}
              <div>
                <p className={`text-sm font-medium ${!isTeam1Winner ? "text-blue-800" : ""}`}>
                  {team2Players.map((p) => p?.name).join(" & ")}
                </p>
                <p className="text-xs text-muted-foreground">Equipo 2</p>
              </div>
            </div>
            <span className={`text-xl font-bold ${!isTeam1Winner ? "text-blue-600" : "text-muted-foreground"}`}>
              {match.team2_score}
            </span>
          </div>
        </div>

        {/* Footer with creator and validation */}
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-muted-foreground">Registrada por {match.creator?.name}</p>

          {match.status === "pending" && (isParticipant || isAdmin) && (
            <Button
              onClick={handleValidate}
              disabled={isValidating}
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isValidating ? "Validando..." : isAdmin ? "Validar como admin" : "Validar mi participación"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
