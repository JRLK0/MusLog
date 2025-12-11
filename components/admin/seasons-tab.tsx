"use client"

import { useState } from "react"
import type { Season } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Plus, X, Trophy, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SeasonsTabProps {
  activeSeason: Season | null
  closedSeasons: Season[]
}

export function SeasonsTab({ activeSeason, closedSeasons }: SeasonsTabProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [seasonName, setSeasonName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleCreateSeason = async () => {
    if (!seasonName.trim()) {
      alert("Por favor ingresa un nombre para la temporada")
      return
    }

    setIsProcessing(true)
    try {
      const supabase = createClient()

      // Cerrar temporada activa si existe
      if (activeSeason) {
        await supabase
          .from("seasons")
          .update({
            is_active: false,
            end_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeSeason.id)
      }

      // Crear nueva temporada activa
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("seasons").insert({
        name: seasonName.trim(),
        start_date: new Date().toISOString(),
        is_active: true,
        created_by: user?.id,
      })

      if (error) throw error

      // Si es la primera temporada, asignar partidas existentes
      if (!activeSeason && closedSeasons.length === 0) {
        const { error: assignError } = await supabase.rpc("assign_existing_matches_to_first_season")
        if (assignError) {
          console.error("Error asignando partidas existentes:", assignError)
        }
      }

      setSeasonName("")
      setIsCreating(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating season:", error)
      alert("Error al crear la temporada. Por favor intenta de nuevo.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseSeason = async () => {
    if (!activeSeason) return

    if (!confirm(`¿Estás seguro de cerrar la temporada "${activeSeason.name}"?`)) {
      return
    }

    setIsClosing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("seasons")
        .update({
          is_active: false,
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeSeason.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error closing season:", error)
      alert("Error al cerrar la temporada. Por favor intenta de nuevo.")
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Temporada activa */}
      {activeSeason ? (
        <Card className="border-0 shadow-sm border-emerald-200 border-2">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-600 text-white">Activa</Badge>
                  <h3 className="text-lg font-semibold">{activeSeason.name}</h3>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Inicio: {format(new Date(activeSeason.start_date), "d MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>
                  {activeSeason.creator && (
                    <div className="text-xs">Creada por {activeSeason.creator.name}</div>
                  )}
                </div>
              </div>
              <Button
                onClick={handleCloseSeason}
                disabled={isClosing}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {isClosing ? "Cerrando..." : "Cerrar temporada"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 text-amber-200" />
            <p className="mb-4">No hay temporada activa</p>
            <Button onClick={() => setIsCreating(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Crear primera temporada
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Formulario para crear nueva temporada */}
      {isCreating && (
        <Card className="border-0 shadow-sm border-blue-200 border-2">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Crear nueva temporada</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="season-name">Nombre de la temporada</Label>
                <Input
                  id="season-name"
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  placeholder="Ej: Temporada Verano 2024"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateSeason}
                  disabled={isProcessing || !seasonName.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing ? "Creando..." : activeSeason ? "Cerrar actual y crear nueva" : "Crear temporada"}
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false)
                    setSeasonName("")
                  }}
                  variant="outline"
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
              </div>
              {activeSeason && (
                <p className="text-xs text-muted-foreground">
                  Al crear una nueva temporada, la temporada actual "{activeSeason.name}" se cerrará automáticamente.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón para crear nueva temporada cuando hay una activa */}
      {activeSeason && !isCreating && (
        <Button
          onClick={() => setIsCreating(true)}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear nueva temporada
        </Button>
      )}

      {/* Historial de temporadas cerradas */}
      {closedSeasons.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Historial de temporadas
          </h3>
          {closedSeasons.map((season) => (
            <Card key={season.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">{season.name}</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(season.start_date), "d MMM yyyy", { locale: es })} -{" "}
                          {season.end_date
                            ? format(new Date(season.end_date), "d MMM yyyy", { locale: es })
                            : "Activa"}
                        </span>
                      </div>
                      {season.creator && <div className="text-xs">Creada por {season.creator.name}</div>}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100">
                    Cerrada
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {closedSeasons.length === 0 && activeSeason && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p>No hay temporadas cerradas aún</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


