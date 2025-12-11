"use client"

import { useState } from "react"
import type { Match } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, Trophy, XCircle, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  // Obtener información de validaciones
  const validations = match.validations || []
  const allPlayers = [match.player1, match.player2, match.player3, match.player4]
  
  const validatedPlayers = validations
    .filter((v) => v.validated)
    .map((v) => v.player?.name || allPlayers.find((p) => p?.id === v.player_id)?.name)
    .filter(Boolean)
  
  const pendingPlayers = allPlayers
    .filter((p) => {
      if (!p) return false
      const validation = validations.find((v) => v.player_id === p.id)
      return !validation || !validation.validated
    })
    .map((p) => p?.name)
    .filter(Boolean)

  const currentUserValidation = validations.find((v) => v.player_id === currentUserId)
  const hasCurrentUserValidated = currentUserValidation?.validated || false

  // Determinar quién validó la partida si está validada
  const allPlayersValidated = validatedPlayers.length === 4
  const validatedByInfo = match.status === "validated" 
    ? (allPlayersValidated 
        ? `Validada por todos los jugadores: ${validatedPlayers.join(", ")}`
        : validatedPlayers.length > 0
          ? `Validada por admin (jugadores que validaron: ${validatedPlayers.join(", ")})`
          : "Validada por admin")
    : null

  const handleValidate = async (asAdmin: boolean = false) => {
    setIsValidating(true)
    try {
      const supabase = createClient()

      if (asAdmin) {
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

          {/* Mostrar quién validó si la partida está validada */}
          {match.status === "validated" && validatedByInfo && (
            <div className="text-xs pt-1 border-t">
              <span className="text-muted-foreground">✓ </span>
              <span className="font-medium text-emerald-600">{validatedByInfo}</span>
            </div>
          )}

          {/* Mostrar estado de validaciones si la partida está pendiente */}
          {match.status === "pending" && validations.length > 0 && (
            <div className="space-y-2">
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

          {/* Botones de validación */}
          {match.status === "pending" && (isParticipant || isAdmin) && (
            <div className="space-y-2">
              {isAdmin && isParticipant && !hasCurrentUserValidated ? (
                // Admin que participa y no ha validado: mostrar dropdown con ambas opciones
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={isValidating}
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isValidating ? "Validando..." : "Validar"}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => handleValidate(false)}
                      disabled={isValidating}
                    >
                      Validar mi participación
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleValidate(true)}
                      disabled={isValidating}
                    >
                      Validar como admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : isAdmin && !isParticipant ? (
                // Admin que no participa: solo puede validar como admin
                <Button
                  onClick={() => handleValidate(true)}
                  disabled={isValidating}
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isValidating ? "Validando..." : "Validar como admin"}
                </Button>
              ) : isParticipant && !hasCurrentUserValidated ? (
                // Participante normal: validar participación
                <Button
                  onClick={() => handleValidate(false)}
                  disabled={isValidating}
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isValidating ? "Validando..." : "Validar mi participación"}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
