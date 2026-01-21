"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import type { Profile, SeasonPlayer } from "@/lib/types"
import { Trophy, AlertCircle } from "lucide-react"
import { MatchForm } from "@/components/match-form"
import { Button } from "@/components/ui/button"

export default function NuevaPartidaPage() {
  const [players, setPlayers] = useState<Array<Profile | (SeasonPlayer & { type: "temp" })>>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activeSeasonName, setActiveSeasonName] = useState<string | null>(null)
  const [hasActiveSeason, setHasActiveSeason] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      // Fetch approved profiles
      const { data: approved } = await supabase
        .from("profiles")
        .select("*")
        .eq("status", "approved")
        .or("is_active_player.is.null,is_active_player.eq.true")
        .order("name")

      // Fetch active season and its temp players
      const { data: activeSeason } = await supabase
        .from("seasons")
        .select("id, name")
        .eq("is_active", true)
        .maybeSingle()

      let tempPlayers: SeasonPlayer[] = []
      if (activeSeason) {
        setActiveSeasonName(activeSeason.name)
        setHasActiveSeason(true)
        const { data: temps } = await supabase
          .from("season_players")
          .select("*")
          .eq("is_active", true)
          .eq("season_id", activeSeason.id)
          .order("name")
        tempPlayers = temps || []
      } else {
        setHasActiveSeason(false)
      }

      if (approved) {
        // Filter out super admin from being selected in matches
        const filteredApproved = approved.filter(p => p.email !== 'admin@megia.eu')
        
        const normalized = [
          ...filteredApproved,
          ...tempPlayers.map((t) => ({ ...t, type: "temp" as const })),
        ]
        setPlayers(normalized)
      }
    }
    fetchData()
  }, [])

  // Si no hay temporada activa, mostrar aviso
  if (hasActiveSeason === false) {
    return (
      <div className="p-4">
        <Card className="border-0 shadow-lg border-amber-300/50 border-2 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-900/10 dark:to-amber-800/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 shadow-md">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Temporada no activada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No se puede registrar una partida porque no hay una temporada activa. Por favor, contacta con un
                  administrador para que active una temporada.
                </p>
                <Button variant="outline" onClick={() => router.push("/temporadas")}>
                  Ver temporadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Nueva Partida
          </CardTitle>
          <CardDescription>
            Registra una nueva partida de Mus
            {activeSeasonName && (
              <span className="block mt-1 text-xs text-primary font-medium">
                Temporada activa: {activeSeasonName}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentUserId && (
            <MatchForm 
              players={players} 
              currentUserId={currentUserId} 
              activeSeasonName={activeSeasonName} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
