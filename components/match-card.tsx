"use client"

import { useState } from "react"
import type { Match } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, Trophy, XCircle, ChevronDown, Users, UserCheck, UserX, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MatchCardProps {
  match: Match
  currentUserId: string
  isAdmin: boolean
}

export function MatchCard({ match, currentUserId, isAdmin }: MatchCardProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingValidationType, setPendingValidationType] = useState<"participant" | "admin" | null>(null)
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
    setShowConfirmDialog(false)
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
      setPendingValidationType(null)
    }
  }

  const handleValidateClick = (asAdmin: boolean, fromCompact: boolean = false) => {
    if (fromCompact && !isExpanded) {
      // Si estamos en vista compacta, mostrar modal de confirmación
      setPendingValidationType(asAdmin ? "admin" : "participant")
      setShowConfirmDialog(true)
    } else {
      // Si estamos expandidos, validar directamente
      handleValidate(asAdmin)
    }
  }

  const getMatchDescription = () => {
    const team1Names = team1Players.map((p) => p?.name).join(" & ")
    const team2Names = team2Players.map((p) => p?.name).join(" & ")
    return `${team1Names} vs ${team2Names} (${match.team1_score} - ${match.team2_score})`
  }

  const renderMatchDescriptionWithColors = () => {
    const team1Names = team1Players.map((p) => p?.name).join(" & ")
    const team2Names = team2Players.map((p) => p?.name).join(" & ")
    
    return (
      <>
        <span className="block mt-2">
          <span className={`font-semibold ${isTeam1Winner ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {team1Names}
          </span>
          <span className="text-muted-foreground mx-2">vs</span>
          <span className={`font-semibold ${!isTeam1Winner ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {team2Names}
          </span>
        </span>
        <span className="block text-sm text-muted-foreground mt-1">
          ({match.team1_score} - {match.team2_score})
        </span>
      </>
    )
  }

  const getValidationTypeLabel = () => {
    if (pendingValidationType === "admin") {
      return "como administrador"
    }
    return "mi participación"
  }

  const statusConfig = {
    pending: { label: "Pendiente", icon: Clock, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
    validated: { label: "Validada", icon: CheckCircle, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
    rejected: { label: "Rechazada", icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  }

  const status = statusConfig[match.status]
  const StatusIcon = status.icon

  return (
    <Card className="border shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
      <CardContent className="p-0">
        {/* Header clickeable con resumen */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-colors">
          <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
            <ChevronRight 
              className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">
                  {format(new Date(match.played_at), "d MMM yyyy", { locale: es })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(match.played_at), "HH:mm", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${isTeam1Winner ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                  {team1Players.map((p) => p?.name).join(" & ")}
                </span>
                <span className="text-muted-foreground">vs</span>
                <span className={`text-sm font-medium ${!isTeam1Winner ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                  {team2Players.map((p) => p?.name).join(" & ")}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className={`text-base font-bold ${isTeam1Winner ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {match.team1_score} - {match.team2_score}
                </span>
                {isTeam1Winner ? (
                  <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Botón de validación en vista compacta */}
            {match.status === "pending" && (isParticipant || isAdmin) && !isExpanded && (
              <>
                {isAdmin && isParticipant && !hasCurrentUserValidated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        disabled={isValidating}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isValidating ? "..." : "Validar"}
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleValidateClick(false, true)
                        }}
                        disabled={isValidating}
                      >
                        Validar mi participación
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleValidateClick(true, true)
                        }}
                        disabled={isValidating}
                      >
                        Validar como admin
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : isAdmin && !isParticipant ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleValidateClick(true, true)
                    }}
                    disabled={isValidating}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                  >
                    {isValidating ? "..." : "Validar"}
                  </Button>
                ) : isParticipant && !hasCurrentUserValidated ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleValidateClick(false, true)
                    }}
                    disabled={isValidating}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                  >
                    {isValidating ? "..." : "Validar"}
                  </Button>
                ) : null}
              </>
            )}
            <Badge variant="secondary" className={`${status.color} font-semibold px-2 py-1`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Contenido expandible */}
        {isExpanded && (
          <>
            {/* Teams detallados */}
            <div className="p-5 space-y-4 bg-background">
              {/* Team 1 */}
              <div
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  isTeam1Winner 
                    ? "bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-2 border-emerald-400 shadow-sm" 
                    : "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-2 border-red-400 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {isTeam1Winner && <Trophy className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-semibold ${isTeam1Winner ? "text-emerald-900 dark:text-emerald-100" : "text-red-900 dark:text-red-100"}`}>
                      {team1Players.map((p) => p?.name).join(" & ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Equipo 1</p>
                  </div>
                </div>
                <span className={`text-3xl font-bold ml-4 ${isTeam1Winner ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                  {match.team1_score}
                </span>
              </div>

              {/* VS Divider */}
              <div className="flex items-center justify-center py-1">
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                <span className="px-3 text-xs font-semibold text-muted-foreground uppercase">VS</span>
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              </div>

              {/* Team 2 */}
              <div
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  !isTeam1Winner 
                    ? "bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-2 border-emerald-400 shadow-sm" 
                    : "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-2 border-red-400 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {!isTeam1Winner && <Trophy className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-semibold ${!isTeam1Winner ? "text-emerald-900 dark:text-emerald-100" : "text-red-900 dark:text-red-100"}`}>
                      {team2Players.map((p) => p?.name).join(" & ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Equipo 2</p>
                  </div>
                </div>
                <span className={`text-3xl font-bold ml-4 ${!isTeam1Winner ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                  {match.team2_score}
                </span>
              </div>
            </div>

            {/* Footer with creator and validation */}
            <div className="px-5 pb-5 space-y-4 border-t border-gray-200 dark:border-gray-700 bg-background" onClick={(e) => e.stopPropagation()}>
              <div className="pt-4">
                <p className="text-xs text-muted-foreground">
                  Registrada por <span className="font-medium text-foreground">{match.creator?.name}</span>
                </p>
              </div>

              {/* Sección de validación */}
              {match.status === "validated" && validatedByInfo && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Partida Validada</p>
                      <p className="text-xs text-muted-foreground">{validatedByInfo}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mostrar estado de validaciones si la partida está pendiente */}
              {match.status === "pending" && validations.length > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  {validatedPlayers.length > 0 && (
                    <div className="flex items-start gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Validado por</p>
                        <p className="text-xs text-foreground">{validatedPlayers.join(", ")}</p>
                      </div>
                    </div>
                  )}
                  {pendingPlayers.length > 0 && (
                    <div className="flex items-start gap-2">
                      <UserX className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Pendiente de validar</p>
                        <p className="text-xs text-foreground">{pendingPlayers.join(", ")}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botones de validación */}
              {match.status === "pending" && (isParticipant || isAdmin) && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  {isAdmin && isParticipant && !hasCurrentUserValidated ? (
                    // Admin que participa y no ha validado: mostrar dropdown con ambas opciones
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          disabled={isValidating}
                          size="default"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isValidating ? "Validando..." : "Validar"}
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleValidateClick(false, false)
                          }}
                          disabled={isValidating}
                        >
                          Validar mi participación
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleValidateClick(true, false)
                          }}
                          disabled={isValidating}
                        >
                          Validar como admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : isAdmin && !isParticipant ? (
                    // Admin que no participa: solo puede validar como admin
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleValidateClick(true, false)
                      }}
                      disabled={isValidating}
                      size="default"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                    >
                      {isValidating ? "Validando..." : "Validar como admin"}
                    </Button>
                  ) : isParticipant && !hasCurrentUserValidated ? (
                    // Participante normal: validar participación
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleValidateClick(false, false)
                      }}
                      disabled={isValidating}
                      size="default"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                    >
                      {isValidating ? "Validando..." : "Validar mi participación"}
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal de confirmación */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Se validará la partida {getValidationTypeLabel()}:
              </AlertDialogDescription>
              <div className="mt-3 space-y-2">
                {renderMatchDescriptionWithColors()}
                <p className="text-xs text-muted-foreground pt-1">
                  {format(new Date(match.played_at), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation()
                  if (pendingValidationType === "admin") {
                    handleValidate(true)
                  } else {
                    handleValidate(false)
                  }
                }}
                disabled={isValidating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isValidating ? "Validando..." : "Confirmar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
