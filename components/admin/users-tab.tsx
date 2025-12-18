"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AllUsersTab } from "./all-users-tab"
import { SeasonPlayersTab } from "./season-players-tab"
import type { Profile, Season } from "@/lib/types"
import { Users, UserPlus } from "lucide-react"

interface UsersTabProps {
  allUsers: Profile[]
  activeSeason: Season | null
}

export function UsersTab({ allUsers, activeSeason }: UsersTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("registered")

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="registered" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Registrados
        </TabsTrigger>
        <TabsTrigger value="temporary" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Temporales
        </TabsTrigger>
      </TabsList>

      <TabsContent value="registered">
        <AllUsersTab users={allUsers} />
      </TabsContent>

      <TabsContent value="temporary">
        <SeasonPlayersTab activeSeason={activeSeason} />
      </TabsContent>
    </Tabs>
  )
}
