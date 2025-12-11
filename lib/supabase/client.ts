import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const rememberSession = typeof window !== "undefined" && localStorage.getItem("rememberSession") === "true"
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split(";").map((cookie) => {
            const [name, ...rest] = cookie.trim().split("=")
            return { name, value: rest.join("=") }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${value}`
            
            // Si se selecciona "recordar sesión", establecer maxAge de 30 días
            if (rememberSession && (name.includes("sb-") || name.includes("auth"))) {
              const maxAge = 30 * 24 * 60 * 60 // 30 días en segundos
              cookieString += `; max-age=${maxAge}; path=/`
            } else if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}; path=/`
            } else if (options?.expires) {
              cookieString += `; expires=${options.expires.toUTCString()}; path=/`
            } else {
              // Por defecto, cookies de sesión (se eliminan al cerrar el navegador)
              cookieString += `; path=/`
            }
            
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`
            }
            
            if (options?.sameSite) {
              cookieString += `; sameSite=${options.sameSite}`
            } else {
              cookieString += `; sameSite=Lax`
            }
            
            if (options?.secure || window.location.protocol === "https:") {
              cookieString += `; secure`
            }
            
            document.cookie = cookieString
          })
        },
      },
    }
  )
}

/**
 * Actualiza las cookies de autenticación para que tengan una expiración más larga
 * Se debe llamar después de un login exitoso cuando el usuario selecciona "recordar sesión"
 */
export function updateCookiesForRememberSession() {
  if (typeof window === "undefined") return
  
  const rememberSession = localStorage.getItem("rememberSession") === "true"
  if (!rememberSession) return

  // Buscar todas las cookies de Supabase relacionadas con autenticación
  const cookies = document.cookie.split(";")
  const maxAge = 30 * 24 * 60 * 60 // 30 días en segundos
  const expirationDate = new Date()
  expirationDate.setTime(expirationDate.getTime() + maxAge * 1000)

  cookies.forEach((cookie) => {
    const trimmedCookie = cookie.trim()
    if (!trimmedCookie) return
    
    const [name, ...rest] = trimmedCookie.split("=")
    const value = rest.join("=")
    
    // Actualizar todas las cookies de Supabase (empiezan con "sb-")
    // Esto incluye cookies como sb-<project-ref>-auth-token, etc.
    if (name && name.startsWith("sb-")) {
      const secureFlag = window.location.protocol === "https:" ? "; secure" : ""
      document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax${secureFlag}`
    }
  })
}
