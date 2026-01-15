import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  if (user.email !== "admin@megia.eu") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const body = await request.json()
  const targetUserId = body?.userId as string | undefined
  const displayName = body?.displayName as string | undefined

  if (!targetUserId || !displayName) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: "No puedes borrarte a ti mismo" }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from("profiles")
    .select("email")
    .eq("id", targetUserId)
    .single()

  if (targetProfileError) {
    return NextResponse.json({ error: "No se encontró el usuario" }, { status: 404 })
  }

  if (targetProfile.email === "admin@megia.eu") {
    return NextResponse.json({ error: "No puedes borrar al super administrador" }, { status: 400 })
  }

  const { error: migrateError } = await adminClient.rpc("migrate_user_to_temp", {
    target_user_id: targetUserId,
    display_name: displayName,
  })

  if (migrateError) {
    return NextResponse.json({ error: "Error migrando historial" }, { status: 500 })
  }

  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({
      status: "rejected",
      can_login: false,
      is_active_player: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId)

  if (profileUpdateError) {
    return NextResponse.json({ error: "Error actualizando perfil" }, { status: 500 })
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId)

  if (deleteError) {
    return NextResponse.json({ error: "Error borrando usuario" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
