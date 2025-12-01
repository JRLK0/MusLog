"use client"

import { useState } from "react"
import type { Profile } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Check, X, Mail, Calendar } from "lucide-react"

interface PendingUsersTabProps {
  users: Profile[]
}

export function PendingUsersTab({ users }: PendingUsersTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  const handleAction = async (userId: string, action: "approved" | "rejected") => {
    setProcessingId(userId)
    try {
      const supabase = createClient()
      await supabase.from("profiles").update({ status: action, updated_at: new Date().toISOString() }).eq("id", userId)

      router.refresh()
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setProcessingId(null)
    }
  }

  if (users.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-8 text-center text-muted-foreground">
          <UserCheckIcon className="h-12 w-12 mx-auto mb-3 text-emerald-200" />
          <p>No hay solicitudes pendientes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <Card key={user.id} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">{user.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Mail className="h-3 w-3" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>Registrado el {format(new Date(user.created_at), "d MMM yyyy", { locale: es })}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleAction(user.id, "approved")}
                  disabled={processingId === user.id}
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Aprobar
                </Button>
                <Button
                  onClick={() => handleAction(user.id, "rejected")}
                  disabled={processingId === user.id}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Rechazar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function UserCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
