"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PlusCircle, Calendar, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  isAdmin?: boolean
}

export function BottomNav({ isAdmin = false }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/partidas", label: "Partidas", icon: Home },
    { href: "/nueva-partida", label: "Nueva", icon: PlusCircle },
    { href: "/temporadas", label: "Temporada", icon: Calendar },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 shadow-lg">
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-all duration-200 rounded-lg",
                isActive 
                  ? "text-primary font-semibold bg-accent/50" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "fill-emerald-100")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
