import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"

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

  if (!user) {
    return NextResponse.json({ success: false, error: "No autorizado." }, { status: 403 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (profileError || !profile?.is_admin) {
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

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_API_KEY

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

  const { data: targetUser, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(
    payload.targetUserId
  )

  if (targetUserError) {
    return NextResponse.json(
      { success: false, error: "No se pudo obtener el usuario a verificar." },
      { status: 400 }
    )
  }

  const targetEmail = targetUser?.user?.email
  if (!targetEmail) {
    return NextResponse.json(
      { success: false, error: "El usuario no tiene un correo válido." },
      { status: 400 }
    )
  }

  const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(payload.targetUserId, {
    email_confirm: true,
  })

  if (confirmError) {
    return NextResponse.json(
      { success: false, error: "No se pudo confirmar el correo del usuario." },
      { status: 500 }
    )
  }

  const { error: resendError } = await supabaseAdmin.auth.resend({
    type: "signup",
    email: targetEmail,
  })

  if (resendError) {
    return NextResponse.json(
      { success: false, error: "No se pudo reenviar el correo de verificación." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: "Correo confirmado y reenviado correctamente.",
    targetUserId: payload.targetUserId,
  })
}
