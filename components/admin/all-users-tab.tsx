"use client"

import { useState, useEffect } from "react"
import type { Profile } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Shield, ShieldOff, CheckCircle, Clock, XCircle, UserX, UserCheck, Lock, Unlock, Mail } from "lucide-react"

interface AllUsersTabProps {
  users: Profile[]
  emailVerificationMap: Record<string, boolean>
}

const SUPER_ADMIN_EMAIL = "admin@megia.eu"

export function AllUsersTab({ users, emailVerificationMap }: AllUsersTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState<boolean>(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [blockLoginDialogOpen, setBlockLoginDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: "suspend" | "activate" | "block" | "unblock"
    userId: string
    userName: string
    currentState: boolean
  } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{
    userId: string
    userName: string
    userEmail?: string | null
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        setCurrentUserEmail(user.email ?? null)
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

  const handleSuspendClick = (userId: string, userName: string, isActive: boolean) => {
    // Prevenir que un admin se suspenda a sí mismo
    if (userId === currentUserId && currentUserIsAdmin && isActive) {
      alert("No puedes suspenderse a ti mismo como administrador")
      return
    }

    setPendingAction({
      type: isActive ? "suspend" : "activate",
      userId,
      userName,
      currentState: isActive,
    })
    setSuspendDialogOpen(true)
  }

  const confirmSuspendAction = async () => {
    if (!pendingAction) return

    setSuspendDialogOpen(false)
    setProcessingId(`${pendingAction.userId}-player`)
    try {
      const supabase = createClient()
      await supabase
        .from("profiles")
        .update({
          is_active_player: !pendingAction.currentState,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingAction.userId)

      router.refresh()
    } catch (error) {
      console.error("Error toggling active player:", error)
    } finally {
      setProcessingId(null)
      setPendingAction(null)
    }
  }

  const handleBlockLoginClick = (userId: string, userName: string, canLogin: boolean) => {
    // Prevenir que un admin bloquee su propio login
    if (userId === currentUserId && currentUserIsAdmin) {
      alert("No puedes bloquear tu propio acceso como administrador")
      return
    }

    setPendingAction({
      type: canLogin ? "block" : "unblock",
      userId,
      userName,
      currentState: canLogin,
    })
    setBlockLoginDialogOpen(true)
  }

  const confirmBlockLoginAction = async () => {
    if (!pendingAction) return

    setBlockLoginDialogOpen(false)
    setProcessingId(`${pendingAction.userId}-login`)
    try {
      const supabase = createClient()
      await supabase
        .from("profiles")
        .update({
          can_login: !pendingAction.currentState,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingAction.userId)

      router.refresh()
    } catch (error) {
      console.error("Error toggling login:", error)
    } finally {
      setProcessingId(null)
      setPendingAction(null)
    }
  }

  const handleVerifyEmail = async (userId: string) => {
    setProcessingId(`${userId}-verify`)
    try {
      const response = await fetch("/api/admin/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result?.success) {
        alert(result?.error || "No se pudo verificar el correo del usuario.")
        return
      }

      router.refresh()
    } catch (error) {
      console.error("Error verifying user email:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteClick = (userId: string, userName: string, userEmail?: string | null) => {
    setPendingDelete({ userId, userName, userEmail })
    setDeleteDialogOpen(true)
  }

  const confirmDeleteAction = async () => {
    if (!pendingDelete) return

    setDeleteDialogOpen(false)
    setProcessingId(`${pendingDelete.userId}-delete`)
    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: pendingDelete.userId }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result?.success) {
        alert(result?.error || "No se pudo eliminar el usuario.")
        return
      }

      router.refresh()
    } catch (error) {
      console.error("Error deleting user:", error)
    } finally {
      setProcessingId(null)
      setPendingDelete(null)
    }
  }

  const isSuperAdmin = currentUserEmail === SUPER_ADMIN_EMAIL

  return (
    <>
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
                  {user.email && (
                    <Badge
                      variant="secondary"
                      className={
                        (emailVerificationMap[user.id] || emailVerificationMap[user.email.toLowerCase()])
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      {(emailVerificationMap[user.id] || emailVerificationMap[user.email.toLowerCase()]) 
                        ? "Email verificado" 
                        : "Email sin verificar"}
                    </Badge>
                  )}
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                    disabled={processingId === user.id || (user.is_admin && user.id === currentUserId) || user.email === 'admin@megia.eu'}
                    variant="outline"
                    size="sm"
                    className={user.is_admin ? "text-red-600" : "text-blue-600"}
                    title={
                      user.email === 'admin@megia.eu' 
                        ? "Este usuario es el super administrador y no puede ser modificado"
                        : user.is_admin && user.id === currentUserId 
                          ? "No puedes quitarte el rol de admin a ti mismo" 
                          : undefined
                    }
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
                    onClick={() => handleSuspendClick(user.id, user.name, user.is_active_player ?? true)}
                    disabled={processingId === `${user.id}-player` || (user.is_admin && user.id === currentUserId) || user.email === 'admin@megia.eu'}
                    variant="outline"
                    size="sm"
                    className={user.is_active_player === false ? "text-amber-700" : "text-emerald-700"}
                    title={
                      user.email === 'admin@megia.eu'
                        ? "Este usuario no puede ser suspendido"
                        : user.is_admin && user.id === currentUserId
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
                    onClick={() => handleBlockLoginClick(user.id, user.name, user.can_login ?? true)}
                    disabled={processingId === `${user.id}-login` || (user.is_admin && user.id === currentUserId) || user.email === 'admin@megia.eu'}
                    variant="outline"
                    size="sm"
                    className={user.can_login === false ? "text-emerald-700" : "text-red-700"}
                    title={
                      user.email === 'admin@megia.eu'
                        ? "El login de este usuario no puede ser bloqueado"
                        : user.is_admin && user.id === currentUserId
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

                  {!emailVerificationMap[user.id] && !emailVerificationMap[user.email?.toLowerCase() || ''] && (
                    <Button
                      onClick={() => handleVerifyEmail(user.id)}
                      disabled={processingId === `${user.id}-verify`}
                      variant="outline"
                      size="sm"
                      className="text-emerald-700"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Verificar correo
                    </Button>
                  )}

                  {isSuperAdmin && (
                    <Button
                      onClick={() => handleDeleteClick(user.id, user.name, user.email)}
                      disabled={
                        processingId === `${user.id}-delete` ||
                        user.id === currentUserId ||
                        user.email === SUPER_ADMIN_EMAIL
                      }
                      variant="outline"
                      size="sm"
                      className="text-red-700 border-red-200 hover:bg-red-50"
                      title={
                        user.id === currentUserId
                          ? "No puedes eliminar tu propio usuario"
                          : user.email === SUPER_ADMIN_EMAIL
                            ? "Este usuario es el super administrador y no puede ser eliminado"
                            : undefined
                      }
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
      </div>

      {/* Diálogo de confirmación para suspender/activar jugador */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "suspend" ? "¿Suspender jugador?" : "¿Activar jugador?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {pendingAction?.type === "suspend" ? (
                <>
                  <p>
                    Estás a punto de <strong>suspender</strong> a <strong>{pendingAction.userName}</strong>.
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-1 text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100">Consecuencias:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
                      <li>No podrá ser agregado a nuevas partidas</li>
                      <li>Seguirá apareciendo en los rankings históricos</li>
                      <li>Todas sus validaciones pendientes se aprobarán automáticamente</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Estás a punto de <strong>activar</strong> a <strong>{pendingAction?.userName}</strong>.
                  </p>
                  <p className="text-muted-foreground">
                    El jugador podrá ser agregado nuevamente a nuevas partidas.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSuspendAction}
              className={
                pendingAction?.type === "suspend"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              {pendingAction?.type === "suspend" ? "Suspender" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para bloquear/habilitar login */}
      <AlertDialog open={blockLoginDialogOpen} onOpenChange={setBlockLoginDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "block" ? "¿Bloquear acceso?" : "¿Habilitar acceso?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {pendingAction?.type === "block" ? (
                <>
                  <p>
                    Estás a punto de <strong>bloquear el acceso</strong> de <strong>{pendingAction.userName}</strong>.
                  </p>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 space-y-1 text-sm">
                    <p className="font-medium text-red-900 dark:text-red-100">Consecuencias:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-200">
                      <li>No podrá iniciar sesión en la aplicación</li>
                      <li>Quedará completamente bloqueado hasta que habilites su acceso</li>
                      <li>No podrá acceder a ninguna funcionalidad de la aplicación</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Estás a punto de <strong>habilitar el acceso</strong> de <strong>{pendingAction?.userName}</strong>.
                  </p>
                  <p className="text-muted-foreground">
                    El usuario podrá iniciar sesión nuevamente en la aplicación.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBlockLoginAction}
              className={
                pendingAction?.type === "block"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              {pendingAction?.type === "block" ? "Bloquear acceso" : "Habilitar acceso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para eliminar usuario */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Estás a punto de <strong>eliminar</strong> a <strong>{pendingDelete?.userName}</strong>.
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 space-y-1 text-sm">
                <p className="font-medium text-red-900 dark:text-red-100">Consecuencias:</p>
                <ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-200">
                  <li>Se eliminará su acceso a la aplicación</li>
                  <li>Sus partidas se temporizarán como jugador invitado</li>
                  <li>La acción no se puede deshacer</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAction} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
