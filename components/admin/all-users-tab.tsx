"use client"

import { useState, useEffect } from "react"
import type { Profile } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Shield, ShieldOff, CheckCircle, Clock, XCircle, UserX, UserCheck, Lock, Unlock } from "lucide-react"

interface AllUsersTabProps {
  users: Profile[]
}

export function AllUsersTab({ users }: AllUsersTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        // Obtener el perfil del usuario actual para verificar si es admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single()
        if (profile) {
          setCurrentUserIsAdmin(profile.is_admin || false)
        }
      }
    }
    getCurrentUser()
  }, [])

  const toggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    // Prevenir que el admin se quite admin a sí mismo
    if (currentIsAdmin && userId === currentUserId) {
      alert("No puedes quitarte el rol de admin a ti mismo")
      return
    }

    setProcessingId(userId)
    try {
      const supabase = createClient()
      await supabase
        .from("profiles")
        .update({ is_admin: !currentIsAdmin, updated_at: new Date().toISOString() })
        .eq("id", userId)

      router.refresh()
    } catch (error) {
      console.error("Error toggling admin:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const statusConfig = {
    pending: { label: "Pendiente", icon: Clock, color: "bg-amber-100 text-amber-800" },
    approved: { label: "Aprobado", icon: CheckCircle, color: "bg-emerald-100 text-emerald-800" },
    rejected: { label: "Rechazado", icon: XCircle, color: "bg-red-100 text-red-800" },
  }

  const toggleActivePlayer = async (userId: string, isActive: boolean) => {
    // Prevenir que un admin se suspenda a sí mismo
    if (userId === currentUserId && currentUserIsAdmin && isActive) {
      alert("No puedes suspenderse a ti mismo como administrador")
      return
    }

    setProcessingId(`${userId}-player`)
    try {
      const supabase = createClient()
      await supabase
        .from("profiles")
        .update({ is_active_player: !isActive, updated_at: new Date().toISOString() })
        .eq("id", userId)

      router.refresh()
    } catch (error) {
      console.error("Error toggling active player:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const toggleLogin = async (userId: string, canLogin: boolean) => {
    // Prevenir que un admin bloquee su propio login
    if (userId === currentUserId && currentUserIsAdmin) {
      alert("No puedes bloquear tu propio acceso como administrador")
      return
    }

    setProcessingId(`${userId}-login`)
    try {
      const supabase = createClient()
      await supabase
        .from("profiles")
        .update({ can_login: !canLogin, updated_at: new Date().toISOString() })
        .eq("id", userId)

      router.refresh()
    } catch (error) {
      console.error("Error toggling login:", error)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-2">
      {users.map((user) => {
        const status = statusConfig[user.status]
        const StatusIcon = status.icon

        return (
          <Card key={user.id} className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{user.name}</h3>
                    {user.is_admin && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className={`${status.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                    {user.is_active_player === false && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <UserX className="h-3 w-3 mr-1" />
                        Suspendido
                      </Badge>
                    )}
                    {user.can_login === false && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        <Lock className="h-3 w-3 mr-1" />
                        Login bloqueado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {user.status === "approved" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                    disabled={processingId === user.id || (user.is_admin && user.id === currentUserId)}
                    variant="outline"
                    size="sm"
                    className={user.is_admin ? "text-red-600" : "text-blue-600"}
                    title={user.is_admin && user.id === currentUserId ? "No puedes quitarte el rol de admin a ti mismo" : undefined}
                  >
                    {user.is_admin ? (
                      <>
                        <ShieldOff className="h-4 w-4 mr-1" />
                        Quitar admin
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-1" />
                        Hacer admin
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => toggleActivePlayer(user.id, user.is_active_player ?? true)}
                    disabled={processingId === `${user.id}-player` || (user.is_admin && user.id === currentUserId)}
                    variant="outline"
                    size="sm"
                    className={user.is_active_player === false ? "text-amber-700" : "text-emerald-700"}
                    title={
                      user.is_admin && user.id === currentUserId
                        ? "No puedes suspenderse a ti mismo como administrador"
                        : user.is_active_player === false
                        ? "Activar jugador"
                        : "Suspender jugador"
                    }
                  >
                    {user.is_active_player === false ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Activar jugador
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 mr-1" />
                        Suspender
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => toggleLogin(user.id, user.can_login ?? true)}
                    disabled={processingId === `${user.id}-login` || (user.is_admin && user.id === currentUserId)}
                    variant="outline"
                    size="sm"
                    className={user.can_login === false ? "text-emerald-700" : "text-red-700"}
                    title={
                      user.is_admin && user.id === currentUserId
                        ? "No puedes bloquear tu propio acceso como administrador"
                        : user.can_login === false
                        ? "Habilitar login"
                        : "Bloquear login"
                    }
                  >
                    {user.can_login === false ? (
                      <>
                        <Unlock className="h-4 w-4 mr-1" />
                        Habilitar login
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-1" />
                        Bloquear login
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
