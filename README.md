# MusLog 🎴

Aplicación web para registrar, validar y gestionar partidas de Mus entre amigos. Incluye sistema de temporadas, estadísticas de jugadores y panel de administración.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/jrlk0s-projects/v0-mus-game-tracker)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/pM99Ndrzlzp)

## 📋 Descripción

MusLog es una aplicación web progresiva (PWA) diseñada para grupos de amigos que juegan Mus regularmente. Permite llevar un registro centralizado de todas las partidas, con validación por parte de los jugadores, organización por temporadas y estadísticas detalladas de rendimiento.

## ✨ Características principales

- **Registro de partidas**: Registra partidas con 4 jugadores, equipos, resultados y fecha/hora
- **Sistema de validación**: Cada partida requiere validación de los 4 jugadores participantes o de un administrador
- **Temporadas**: Organiza las partidas en temporadas activas y cerradas
- **Estadísticas de jugadores**: Ranking, porcentaje de victorias, partidas totales y tendencias
- **Panel de administración**: Gestión de usuarios, aprobación de solicitudes y validación de partidas
- **Búsqueda y filtros**: Filtra partidas por estado, temporada, jugador y rango de fechas
- **PWA**: Instalable en dispositivos móviles y escritorio
- **Tema oscuro/claro**: Soporte para modo claro y oscuro

## 🛠️ Tecnologías

- **Framework**: [Next.js 16](https://nextjs.org/) con React 19
- **Base de datos**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Autenticación**: Supabase Auth
- **UI**: Tailwind CSS + Radix UI
- **Iconos**: Lucide React
- **Gráficos**: Recharts
- **PWA**: next-pwa
- **Despliegue**: Vercel

## 🚀 Inicio rápido

### Prerrequisitos

- Node.js 18+ y npm/pnpm
- Cuenta de Supabase (para base de datos y autenticación)

### Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd v0-mus-game-tracker
```

2. Instala las dependencias:
```bash
npm install
# o
pnpm install
```

3. Configura las variables de entorno:
Crea un archivo `.env.local` con:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
# Alternativa si no usas SUPABASE_SERVICE_ROLE_KEY:
SUPABASE_SECRET_KEY=tu_supabase_secret_key
DATABASE_URL=tu_connection_string_postgres
# Opcional: desactiva migraciones automáticas (por ejemplo en un build donde no quieras tocar la BBDD)
# SKIP_DB_MIGRATIONS=true
```

4. Ejecuta las migraciones SQL:
Aplica los scripts SQL en la carpeta `scripts/` en orden numérico a tu base de datos Supabase.

5. Inicia el servidor de desarrollo:
```bash
npm run dev
# o
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del proyecto

```
v0-mus-game-tracker/
├── app/                    # Rutas de Next.js App Router
│   ├── (app)/             # Rutas protegidas de la aplicación
│   │   ├── admin/         # Panel de administración
│   │   ├── jugadores/     # Estadísticas de jugadores
│   │   ├── nueva-partida/ # Formulario de nueva partida
│   │   ├── partidas/      # Lista de partidas
│   │   ├── perfil/        # Perfil de usuario
│   │   └── temporadas/    # Gestión de temporadas
│   └── auth/              # Rutas de autenticación
├── components/            # Componentes React
│   ├── admin/            # Componentes del panel admin
│   └── ui/                # Componentes UI reutilizables
├── lib/                   # Utilidades y helpers
│   └── supabase/         # Clientes de Supabase
├── scripts/               # Scripts SQL de migración
└── public/                # Archivos estáticos
```

## 📖 Documentación

### Manual de usuario

Consulta el **[Manual de Usuario completo](MANUAL_USUARIO.md)** para:
- Guía paso a paso de todas las funcionalidades
- Instrucciones de registro e inicio de sesión
- Cómo registrar y validar partidas
- Uso del panel de administración
- Preguntas frecuentes

## 🎮 Uso de la aplicación

### Para usuarios

1. **Registro**: Crea una cuenta y espera la aprobación de un administrador
2. **Registrar partida**: Ve a "Nueva" y completa el formulario con los 4 jugadores y resultado
3. **Validar partidas**: Valida las partidas en las que participaste desde la lista de partidas
4. **Ver estadísticas**: Consulta tu ranking y estadísticas en "Jugadores"
5. **Temporadas**: Revisa el historial de temporadas y estadísticas por temporada

### Para administradores

1. **Aprobar usuarios**: Gestiona solicitudes de registro en el panel de admin
2. **Validar partidas**: Valida o rechaza partidas pendientes
3. **Gestionar temporadas**: Crea nuevas temporadas y cierra las actuales
4. **Gestionar usuarios**: Asigna permisos de administrador a otros usuarios

## 🔐 Roles y permisos

- **Usuario**: Puede registrar partidas, validar sus propias partidas y consultar estadísticas
- **Administrador**: Tiene acceso completo al panel de administración para gestionar usuarios, partidas y temporadas

## 🗄️ Base de datos

La aplicación utiliza las siguientes tablas principales:

- `profiles`: Perfiles de usuario con estado (pending/approved/rejected)
- `matches`: Partidas registradas con estado (pending/validated/rejected)
- `match_validations`: Validaciones individuales de cada jugador por partida
- `seasons`: Temporadas activas y cerradas

Los scripts SQL de migración se encuentran en la carpeta `scripts/` y deben ejecutarse en orden numérico.

## 🚢 Despliegue

### Vercel (recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Vercel detectará automáticamente Next.js y desplegará la aplicación

### Variables de entorno requeridas

- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase (ej: `https://<project-ref>.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave pública del cliente (en Supabase puede aparecer como **anon key** o como **publishable key**)
- `SUPABASE_SERVICE_ROLE_KEY`: Clave **service role** necesaria para borrar usuarios desde el panel de administración (o usa `SUPABASE_SECRET_KEY` si no dispones de ella)
- `SUPABASE_SECRET_KEY`: Alternativa a `SUPABASE_SERVICE_ROLE_KEY` para habilitar el borrado de usuarios
- `DATABASE_URL`: Connection string a Postgres (requerida para aplicar automáticamente los SQL de `scripts/` al hacer `npm run dev/build/start`)

### Migraciones automáticas (scripts/)

Este proyecto aplica automáticamente los `.sql` de `scripts/` cuando ejecutas:
- `npm run dev`
- `npm run build`
- `npm start`

Guarda cuáles ya se aplicaron en `public.schema_migrations` y solo ejecuta las pendientes.

Variables relacionadas:
- `DATABASE_URL`: **obligatoria** para que se apliquen
- `SKIP_DB_MIGRATIONS=true`: desactiva la aplicación automática

## 📝 Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar ESLint
npm run dev:pwa      # Desarrollo con PWA habilitado
```

## 🤝 Contribuciones

Este proyecto está sincronizado automáticamente con [v0.app](https://v0.app). Para contribuir:

1. Realiza cambios en el proyecto
2. Los cambios se sincronizarán automáticamente con este repositorio
3. Vercel desplegará la última versión automáticamente

## 📄 Licencia

Este proyecto es privado y está destinado para uso personal/grupo de amigos.

## 🔗 Enlaces

- **Aplicación en vivo**: [Vercel Deployment](https://vercel.com/jrlk0s-projects/v0-mus-game-tracker)
- **Desarrollo en v0**: [v0.app Chat](https://v0.app/chat/pM99Ndrzlzp)
- **Manual de Usuario**: [MANUAL_USUARIO.md](MANUAL_USUARIO.md)

---

Desarrollado con ❤️ para grupos de amigos que disfrutan del Mus
