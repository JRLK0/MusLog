"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, User, Settings, Shield, AlertCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  title: string
  userName?: string
  isAdmin?: boolean
  pendingUsersCount?: number
  pendingMatchesCount?: number
  activeSeasonName?: string | null
}

export function Header({
  title,
  userName,
  isAdmin = false,
  pendingUsersCount = 0,
  pendingMatchesCount = 0,
  activeSeasonName = null,
}: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 shadow-sm">
      <div className="grid grid-cols-3 h-14 items-center px-4">
        <div className="flex items-center gap-3">
          <Image
            src="/MusLog.png"
            alt="MusLog Logo"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
        </div>
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-lg font-semibold">{title}</h1>
          <span className="text-xs text-muted-foreground">
            {activeSeasonName || "Temporada no activada aún"}
          </span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          {pendingMatchesCount > 0 && (
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => router.push("/partidas")}>
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="absolute top-0 right-0 h-5 w-5 text-xs flex items-center justify-center bg-blue-600 text-white rounded-full">
                {pendingMatchesCount}
              </span>
            </Button>
          )}
          {isAdmin && pendingUsersCount > 0 && (
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => router.push("/admin")}>
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="absolute top-0 right-0 h-5 w-5 text-xs flex items-center justify-center bg-amber-600 text-white rounded-full">
                {pendingUsersCount}
              </span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {userName && (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{userName}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => router.push("/perfil")}>
                <Settings className="mr-2 h-4 w-4" />
                Mi perfil
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Panel de admin
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
