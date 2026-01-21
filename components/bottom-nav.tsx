"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, PlusCircle, Calendar, Shield, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  isAdmin?: boolean
}

export function BottomNav({ isAdmin = false }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingPath, setPendingPath] = useState<string | null>(null)

  const navItems = [
    { href: "/partidas", label: "Partidas", icon: Home },
    { href: "/nueva-partida", label: "Nueva", icon: PlusCircle },
    { href: "/temporadas", label: "Temporada", icon: Calendar },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ]

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Si ya estamos en esa página, no hacer nada especial
    if (pathname === href) return

    e.preventDefault()
    setPendingPath(href)
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 shadow-lg">
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const isLoading = isPending && pendingPath === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavigation(e, item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-all duration-200 rounded-lg relative overflow-hidden",
                isActive 
                  ? "text-primary font-semibold bg-accent/50" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
                isLoading && "opacity-70 animate-pulse"
              )}
            >
              <div className="relative">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <item.icon className={cn("h-5 w-5", isActive && "fill-emerald-100")} />
                )}
              </div>
              <span className="font-medium whitespace-nowrap">{item.label}</span>
              {isLoading && (
                <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
