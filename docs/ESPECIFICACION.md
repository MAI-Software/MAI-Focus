# MAI-Focus — Organizador de contenido para redes (TDAH-first)

> Estado: F0 en marcha (esqueleto navegable). Web primero (PC + móvil), APK nativa después vía Capacitor.

## 1. Qué es

Planificador de producción de contenido para creadores, con tres horizontes (semana / mes / año) y ejecución intradía en bloques de 5 minutos. Optimizado para cerebros TDAH: baja carga de memoria de trabajo, tiempo hecho visible, recompensa inmediata, cero castigo.

No es un Trello ni un Google Calendar. Diferencia: el eje no es "reunión", es **el pipeline de un vídeo/post** (idea → guion → grabar → editar → miniatura → publicar → interactuar) y la **energía disponible** del creador.

## 2. Investigación TDAH → decisiones de producto

| Problema TDAH | Manifestación en apps normales | Decisión de diseño aquí |
|---|---|---|
| Ceguera temporal (time blindness) | "1h" es abstracto | Bloques dibujados a escala real + barra de tiempo restante + reloj de progreso en el bloque activo |
| Memoria de trabajo corta | Menús anidados, info oculta | Todo visible en pantalla; máx. 2 niveles; nada crítico detrás de un menú |
| Iniciación (task initiation) | "Empezar" cuesta más que hacer | Botón **Empezar 5 min** en cada bloque; micro-arranque sin compromiso |
| Parálisis por decisión | Lienzo en blanco | Plantillas de bloque preconfiguradas (Grabar, Editar, Guion, Publicar, Responder DMs) + banco de ideas |
| Hiperfoco | Se come el día entero | Aviso suave al superar el bloque; **bloques de pausa obligatorios** entre bloques largos |
| Dopamina baja / refuerzo tardío | Recompensa solo al terminar el proyecto | Feedback inmediato: sonido + animación + micro-XP al completar CADA bloque |
| Vergüenza / evitación | Muros rojos de "atrasado" | Sin rojo punitivo. Tarea no hecha = **ámbar** + 1 toque "Mover a mañana". Rachas con "vidas" que no se rompen del todo |
| Habituación al estímulo | La app se vuelve invisible | Rotación de temas/sonidos desbloqueables; variación de la animación de recompensa |
| Sobreestimulación (el otro extremo) | App que grita | Todo el sistema sensorial es **regulable**: modo Calma (sin sonido, animación mínima, paleta desaturada) |
| Transición entre tareas | Cambio de contexto brusco | Rituales de 60 s: cuenta atrás de cierre + ritual de desconexión al final del día |

**Regla transversal:** ninguna función puede exigir más de **3 toques** desde la pantalla de inicio.

## 3. Estructura de la app (móvil vertical)

Nav inferior, 4 destinos máx (regla `bottom-nav-limit`):

1. **Hoy** (por defecto) — timeline vertical del día, bloques de 5 min, bloque activo destacado arriba (sticky "AHORA / SIGUE").
2. **Semana** — 7 días, scroll horizontal por día + scroll vertical por horas; arrastrar bloques entre días.
3. **Mapa** — mes (rejilla + objetivos del mes) y año (12 celdas con tema/campaña). Toggle segmentado mes/año.
4. **Ideas** — banco de ideas, plantillas, ajustes, perfil.

Modal **Foco** a pantalla completa (no es destino de nav): temporizador del bloque activo, solo lo esencial.

### Jerarquía temporal
- **Año** → objetivos generales (ej. "10k seguidores IG", "lanzar curso"), 1–5 por año, cada uno con color.
- **Mes** → campañas/temas + metas contables (ej. "12 reels", "4 colaboraciones"). Enlazadas a un objetivo anual.
- **Semana** → reparto de bloques de trabajo, días de tanda (batch), ventanas de publicación.
- **Día** → bloques de 5 min mínimo, arrastrables, con anotaciones.

Sube y baja: cada bloque hereda el color del objetivo anual → el año es visible en el minuto. Ese hilo de color es la función principal de la paleta.

## 4. Funcionalidad núcleo

### 4.1 Bloques (etiquetas)
- Duración: **tramo configurable por el usuario** (5 / 10 / 15 / 30 min). 5 min es el mínimo del sistema y el valor por defecto del snap; el bloque nuevo dura 15 min salvo que la plantilla diga otra cosa. Rango 5 min – 8 h.
- El tramo se cambia en Ajustes y también con un gesto de pellizco sobre la rejilla (zoom temporal): más zoom = tramos más finos.
- **Plantillas personalizables**: el usuario crea las suyas (nombre, icono, color, duración por defecto, checklist, energía) y aparecen como botones de 1 toque al añadir bloque. Las 5 de fábrica (Guion, Grabar, Editar, Miniatura, Publicar) son editables y borrables.
- Campos: título, tipo (fase del pipeline), plataforma(s), color heredado/manual, energía requerida (baja/media/alta), anotaciones (texto libre + checklist), enlaces, estado.
- Estados: `pendiente` → `en curso` → `hecho` | `movido` | `saltado` (nunca "fallado").
- Interacciones: arrastrar para mover (umbral 8 px, `drag-threshold`), estirar bordes para redimensionar, pulsación larga = menú, deslizar derecha = hecho, deslizar izquierda = mover a mañana.
- Recurrencia: diaria / semanal / serie ("Reel los martes").

### 4.2 Eventos
Distinto de bloque de trabajo: hora fija, no arrastrable sin confirmación (directo, colaboración, entrevista, fecha de lanzamiento). Se dibujan con borde sólido; los bloques de trabajo con relleno.

### 4.3 Pausas y desconexión
- **Pausa**: bloque especial insertable en 1 toque (5/10/15 min). Auto-sugerida tras 90 min encadenados.
- **Modo desconexión**: hora de cierre configurable → ritual de 3 pasos (revisar lo hecho → mover lo no hecho → cerrar). Después, pantalla "día cerrado" y silencio de notificaciones.
- **Tope diario**: aviso al superar X horas planificadas (previene el plan imposible que genera culpa).
- **Detox de publicación**: franjas "sin redes" que bloquean la sugerencia de tareas de interacción.

### 4.4 Recompensa
- Al completar bloque: sonido corto (<300 ms), animación de sello/pop (150–300 ms), +XP proporcional a los minutos.
- Racha diaria con 2 "vidas" por semana (no se pierde por un día malo).
- Hitos: al completar una campaña mensual → animación grande + desbloqueo cosmético (tema / paleta / pack de sonido).

## 5. Sistema de diseño

Consultado con `ui-ux-pro-max` (estilo **Micro-interactions**, tipografía **Inter**, base oscura energética).

### Paleta (dark por defecto, light disponible)
```css
--bg:          #0F172A;  /* fondo */
--surface:     #192134;  /* tarjeta/bloque base */
--surface-2:   #10192E;  /* muted */
--fg:          #FFFFFF;
--fg-muted:    #94A3B8;
--border:      rgba(255,255,255,.08);
--primary:     #EA580C;  /* naranja acción — "empezar" */
--on-primary:  #FFFFFF;
--success:     #059669;  /* hecho */
--focus-ring:  #F97316;
--warn:        #F59E0B;  /* no hecho, SIN rojo */
--destructive: #DC2626;  /* solo borrar de verdad */
```

Colores de categoría (objetivos anuales / tipo de contenido) — 6 fijos, alto croma sobre oscuro, verificar con simulador de daltonismo:

`#F43F5E` rosa · `#F97316` naranja · `#EAB308` amarillo · `#22C55E` verde · `#38BDF8` cian · `#A78BFA` violeta.

Regla: el color **nunca** es el único portador de significado — siempre acompaña icono o texto (`color-not-only`).

### Tipografía
- Inter (300/400/500/600/700), `display=swap`.
- Escala: 12 / 14 / 16 / 18 / 24 / 32. Cuerpo 16 px mínimo. Cifras **tabulares** en horas y contadores (`font-variant-numeric: tabular-nums`).

### Movimiento
- 150–300 ms, solo `transform` / `opacity`. Entrada ease-out, salida ~60 % de la duración.
- Muelle suave al soltar un bloque arrastrado. Escala 0.97 al pulsar.
- `prefers-reduced-motion` → todo a fade de 100 ms. El modo Calma lo fuerza.

### Sonido
- Web Audio API, samples cortos propios (<50 KB en total), desbloqueo tras el primer gesto del usuario.
- Set base: `tap` (colocar bloque), `snap` (encaje en la rejilla), `done` (completar, acorde ascendente), `milestone` (hito), `breath` (inicio de pausa, tono largo suave).
- Nunca sonido en errores ni en pérdidas. Volumen global + mute persistentes.
- En APK: Haptics de Capacitor emparejado con cada sonido (`impact light` en snap, `notification success` en done).

### Accesibilidad (mínimos innegociables)
Objetivo táctil ≥44 px · contraste de texto 4.5:1 · alternativa con botones a **toda** acción de arrastre · safe-areas respetadas · foco visible.

## 6. Arquitectura técnica

**Stack:** Vite + TypeScript + **Svelte 5** + Capacitor. Decidido.

- **Datos:** offline-first. IndexedDB (Dexie) como fuente de verdad local. La app funciona 100 % sin red.
- **Auth + sync:** Supabase (email/contraseña + magic link + Google). Sync bidireccional por `updated_at`, resolución "última escritura gana" a nivel de bloque. Cuenta opcional: se puede usar sin registrarse y migrar los datos locales al registrarse.
- **Notificaciones:** Capacitor Local Notifications (recordatorio de bloque, fin de pausa, ritual de cierre). En web, Notification API con degradación.
- **Rutas por vista** para deep-linking: `/hoy`, `/semana`, `/mes`, `/ano`, `/foco/:id`.
- **Despliegue web:** Cloudflare Pages conectado a GitHub, Output directory `dist`.
- **APK:** Capacitor + GitHub Actions (mismo patrón que MAI-Leads).

### Modelo de datos (borrador)
```
user(id, email, ajustes)
goal_year(id, user_id, year, titulo, color, metrica_objetivo, metrica_actual)
goal_month(id, user_id, year, month, titulo, goal_year_id, metas[])
block(id, user_id, fecha, inicio_min, duracion_min, titulo, tipo, plataformas[],
      color, energia, estado, goal_year_id, goal_month_id, recurrencia_id, orden)
note(id, block_id, texto, checklist[], enlaces[])
event(id, user_id, fecha, inicio_min, duracion_min, titulo, tipo, fijo=true)
idea(id, user_id, texto, plataforma, creada_en, usada_en_block_id)
template(id, user_id, nombre, tipo, duracion_min, checklist[])
streak(user_id, dias, vidas, ultimo_dia)
reward(user_id, xp, desbloqueos[])
```

`inicio_min` = minutos desde medianoche, siempre múltiplo de 5. Toda la rejilla es aritmética entera → sin errores de coma flotante ni líos de zona horaria dentro del día.

## 7. Roadmap

| Fase | Contenido | Salida |
|---|---|---|
| F0 | Repo, Vite+TS, tokens de diseño, layout vertical, nav inferior | Esqueleto navegable |
| F1 | Vista Hoy + Semana, bloques de 5 min, arrastrar/redimensionar, persistencia local | Usable sin cuenta |
| F2 | Mes + Año, objetivos y herencia de color, eventos | Los 3 horizontes |
| F3 | Sonido, animaciones, XP, rachas, modo Calma | Capa de recompensa |
| F4 | Foco, pausas, ritual de desconexión, notificaciones | Capa TDAH completa |
| F5 | Supabase auth + sync, migración de datos locales | Multi-dispositivo |
| F6 | Capacitor, haptics, iconos/splash, APK por Actions | APK |

Despliegue web en Cloudflare Pages desde F1, para probar en el móvil real desde el principio.

## 8. Lo que hace falta de ti (branding)

- Nombre definitivo + eslogan corto.
- Logo SVG (versión completa + isotipo cuadrado).
- Favicon (SVG + PNG 32 px).
- Icono de app: **1024×1024 PNG** sin transparencia + versión adaptativa Android (fondo y primer plano separados).
- Splash 2732×2732 PNG, contenido centrado.
- Confirmar o cambiar la paleta de arriba.
- 5 sonidos cortos si los quieres propios; si no, se sintetizan con Web Audio.

## 9. Decisiones cerradas

1. Nombre: **MAI-Focus**. Repo `MAI-Software/MAI-Focus`, deploy `mai-focus.pages.dev`, paquete `com.maisoftwares.maifocus`.
2. Framework: **Svelte 5** + Vite + TS.
3. Datos: **local primero** (IndexedDB). La cuenta llega en F5 y migra lo local al registrarse.
4. Integración real con APIs de redes (publicar de verdad): fuera de alcance en v1, solo planificación.

Pendiente de ti: branding (§8) y confirmación de paleta.
