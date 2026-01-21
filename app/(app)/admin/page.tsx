import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminTabs } from "@/components/admin/admin-tabs"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/partidas")
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_API_KEY
  const emailVerificationMap: Record<string, boolean> = {}

  if (serviceRoleKey) {
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const perPage = 50
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (authUsersError) {
        hasMore = false
        break
      }

      const usersBatch = Array.isArray(authUsers) ? authUsers : (authUsers as any)?.users ?? []
      
      if (usersBatch.length === 0) {
        hasMore = false
        break
      }

      usersBatch.forEach((authUser: any) => {
        // Normalizar email a minúsculas para comparar
        const email = authUser.email?.toLowerCase()
        const isConfirmed = Boolean(authUser.email_confirmed_at || authUser.confirmed_at)
        
        // Mapear por ID
        if (authUser.id) {
          emailVerificationMap[authUser.id] = isConfirmed
        }
        
        // Mapear también por email como fallback
        if (email) {
          emailVerificationMap[email] = isConfirmed
        }
      })

      if (usersBatch.length < perPage) {
        hasMore = false
      } else {
        page += 1
      }
    }
  }

  // Get pending users
  const { data: pendingUsers } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Get all users for management
  const { data: allUsers } = await supabase.from("profiles").select("*").order("name")

  // Get pending matches
  const { data: pendingMatches } = await supabase
    .from("matches")
    .select(`
      *,
      player1:profiles!matches_player1_id_fkey(id, name),
      player2:profiles!matches_player2_id_fkey(id, name),
      player3:profiles!matches_player3_id_fkey(id, name),
      player4:profiles!matches_player4_id_fkey(id, name),
      temp_player1:season_players!matches_temp_player1_id_fkey(id, name, season_id),
      temp_player2:season_players!matches_temp_player2_id_fkey(id, name, season_id),
      temp_player3:season_players!matches_temp_player3_id_fkey(id, name, season_id),
      temp_player4:season_players!matches_temp_player4_id_fkey(id, name, season_id),
      creator:profiles!matches_created_by_fkey(id, name),
      validations:match_validations(
        id,
        player_id,
        validated,
        validated_at,
        created_at,
        player:profiles(id, name)
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Get active season
  const { data: activeSeason } = await supabase
    .from("seasons")
    .select(`
      *,
      creator:profiles!seasons_created_by_fkey(id, name)
    `)
    .eq("is_active", true)
    .single()

  // Get closed seasons
  const { data: closedSeasons } = await supabase
    .from("seasons")
    .select(`
      *,
      creator:profiles!seasons_created_by_fkey(id, name)
    `)
    .eq("is_active", false)
    .order("end_date", { ascending: false })

  return (
    <div className="p-4">
      <AdminTabs
        pendingUsers={pendingUsers || []}
        allUsers={allUsers || []}
        pendingMatches={pendingMatches || []}
        activeSeason={activeSeason || null}
        closedSeasons={closedSeasons || []}
        emailVerificationMap={emailVerificationMap}
      />
    </div>
  )
}
