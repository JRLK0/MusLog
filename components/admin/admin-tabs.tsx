"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PendingUsersTab } from "./pending-users-tab"
import { AllUsersTab } from "./all-users-tab"
import { PendingMatchesTab } from "./pending-matches-tab"
import type { Profile, Match } from "@/lib/types"
import { Users, UserCheck, Trophy } from "lucide-react"

interface AdminTabsProps {
  pendingUsers: Profile[]
  allUsers: Profile[]
  pendingMatches: Match[]
}

export function AdminTabs({ pendingUsers, allUsers, pendingMatches }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState("pending-users")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending-users" className="text-xs">
          <UserCheck className="h-4 w-4 mr-1" />
          Solicitudes ({pendingUsers.length})
        </TabsTrigger>
        <TabsTrigger value="all-users" className="text-xs">
          <Users className="h-4 w-4 mr-1" />
          Usuarios
        </TabsTrigger>
        <TabsTrigger value="pending-matches" className="text-xs">
          <Trophy className="h-4 w-4 mr-1" />
          Partidas ({pendingMatches.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending-users">
        <PendingUsersTab users={pendingUsers} />
      </TabsContent>

      <TabsContent value="all-users">
        <AllUsersTab users={allUsers} />
      </TabsContent>

      <TabsContent value="pending-matches">
        <PendingMatchesTab matches={pendingMatches} />
      </TabsContent>
    </Tabs>
  )
}
