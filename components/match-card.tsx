"use client"

import { useState } from "react"
import type { Match } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, Trophy, XCircle, ChevronDown, Users, UserCheck, UserX, ChevronRight, Edit2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const isCreator = match.created_by === currentUserId
  const canEdit = (isAdmin || (isParticipant || isCreator)) && match.status === "pending"
  const canCancel = isAdmin && match.status !== "canceled"
  const isCanceled = match.status === "canceled"

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

  const currentUserValidation = validations.find((v) => v.player_id === currentUserId)
  const hasCurrentUserValidated = currentUserValidation?.validated || false

  // Determinar quién validó la partida si está validada
  const requiredValidations = validations.length
  const allPlayersValidated = requiredValidations > 0 && validatedPlayers.length === requiredValidations
  const validatedByInfo = match.status === "validated" 
    ? (allPlayersValidated 
        ? `Validada por todos los jugadores requeridos: ${validatedPlayers.join(", ")}`
        : validatedPlayers.length > 0
          ? `Validada por admin (jugadores que validaron: ${validatedPlayers.join(", ")})`
          : "Validada por admin")
    : null
  const canceledByName = match.canceled_by_profile?.name || null
  const canceledAtLabel = match.canceled_at
    ? format(new Date(match.canceled_at), "d MMM yyyy, HH:mm", { locale: es })
    : "fecha no registrada"
  const canceledByLabel = canceledByName || "administrador"

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

  const handleCancelMatch = async () => {
    if (!confirm("¿Estás seguro de que quieres dar de baja esta partida?")) return

    setIsValidating(true)
    try {
      console.log("Intentando dar de baja partida ID:", match.id)
      const supabase = createClient()
      const { data, error, status, statusText } = await supabase
        .from("matches")
        .update({ status: "canceled", canceled_by: currentUserId, canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", match.id)
        .select()
      
      if (error) {
        console.error("Supabase error detail:", error)
        console.error("HTTP Status:", status, statusText)
        throw error
      }

      if (!data || data.length === 0) {
        console.warn("No se actualizó ninguna fila. Verificando RLS/Permisos.")
        throw new Error("No tienes permiso para realizar esta acción o la partida no existe.")
      }

      console.log("Partida dada de baja con éxito:", data)
      router.refresh()
    } catch (error: any) {
      console.error("Full error object:", error)
      let errorMsg = "Error desconocido"
      
      if (error && typeof error === 'object') {
        errorMsg = error.message || error.details || error.hint || JSON.stringify(error)
      } else if (typeof error === 'string') {
        errorMsg = error
      }
      
      alert("Error al dar de baja la partida: " + errorMsg)
    } finally {
      setIsValidating(false)
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
    canceled: { label: "Dada de baja", icon: XCircle, color: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400" },
  }

  const status = statusConfig[match.status]
  const StatusIcon = status.icon
  const cardClassName = `border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden transition-all duration-300 cursor-pointer ${
    isCanceled
      ? "bg-slate-50/80 dark:bg-slate-900/60 hover:shadow-md"
      : "bg-white dark:bg-slate-900/50 hover:shadow-xl hover:scale-[1.01]"
  }`

  const headerClassName = `flex items-center justify-between px-4 py-3 border-b transition-all duration-200 ${
    isCanceled
      ? "bg-gradient-to-r from-slate-100/80 to-slate-200/60 dark:from-slate-900/40 dark:to-slate-900/20 border-slate-200/70 dark:border-slate-800/60 hover:from-slate-100 hover:to-slate-200/80 dark:hover:from-slate-900/50 dark:hover:to-slate-900/30"
      : "bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100/50 dark:border-blue-900/30 hover:from-blue-100/70 hover:to-indigo-100/50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30"
  }`

  return (
    <Card className={cardClassName} onClick={() => setIsExpanded(!isExpanded)}>
      <CardContent className="p-0">
        {/* Header clickeable con resumen */}
        <div className={headerClassName}>
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
            {/* Botón de acciones en vista compacta */}
            {!isExpanded && (isParticipant || isAdmin) && !isCanceled && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={isValidating}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isValidating ? "..." : "Acciones"}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {match.status === "pending" && (
                    <>
                      {isParticipant && !hasCurrentUserValidated && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleValidateClick(false, true)
                          }}
                          disabled={isValidating}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Validar mi participación
                        </DropdownMenuItem>
                      )}
                      {isAdmin && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleValidateClick(true, true)
                          }}
                          disabled={isValidating}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Validar como admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {canEdit && (
                    <DropdownMenuItem asChild>
                      <Link href={`/partidas/editar/${match.id}`} onClick={(e) => e.stopPropagation()}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Editar partida
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {canCancel && (
                    <DropdownMenuItem
                      className="text-red-600 dark:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelMatch()
                      }}
                      disabled={isValidating}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Dar de baja partida
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                  isTeam1Winner 
                    ? "bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 dark:from-emerald-900/20 dark:to-emerald-800/20 border-2 border-emerald-300/50 dark:border-emerald-500/30 shadow-md hover:shadow-lg" 
                    : "bg-gradient-to-r from-red-50/80 to-red-100/60 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-300/50 dark:border-red-500/30 shadow-md hover:shadow-lg"
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
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                  !isTeam1Winner 
                    ? "bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 dark:from-emerald-900/20 dark:to-emerald-800/20 border-2 border-emerald-300/50 dark:border-emerald-500/30 shadow-md hover:shadow-lg" 
                    : "bg-gradient-to-r from-red-50/80 to-red-100/60 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-300/50 dark:border-red-500/30 shadow-md hover:shadow-lg"
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

              {match.status === "canceled" && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Partida dada de baja</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Dada de baja por {canceledByLabel} el {canceledAtLabel}</p>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Mostrar solo quién validó si está cancelada pero tenía validaciones */}
              {match.status === "canceled" && validatedPlayers.length > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-2">
                    <UserCheck className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Había sido validada por</p>
                      <p className="text-xs text-slate-400">{validatedPlayers.join(", ")}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              {(match.status === "pending" || canEdit) && (isParticipant || isAdmin) && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex gap-2">
                    {match.status === "pending" && (
                      <div className="flex-1">
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
                                <UserCheck className="mr-2 h-4 w-4" />
                                Validar mi participación
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleValidateClick(true, false)
                                }}
                                disabled={isValidating}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
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
                    
                    {canEdit && (
                      <Button
                        asChild
                        variant="outline"
                        className={`flex-1 ${match.status === 'validated' ? 'w-full' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/partidas/editar/${match.id}`}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar Partida
                        </Link>
                      </Button>
                    )}

                    {canCancel && (
                      <Button
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelMatch()
                        }}
                        disabled={isValidating}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Dar de baja partida
                      </Button>
                    )}
                  </div>
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
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200"
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







