import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"

const ADMIN_EMAIL = "admin@megia.eu"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Server Route - ignore
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 })
  }

  let payload: { targetUserId?: string } = {}
  try {
    payload = await request.json()
  } catch {
    payload = {}
  }

  if (!payload.targetUserId || typeof payload.targetUserId !== "string") {
    return NextResponse.json({ success: false, error: "targetUserId inválido." }, { status: 400 })
  }

  if (payload.targetUserId === user.id) {
    return NextResponse.json({ success: false, error: "No puedes borrar tu propio usuario." }, { status: 400 })
  }

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_API_KEY

  if (!serviceRoleKey) {
    return NextResponse.json(
      {
        success: false,
        error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY.",
      },
      { status: 500 }
    )
  }

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

  const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(payload.targetUserId)
  if (targetUser?.user?.email === ADMIN_EMAIL) {
    return NextResponse.json(
      { success: false, error: "No se puede borrar el usuario administrador principal." },
      { status: 400 }
    )
  }

  const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
    .from("profiles")
    .select("name")
    .eq("id", payload.targetUserId)
    .maybeSingle()

  if (targetProfileError) {
    return NextResponse.json(
      { success: false, error: "No se pudo obtener el perfil del usuario a borrar." },
      { status: 400 }
    )
  }

  if (targetProfile?.email === ADMIN_EMAIL) {
    return NextResponse.json(
      { success: false, error: "No se puede borrar el usuario administrador principal." },
      { status: 400 }
    )
  }

  const displayName =
    targetProfile?.name?.trim() || targetUser?.user?.email || targetProfile?.email || "Usuario eliminado"

  const { error: temporizeError } = await supabaseAdmin.rpc("temporize_user_matches", {
    target_user_id: payload.targetUserId,
    display_name: displayName,
  })

  if (temporizeError) {
    return NextResponse.json(
      { success: false, error: "No se pudo temporizar las partidas del usuario." },
      { status: 500 }
    )
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(payload.targetUserId)
  if (deleteError && deleteError.status !== 404) {
    return NextResponse.json({ success: false, error: "Error al borrar el usuario." }, { status: 500 })
  }

  const { data: deletedProfiles, error: deleteProfileError } = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("id", payload.targetUserId)
    .select("id, email")

  if (deleteProfileError) {
    return NextResponse.json(
      { success: false, error: "El usuario fue eliminado de Auth pero no de profiles." },
      { status: 500 }
    )
  }

  if (!deletedProfiles || deletedProfiles.length === 0) {
    return NextResponse.json(
      { success: false, error: "No se eliminó ningún registro en profiles." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: "Usuario eliminado correctamente.",
    targetUserId: payload.targetUserId,
  })
}
