"use client"

import { useState, useEffect } from "react"
import type { Profile } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Shield, ShieldOff, CheckCircle, Clock, XCircle } from "lucide-react"

interface AllUsersTabProps {
  users: Profile[]
}

export function AllUsersTab({ users }: AllUsersTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
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

  return (
    <div className="space-y-2">
      {users.map((user) => {
        const status = statusConfig[user.status]
        const StatusIcon = status.icon

        return (
          <Card key={user.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
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
                  <Badge variant="secondary" className={`${status.color} mt-1`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
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
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
