"use client"

import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PendingUsersTab } from "./pending-users-tab"
import { UsersTab } from "./users-tab"
import { PendingMatchesTab } from "./pending-matches-tab"
import { SeasonsTab } from "./seasons-tab"
import type { Profile, Match, Season } from "@/lib/types"
import { Users, UserCheck, Trophy, Calendar, ChevronRight } from "lucide-react"

interface AdminTabsProps {
  pendingUsers: Profile[]
  allUsers: Profile[]
  pendingMatches: Match[]
  activeSeason: Season | null
  closedSeasons: Season[]
  emailVerificationMap: Record<string, boolean>
}

export function AdminTabs({
  pendingUsers,
  allUsers,
  pendingMatches,
  activeSeason,
  closedSeasons,
  emailVerificationMap,
}: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState("pending-users")
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = scrollContainerRef.current
        const hasMoreContent = scrollWidth > clientWidth
        const isNotAtEnd = scrollLeft < scrollWidth - clientWidth - 10
        setShowScrollIndicator(hasMoreContent && isNotAtEnd)
      }
    }

    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
      return () => {
        container.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide md:overflow-x-visible"
        >
          <TabsList className="inline-flex w-auto md:grid md:w-full md:grid-cols-4 [&>*]:!flex-shrink-0">
          <TabsTrigger value="pending-users" className="!flex-shrink-0 text-[11px] sm:text-xs flex-col items-center justify-center gap-1 sm:flex-row sm:gap-1.5 px-3 sm:px-3 min-w-[100px] sm:min-w-0 md:min-w-0">
            <UserCheck className="h-4 w-4 shrink-0" />
            <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-1">
              <span className="hidden min-[420px]:inline sm:hidden text-center whitespace-nowrap">Sol.</span>
              <span className="hidden sm:inline whitespace-nowrap">Solicitudes</span>
              <span className="text-[10px] sm:text-[11px] whitespace-nowrap">({pendingUsers.length})</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="all-users" className="!flex-shrink-0 text-[11px] sm:text-xs flex-col items-center justify-center gap-1 sm:flex-row sm:gap-1.5 px-3 sm:px-3 min-w-[95px] sm:min-w-0 md:min-w-0">
            <Users className="h-4 w-4 shrink-0" />
            <span className="text-center whitespace-nowrap">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="pending-matches" className="!flex-shrink-0 text-[11px] sm:text-xs flex-col items-center justify-center gap-1 sm:flex-row sm:gap-1.5 px-3 sm:px-3 min-w-[100px] sm:min-w-0 md:min-w-0">
            <Trophy className="h-4 w-4 shrink-0" />
            <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-1">
              <span className="hidden min-[420px]:inline sm:hidden text-center whitespace-nowrap">Part.</span>
              <span className="hidden sm:inline whitespace-nowrap">Partidas</span>
              <span className="text-[10px] sm:text-[11px] whitespace-nowrap">({pendingMatches.length})</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="seasons" className="!flex-shrink-0 text-[11px] sm:text-xs flex-col items-center justify-center gap-1 sm:flex-row sm:gap-1.5 px-3 sm:px-3 min-w-[100px] sm:min-w-0 md:min-w-0">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="text-center whitespace-nowrap">Temporadas</span>
          </TabsTrigger>
        </TabsList>
        </div>
        {showScrollIndicator && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none flex items-center justify-end pr-2 md:hidden">
            <ChevronRight className="h-5 w-5 text-muted-foreground animate-pulse" />
          </div>
        )}
      </div>

      <TabsContent value="pending-users">
        <PendingUsersTab users={pendingUsers} />
      </TabsContent>

      <TabsContent value="all-users">
        <UsersTab allUsers={allUsers} activeSeason={activeSeason} emailVerificationMap={emailVerificationMap} />
      </TabsContent>

      <TabsContent value="pending-matches">
        <PendingMatchesTab matches={pendingMatches} />
      </TabsContent>

      <TabsContent value="seasons">
        <SeasonsTab activeSeason={activeSeason} closedSeasons={closedSeasons} />
      </TabsContent>
    </Tabs>
  )
}
