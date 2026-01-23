import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Endpoint público de health check para keep-alive de Supabase.
 * Usado por GitHub Actions para evitar que el proyecto se pause por inactividad.
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          status: "error", 
          message: "Supabase no configurado",
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Cliente simple sin cookies (no necesitamos auth para este ping)
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Query mínima para mantener actividad
    const { error } = await supabase.rpc("ping", {}).maybeSingle()
    
    // Si la función RPC no existe, hacemos una query simple
    if (error?.code === "PGRST202") {
      // Fallback: query a una tabla pública (profiles existe en este proyecto)
      const { error: fallbackError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)

      if (fallbackError) {
        return NextResponse.json(
          { 
            status: "error", 
            message: "Error conectando a Supabase",
            error: fallbackError.message,
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        )
      }
    } else if (error) {
      return NextResponse.json(
        { 
          status: "error", 
          message: "Error en query",
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    const latency = Date.now() - startTime

    return NextResponse.json({
      status: "ok",
      message: "Supabase activo",
      latency_ms: latency,
      timestamp: new Date().toISOString()
    })
    
  } catch (err) {
    return NextResponse.json(
      { 
        status: "error", 
        message: err instanceof Error ? err.message : "Error desconocido",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// También permitir HEAD para pings más ligeros
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
