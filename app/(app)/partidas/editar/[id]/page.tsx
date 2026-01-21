"use client"

import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import type { Match, Profile, SeasonPlayer } from "@/lib/types"
import { Trophy, AlertCircle, Loader2 } from "lucide-react"
import { MatchForm } from "@/components/match-form"
import { Button } from "@/components/ui/button"

export default function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = use(params)
  
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Array<Profile | (SeasonPlayer & { type: "temp" })>>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        
        // 1. Get current user & admin status
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }
        setCurrentUserId(user.id)

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single()
        
        const userIsAdmin = profile?.is_admin || false
        setIsAdmin(userIsAdmin)

        // 2. Fetch match data
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select("*, player1:player1_id(id, name), player2:player2_id(id, name), player3:player3_id(id, name), player4:player4_id(id, name)")
          .eq("id", matchId)
          .single()

        if (matchError || !matchData) {
          setError("No se pudo encontrar la partida")
          return
        }

        // 3. Check permissions
        const isParticipant = [
          matchData.player1_id, 
          matchData.player2_id, 
          matchData.player3_id, 
          matchData.player4_id,
          matchData.created_by
        ].includes(user.id)

        if (!userIsAdmin && !isParticipant) {
          setError("No tienes permiso para editar esta partida")
          return
        }

        if (matchData.status === 'validated' || matchData.status === 'canceled') {
          setError("No se puede editar una partida que ya ha sido validada o dada de baja")
          return
        }

        setMatch(matchData)

        // 4. Fetch approved profiles
        const { data: approved } = await supabase
          .from("profiles")
          .select("*")
          .eq("status", "approved")
          .or("is_active_player.is.null,is_active_player.eq.true")
          .order("name")

        // 5. Fetch season players (temp players) for the match's season
        let tempPlayers: SeasonPlayer[] = []
        if (matchData.season_id) {
          const { data: temps } = await supabase
            .from("season_players")
            .select("*")
            .eq("season_id", matchData.season_id)
            .order("name")
          tempPlayers = temps || []
        }

        if (approved) {
          const filteredApproved = approved.filter(p => p.email !== 'admin@megia.eu')
          const normalized = [
            ...filteredApproved,
            ...tempPlayers.map((t) => ({ ...t, type: "temp" as const })),
          ]
          setPlayers(normalized)
        }
      } catch (err) {
        console.error("Error fetching edit data:", err)
        setError("Error al cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [matchId, router])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-400">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
                <Button onClick={() => router.push("/partidas")}>Volver a partidas</Button>
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
            Editar Partida
          </CardTitle>
          <CardDescription>
            Modifica los detalles de la partida. Al guardar, se resetearán las validaciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {match && currentUserId && (
            <MatchForm 
              initialData={match}
              players={players} 
              currentUserId={currentUserId} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}


