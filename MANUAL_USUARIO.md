## Manual de Usuario — MusLog

MusLog es una aplicación web (tipo “app”) para **registrar**, **validar** y **consultar** partidas de Mus entre amigos, con **temporadas** y **estadísticas**. Incluye un **panel de administración** para gestionar usuarios, temporadas y partidas pendientes.

### Contenido
- [1. Introducción](#1-introducción)
- [2. Primeros pasos (registro, acceso y estados de cuenta)](#2-primeros-pasos-registro-acceso-y-estados-de-cuenta)
- [3. Navegación (cabecera, menú de usuario y barra inferior)](#3-navegación-cabecera-menú-de-usuario-y-barra-inferior)
- [4. Registrar una nueva partida](#4-registrar-una-nueva-partida)
- [5. Ver y buscar partidas](#5-ver-y-buscar-partidas)
- [6. Validar partidas](#6-validar-partidas)
- [7. Estadísticas de jugadores](#7-estadísticas-de-jugadores)
- [8. Temporadas (vista de usuario)](#8-temporadas-vista-de-usuario)
- [9. Perfil de usuario](#9-perfil-de-usuario)
- [10. Panel de administración (solo admins)](#10-panel-de-administración-solo-admins)
- [11. Preguntas frecuentes](#11-preguntas-frecuentes)
- [12. Consejos y mejores prácticas](#12-consejos-y-mejores-prácticas)
- [Glosario rápido](#glosario-rápido)

---

## 1. Introducción

### ¿Qué es MusLog?
Una app para llevar un **historial centralizado** de partidas de Mus: quién jugó, resultado, temporada, y validación por los jugadores o por un admin.

### Propósito
- Evitar “resultados perdidos” o discusiones: una partida no cuenta hasta que esté **validada**.
- Consultar histórico por **temporadas**.
- Ver **rankings y estadísticas**.

### Requisitos previos
- Un navegador moderno (móvil o escritorio) y conexión a internet.
- Tener una **cuenta** y que esté **aprobada** por un administrador.
- Para registrar partidas: debe existir una **temporada activa**.

### Roles
- **Usuario**: registra partidas, valida las partidas en las que participa, consulta temporadas y estadísticas.
- **Administrador**: además gestiona solicitudes de usuarios, valida/rechaza partidas pendientes y crea/cierra temporadas.

---

## 2. Primeros pasos (registro, acceso y estados de cuenta)

### 2.1. Crear una cuenta (registro)
Ruta: ` /auth/registro `

1. Completa:
   - **Nombre**
   - **Email**
   - **Contraseña** (mínimo 6 caracteres)
   - **Repetir contraseña**
2. Pulsa **Registrarse**.
3. Tras registrarte, tu cuenta queda en estado **Pendiente** hasta que un administrador la apruebe.
4. Serás redirigido a ` /auth/registro-exitoso `.

### 2.2. Estados de cuenta: aprobado / pendiente / rechazado
Al entrar en la app (zona principal), puede aparecer una pantalla de estado:

- **Pendiente de aprobación**: verás un mensaje indicando que un admin revisará tu cuenta.
  - Qué hacer: **esperar** o contactar con un admin.
- **Rechazada**: verás un mensaje indicando que la solicitud fue rechazada.
  - Qué hacer: contactar con un admin si necesitas más información.
- **Aprobada**: podrás usar todas las secciones normales.

### 2.3. Iniciar sesión
Ruta: ` /auth/login `

1. Introduce **Email** y **Contraseña**.
2. (Opcional) Marca **Recordar sesión**.
   - Esto mantiene tu sesión iniciada durante más tiempo en el dispositivo.
3. Pulsa **Entrar**.
4. Al acceder, la app te lleva a ` /partidas `.

### 2.4. Cerrar sesión
En la cabecera (arriba), abre el menú de usuario y pulsa **Cerrar sesión**.

### 2.5. Recuperación de contraseña
No existe un flujo de “Olvidé mi contraseña” en la interfaz.

Opciones actuales:
- Si aún puedes entrar: cambia la contraseña desde **Mi perfil**.
- Si no puedes entrar: contacta con un administrador (o habilitar un flujo de recuperación en el futuro).

---

## 3. Navegación (cabecera, menú de usuario y barra inferior)

### 3.1. Cabecera (arriba)
La cabecera es fija y suele mostrar:
- **Nombre de la app** (MusLog).
- **Temporada actual** (nombre) o el texto **“Temporada no activada aún”**.

Iconos informativos (pueden aparecer según tu caso):
- **Reloj con contador**: número de partidas **pendientes** en las que participas y **aún no has validado**.
- **Aviso con contador (solo admin)**: número de **solicitudes de usuarios pendientes**.

### 3.2. Menú de usuario
En la cabecera, pulsa el icono de usuario:
- **Mi perfil** → ` /perfil `
- **Panel de admin** (solo si eres admin) → ` /admin `
- **Cerrar sesión**

### 3.3. Barra de navegación inferior
Se muestra en la zona principal:
- **Partidas** → ` /partidas `
- **Nueva** → ` /nueva-partida `
- **Temporada** → ` /temporadas `
- **Admin** (solo admins) → ` /admin `

Nota: Existe una página de **estadísticas de jugadores** en ` /jugadores `, pero puede no estar enlazada desde la barra inferior (según versión/configuración).

---

## 4. Registrar una nueva partida
Ruta: ` /nueva-partida `

### 4.1. Requisitos
- Tu cuenta debe estar **aprobada**.
- Debe existir una **temporada activa**.
  - Si no hay temporada activa, verás un aviso de **“Temporada no activada”** y un botón para ir a ` /temporadas `.

### 4.2. Cómo registrar la partida (paso a paso)
1. **Fecha y hora**:
   - Selecciona la fecha/hora en el campo correspondiente.
2. **Seleccionar jugadores (4)**:
   - Elige **Jugador 1** y **Jugador 2** (Equipo 1).
   - Elige **Jugador 3** y **Jugador 4** (Equipo 2).
   - Solo aparecen jugadores con estado **aprobado**.
   - No se permite repetir el mismo jugador.
3. **Resultado**:
   - Introduce puntuación de **Equipo 1** y **Equipo 2** (valores numéricos; la UI limita el rango).
4. **Equipo ganador**:
   - Marca **Equipo 1** o **Equipo 2**.
5. Pulsa **Registrar partida**.

### 4.3. Qué pasa después de registrar
- La partida se crea con estado **Pendiente**.
- Queda **pendiente de validación** por los jugadores (y/o un admin).
- El sistema crea una validación para cada uno de los 4 jugadores.
  - Si el creador también es uno de los jugadores, su validación puede marcarse automáticamente.

---

## 5. Ver y buscar partidas
Ruta: ` /partidas `

### 5.1. Lista de partidas
Verás un listado de partidas (más recientes arriba). En cada tarjeta suele aparecer:
- Equipos y jugadores.
- Marcador.
- Fecha y hora.
- Creador de la partida.
- Temporada.
- Estado (pendiente/validada) y detalle de validaciones.

### 5.2. Búsqueda rápida
En el campo de búsqueda puedes encontrar partidas por:
- Nombres de jugadores.
- Creador.
- Fecha (texto del día/mes).
- Marcadores (ej.: “3 - 0”).

### 5.3. Filtros
Puedes filtrar por:
- **Estado**:
  - **Todas**
  - **Pendientes**
  - **Validadas**
- **Temporada**:
  - Todas
  - Temporada actual
  - Una temporada cerrada específica
- **Jugador**:
  - Muestra solo partidas donde participa el jugador elegido
- **Rango de fechas**:
  - Desde / Hasta

También puedes **Limpiar** filtros para volver a ver todo.

### 5.4. Agrupación por fecha
Las partidas se agrupan por día con un encabezado (sticky) para que sea fácil navegar cuando hay muchas.

---

## 6. Validar partidas
La validación sirve para que el resultado “cuente” de forma fiable. Una partida suele pasar de **Pendiente** a **Validada** cuando:
- los **4 jugadores** han validado, o
- un **admin** la valida directamente.

### 6.1. Validar como jugador participante
Si eres uno de los 4 jugadores:
1. En la tarjeta de la partida (en ` /partidas `), pulsa **Validar**.
2. La app marca tu validación como **validada**.

Notas:
- No podrás validar si **no participaste** en esa partida.
- En la UI normalmente la validación es unidireccional (no hay “desvalidar”).

### 6.2. Validación automática
Cuando las 4 validaciones de jugadores están en **true**, el sistema marca automáticamente la partida como **Validada**.

### 6.3. Validación por administrador
Un admin puede:
- Validar una partida directamente (aunque falten validaciones de jugadores).
- (Desde el panel admin) también **rechazar** una partida si es incorrecta.

### 6.4. Estado de validaciones (quién validó y quién falta)
En la tarjeta de la partida podrás ver:
- **Validado por**: lista de jugadores que ya validaron.
- **Pendiente**: lista de jugadores que faltan por validar.

---

## 7. Estadísticas de jugadores
Ruta: ` /jugadores `

### 7.1. Qué muestra
Una tabla/ranking con estadísticas por jugador (normalmente usando partidas **validadas**):
- Partidas totales.
- Victorias / derrotas.
- Porcentaje de victorias.
- Ranking (con iconos para los primeros puestos).

### 7.2. Filtrar por temporada
Puedes escoger:
- **Todas las temporadas**
- **Temporada actual**
- Una temporada concreta

### 7.3. Criterio de ordenación del ranking
El ranking prioriza:
- Jugadores con **3 o más partidas** (para evitar rankings “inflados” con pocas partidas).
- Mayor **win rate**.
- En caso de empate, mayor número de victorias.

---

## 8. Temporadas (vista de usuario)
Ruta: ` /temporadas `

### 8.1. Selector de temporada
Podrás elegir:
- Temporada **activa** (si existe)
- Temporadas **cerradas**

### 8.2. Qué incluye cada temporada
Según la temporada seleccionada, verás un resumen con:
- Total de partidas validadas de esa temporada.
- Ranking de jugadores de la temporada.
- Listados/estadísticas asociados.

Notas:
- Para **crear/cerrar** temporadas necesitas ser admin (ver sección 10).
- Si no existe temporada activa, **no se pueden registrar partidas nuevas**.

---

## 9. Perfil de usuario
Ruta: ` /perfil `

### 9.1. Información personal
Muestra:
- **Nombre**
- **Email**
- **Rol**: Usuario o Administrador

### 9.2. Cambiar contraseña
1. En “Cambiar contraseña”, introduce:
   - **Nueva contraseña** (mínimo 6 caracteres)
   - **Confirmar contraseña**
2. Pulsa **Actualizar contraseña**.
3. Verás un mensaje de éxito o error.

---

## 10. Panel de administración (solo admins)
Ruta: ` /admin `

El panel tiene pestañas principales:

### 10.1. Solicitudes (usuarios pendientes)
- Lista usuarios con estado **pendiente**.
- Acciones:
  - **Aprobar** → el usuario pasa a “aprobado” y puede usar la app.
  - **Rechazar** → el usuario pasa a “rechazado”.

### 10.2. Usuarios (gestión general)
- Lista todos los usuarios con:
  - Nombre, email
  - Estado: pendiente / aprobado / rechazado
  - Indicador de “Admin” si corresponde
- Acción principal: **hacer admin / quitar admin**.

Regla importante:
- Un admin **no puede quitarse su propio rol de admin** desde la interfaz.

### 10.3. Partidas (pendientes)
- Lista partidas con estado **pendiente**.
- Muestra equipos, marcador, creador y estado de validaciones (quién validó / quién falta).
- Acciones:
  - **Validar** (marca la partida como validada)
  - **Rechazar** (marca la partida como rechazada)

### 10.4. Temporadas (gestión)
- Ver temporada activa (si existe) con fecha de inicio y creador.
- Acciones:
  - **Cerrar temporada** (pasa a cerrada y fija fecha fin).
  - **Crear nueva temporada**:
    - Si hay una activa, al crear una nueva la temporada actual se **cierra automáticamente**.
    - Si es la **primera temporada** del sistema, la app puede intentar asignar partidas previas a esa primera temporada automáticamente.
- Ver historial de temporadas cerradas.

---

## 11. Preguntas frecuentes

### ¿Por qué no puedo registrar una partida?
Causas típicas:
- No hay **temporada activa**.
- Tu cuenta está **pendiente** o **rechazada**.

Solución:
- Revisa ` /temporadas ` (si no hay temporada activa) o contacta con un admin.

### ¿Cómo funciona la validación?
- Cada partida requiere validación de sus 4 jugadores.
- Cuando validan los 4, la partida pasa automáticamente a **validada**.
- Un admin puede validarla manualmente aunque falten validaciones.

### ¿Qué pasa si un jugador no valida?
- La partida quedará **pendiente** hasta que el jugador valide o un admin la valide.

### ¿Cómo se calculan las estadísticas?
- Se calculan agregando partidas (normalmente **validadas**):
  - win rate = victorias / partidas.
- El ranking prioriza jugadores con **≥ 3 partidas**.

### ¿Puedo editar una partida después de registrarla?
No hay edición directa en la interfaz. Si hubo un error:
- Contacta con un admin para que la gestione (validación/rechazo y corrección a nivel de administración).

---

## 12. Consejos y mejores prácticas
- Registra la partida justo al terminar para evitar olvidos.
- Valida tus partidas cuanto antes para que cuenten en rankings y temporadas.
- Si eres admin, revisa a menudo:
  - Solicitudes pendientes
  - Partidas pendientes
- Usa filtros por temporada y jugador para encontrar partidas rápidamente.

---

## Glosario rápido
- **Partida pendiente**: registrada pero aún no validada por los jugadores (o no validada por admin).
- **Partida validada**: aprobada por los 4 jugadores o por un admin.
- **Partida rechazada**: marcada como incorrecta/invalidada (solo admin).
- **Temporada activa**: periodo actual en el que se registran y agrupan partidas.
- **Temporada cerrada**: periodo finalizado, visible para histórico y estadísticas.
