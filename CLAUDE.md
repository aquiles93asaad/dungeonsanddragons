# Ardaetheros — Compañero de Campaña D&D 5E

App web para gestionar una campaña de D&D 5E. Herramienta del DM en mesa:
hojas de personaje, NPCs, bestiario con loot, sesión en vivo, historia, campaña.

**Idioma:** todo en español (es-AR), con términos D&D bilingües (EN/ES).
**Stack:** Node.js + Express + MongoDB Atlas + Vanilla JS. Sin frameworks de frontend.

### Regla: Sin Claude_Preview — el testeo lo hace el DM
**Nunca usar las herramientas `Claude_Preview` (`preview_*`).** El testeo visual y funcional lo hace el usuario directamente en el browser. No iniciar servidores de preview, no tomar screenshots, no evaluar JS en el preview. Ahorra tokens.

### Regla: StoryActs — solo narrativa, sin números mecánicos
Al cargar o actualizar actos en `storyacts` (y `storychapters`), el contenido debe ser **puramente narrativo**.
- ❌ No incluir: HP, daño, AC, DC, modificadores, resultados de dados, rondas numeradas.
- ✅ Sí incluir: qué pasó, quién actuó, qué aprendieron, momentos memorables, consecuencias narrativas.
- Los números existen en las `sessions` (stream de la sesión live) — la Historia es la crónica, no el log de combate.

---

## Grafo de conocimiento (graphify-out/)

El directorio `graphify-out/` contiene un grafo de conocimiento del codebase completo.
**Usarlo siempre antes de leer archivos individuales** — es más rápido para entender
conexiones, dependencias y arquitectura.

### Archivos clave
| Archivo | Uso |
|---------|-----|
| `graphify-out/GRAPH_REPORT.md` | Resumen: god nodes, comunidades, conexiones sorpresivas |
| `graphify-out/graph.json` | Grafo completo: nodos + aristas + metadatos |
| `graphify-out/graph.html` | Visualización interactiva (abrir en browser) |
| `graphify-out/manifest.json` | Hashes por archivo — detecta qué cambió desde el último build |

### Comunidades principales (navegación rápida)
- **Live Session & Combat** — `live.js`, combat tracker, notas, loot
- **Character Abilities & Persistence** — `abilities.js`, slots, recursos, rest
- **DM Auth & Role System** — `dm-auth.js`, gate, tokens, `body.dm-mode`
- **REST API Routes** — `routes/api.js`, `crudFactory.js`, endpoints
- **Campaign Narrative World** — eventos, hilos, lugares, lore
- **Game Data (Presets & Items)** — `data.js`, `class-presets.js`, items

### God nodes (más conectados — tocarlos con cuidado)
`save()` (34 edges) · `saveLiveSession()` (33) · `renderNoteForm()` (31) · `load()` (29) · `renderActionForm()` (26)

### Regla de actualización del grafo
**Después de cualquier cambio al codebase** (archivo nuevo, función nueva, o modificación
significativa de lógica existente), regenerar el grafo con:
```bash
/graphify
```
Esto actualiza `graphify-out/` para que el grafo refleje el estado actual del código.
Si el cambio es menor (CSS cosmético, texto), la regeneración es opcional.

---

## Cómo correrlo

```bash
cd /Users/akhilasaad/Desktop/D&D
node server.js          # http://localhost:3000
```

Variables de entorno en `.env` (en `.gitignore`, nunca commitear):
```
PORT=3000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>
DM_PASSWORD=<password-del-dm>
SESSION_SECRET=<string-secreto-largo>
DM_TOKEN=<uuid-generado>
```

Para re-seedear la base de datos:
```bash
node db/seed.js
```

---

## Arquitectura general

```
[Browser] ──fetch──▶ [Express API /api/...] ──▶ [MongoDB Atlas]
    │                        │
    │              express-session (cookie)
    │
    └── Vanilla JS (global scope, sin módulos ES)
        Todo en public/js/*.js, cargado en orden en index.html
```

- **`server.js`**: Express app, monta `/api/auth` (auth routes) y `/api` (CRUD routes), sirve `public/` como static.
- **`routes/auth.js`**: Login DM/player por token, logout, `/me`.
- **`routes/api.js`**: Todos los endpoints de datos. Escrituras requieren DM.
- **`routes/crudFactory.js`**: Factory que genera routers GET/POST/PUT/DELETE para un modelo Mongoose.
- **`middleware/requireDM.js`**: Verifica `req.session.isDM`. 401 si no.
- **`middleware/requirePlayer.js`**: Verifica `req.session.playerId`. 401 si no.
- **`models/`**: Mongoose schemas.
- **`db/connect.js`**: Conexión a MongoDB Atlas.
- **`db/seed.js`**: Puebla todas las colecciones desde `public/data/*.js`.
- **`public/`**: Frontend estático servido por Express.

---

## Sistema de autenticación y acceso

### Gate de acceso

La app arranca con `<body class="app-locked">` (en el HTML, antes de JS). El CSS oculta
todo el contenido hasta que el token sea validado. No hay flash de contenido no autorizado.

`#app-gate` es un overlay full-screen con un input de token. Al validar:
1. Token se guarda en `localStorage` como `ard_access_token`.
2. Se llama `unlockApp()` → quita `app-locked` del body + oculta el gate.
3. Se activa el modo correspondiente (DM o player).

### Flujo de sesión (cada carga de página)

`checkDMSession()` en `dm-auth.js` corre al iniciar:
1. Lee `localStorage.getItem('ard_access_token')`.
2. Si existe: `POST /api/auth/token-login` con el token.
3. Si responde OK con `role:'dm'` → `setDMMode(true)` → `unlockApp()`.
4. Si responde OK con `role:'player'` → `setPlayerSession({username, characterId})` → `unlockApp()`.
5. Si no hay token o falla → `showAppGate()`.

### Tokens

| Quién | Token | Dónde vive |
|-------|-------|-----------|
| DM | UUID en `.env` (`DM_TOKEN`) | Hardcodeado en servidor |
| Jugador | UUID generado con `crypto.randomUUID()` | MongoDB `Player.accessToken` |

Los tokens no expiran. La sesión del servidor (cookie `httpOnly`) dura 8 horas.

### Endpoints de auth (`/api/auth`)

| Método | Path | Descripción |
|--------|------|-------------|
| POST | `/login` | DM por password → devuelve DM_TOKEN |
| POST | `/token-login` | Login silencioso — chequea DM_TOKEN o colección Player |
| POST | `/player-login` | Login explícito de jugador por token |
| POST | `/logout` | Destruye sesión |
| GET | `/me` | Estado de sesión actual |

---

## Sistema de roles y visibilidad

Un solo bit de estado: `body.dm-mode` CSS class (seteada/quitada por `setDMMode()`).

### Clases CSS

```css
body:not(.dm-mode) .dm-only          { display: none !important; }
body.dm-mode .player-only            { display: none !important; }
```

**`.dm-only`** → visible solo para el DM. Usado en:
- Tabs de nav: Campaña, NPCs, Bestiario.
- Botones de HP (vital-btn), short/long rest, subir de nivel.
- Botones de monedas (+/-).
- Botón "+ agregar item" en Items.
- Botón "+ agregar item" en inventario del personaje.
- Clases/habilidades aún no activadas (featureLevel > charLevel).
- Hechizos locked.
- Controles de Sesión Live: editar meta de sesión, location, finalizar, grupo, combate.

**`.player-only`** → visible solo para jugadores (oculto para DM).
Actualmente sin uso pero disponible.

### Restricciones adicionales (no via dm-only, via CSS directo)

```css
/* Condiciones: no clickeables para jugadores */
body:not(.dm-mode) .condition-btn    { pointer-events: none; opacity: 0.7; }

/* Spell slots: no interactivos */
body:not(.dm-mode) .slot-box         { pointer-events: none; }

/* Cantrips: no toggle, inactivos ocultos */
body:not(.dm-mode) .cantrip-active-btn { pointer-events: none; }
body:not(.dm-mode) .cantrip-item.is-inactive { display: none !important; }

/* Spells: no toggle prep, no preparados ocultos */
body:not(.dm-mode) button.spell-prep-btn { pointer-events: none; }
body:not(.dm-mode) .spell-item:not(.is-prepared):not(.is-always-prep) { display: none !important; }
```

---

## Estructura de archivos

```
D&D/
├── server.js                    Entry point Express
├── .env                         Secrets (no commitear)
├── .gitignore
├── package.json
│
├── routes/
│   ├── auth.js                  Endpoints de autenticación
│   ├── api.js                   Endpoints de datos (CRUD)
│   └── crudFactory.js           Factory de routers CRUD
│
├── middleware/
│   ├── requireDM.js             Guard: session.isDM
│   └── requirePlayer.js         Guard: session.playerId
│
├── models/                      Mongoose schemas
│   ├── CampaignEvent.js
│   ├── CampaignLocation.js
│   ├── CampaignState.js         Documento único: estado de campaña + chars
│   ├── CampaignThread.js
│   ├── ClassPreset.js           charId: 'rac'/'relyo'/... + data json
│   ├── Condition.js
│   ├── Item.js                  Incluye campo `known` (bool, default false)
│   ├── Monster.js
│   ├── Npc.js
│   ├── Player.js                username, characterId, accessToken, privateNotes
│   ├── Session.js
│   ├── Story.js
│   ├── StoryAct.js
│   └── StoryChapter.js
│
├── db/
│   ├── connect.js               mongoose.connect() con MongoDB Atlas
│   └── seed.js                  Puebla la DB desde public/data/*.js
│
└── public/                      Frontend estático
    ├── index.html               Shell: HTML + <link>/<script> en orden
    ├── CLAUDE.md                Doc vieja (pre-migración, referencia histórica)
    │
    ├── css/                     Estilos por feature
    │   ├── base.css             Variables CSS, reset, tipografía
    │   ├── layout.css           Top-bar, nav, gate, rol-visibility, sidebar, cards
    │   ├── characters.css       Fichas, HP, condiciones, inventario, armas
    │   ├── abilities.css        Saves, skills, resources, slots, cantrips, spells
    │   ├── money.css            Monedero
    │   ├── npcs.css             Grid/cards de NPCs
    │   ├── story.css            Timeline de Historia
    │   ├── bestiary.css         Monstruos, loot
    │   ├── campaign.css         Sub-tabs, eventos/hilos/lugares
    │   ├── live.css             Sesión Live: combat tracker, notas, stream
    │   ├── items.css            Catálogo de items
    │   ├── modal.css            Modal de imágenes
    │   └── players.css          Panel DM de players, notas privadas
    │
    ├── data/                    Datos estáticos JS (leídos por seed.js y por el frontend)
    │   ├── items.js             Catálogo de items (21 items, incluyendo `known`)
    │   ├── conditions.js        15 condiciones D&D con mecánicas
    │   ├── npcs.js              19 NPCs
    │   ├── monsters.js          PRESET_MONSTERS (9 monstruos)
    │   ├── campaign-events.js   Eventos de campaña
    │   ├── campaign-threads.js  Hilos narrativos
    │   ├── campaign-locations.js Lugares
    │   └── class-presets.js     CLASS_PRESETS por personaje (Nv 1-20)
    │
    └── js/                      Frontend JS (cargado en orden, scope global)
        ├── dm-auth.js           ★ Gate, tokens, roles, indicador de sesión
        ├── data.js              Constantes locales (CHARS, helpers D&D)
        ├── storage.js           save()/load() con MongoDB via fetch
        ├── navigation.js        showPage/showSidebar/showChar
        ├── characters.js        HP, condiciones, inventario, notas
        ├── abilities.js         Saves, skills, resources, slots, spells, rest
        ├── money.js             Monedero personal + grupo
        ├── npcs.js              Render NPCs
        ├── images.js            Modal de imágenes, retratos
        ├── overview.js          Cards de estado del grupo en Inicio
        ├── bestiary.js          Monstruos, filtros, loot
        ├── campaign.js          Eventos/hilos/lugares, drag&drop, ideas
        ├── live.js              Sesión Live: combat tracker, notas, stream
        ├── items.js             Catálogo de items
        ├── players.js           ★ Sesión player, notas privadas, panel DM
        └── init.js              ★ Arranque: orquesta render inicial
```

---

## Orden de carga JS (NO cambiar sin cuidado)

```
dm-auth.js → data.js → storage.js → navigation.js → characters.js →
abilities.js → money.js → npcs.js → images.js → overview.js →
bestiary.js → campaign.js → live.js → items.js → players.js → init.js
```

Reglas:
- `dm-auth.js` **primero** — define `checkDMSession()`, `setDMMode()`, `setSessionIndicator()`, `setPlayerSession()` es de `players.js` pero llamado desde `dm-auth.js` (debe estar antes de que se use, players.js se carga antes de init.js).
- `data.js` segundo — todos dependen de constantes/presets.
- `init.js` **último** — llama a `checkDMSession()` y luego a todos los renders.
- Sin `import`/`export` — todo en scope global.

---

## API de datos (`/api`)

### crudFactory — patrón usado en casi todas las rutas

```js
crud(Model, { idField='id', protect=null, playerFilter=null })
```

- GET `/` — público. Si `playerFilter` y `!session.isDM` → aplica el filtro Mongoose.
- GET `/:id` — público.
- POST, PUT, DELETE — requieren `protect` (normalmente `requireDM`).

### Rutas definidas

| Recurso | Path | Notas |
|---------|------|-------|
| Items | `/api/items` | playerFilter: `{known:true}` — jugadores solo ven items marcados |
| Conditions | `/api/conditions` | |
| NPCs | `/api/npcs` | |
| Monsters | `/api/monsters` | |
| Events | `/api/events` | |
| Threads | `/api/threads` | |
| Locations | `/api/locations` | |
| Class Presets | `/api/presets` | idField: `charId` |
| Presets map | GET `/api/presets-map` | Devuelve `{rac:{...}, relyo:{...}}` |
| Sessions | `/api/sessions` | idField: `number` |
| Session notes | POST `/api/sessions/:n/notes` | requireDM |
| Story | GET `/api/story` | Chapters + acts ordenados |
| Story chapters | `/api/story/chapters` | idField: `number` |
| Story acts | `/api/story/acts` | idField: `_id` |
| Campaign state | GET/PUT `/api/state` | Documento único, PUT requireDM |
| Char state | PUT `/api/state/character/:charId` | requireDM, patch parcial |
| Players (DM) | POST/GET/DELETE `/api/players` | requireDM |
| Private notes | GET/PUT `/api/players/me/notes` | requirePlayer — ni el DM puede leer |

### Items y el campo `known`

`Item.known` (Boolean, default `false`) indica si los jugadores conocen ese item.
El DM puede marcarlo desde la tab Items. Jugadores solo reciben items con `known:true`.
13 de 21 items arrancan con `known:true` en el seed (armas básicas + loot canónico de S1).

---

## Modelo Player

```js
{
  username:     String (unique)   // 'javier', 'chona', etc.
  characterId:  String            // 'rac', 'relyo', 'tyrell', 'boyd', 'esdas'
  accessToken:  String (unique)   // crypto.randomUUID(), sin expiración
  privateNotes: String            // solo accesible via requirePlayer, ni el DM las ve
}
```

Jugadores creados: javier→rac, chona→relyo, juanma→tyrell, kevin→boyd, iyas→esdas.

---

## Frontend — dm-auth.js

Funciones clave (scope global):

| Función | Qué hace |
|---------|---------|
| `checkDMSession()` | Arranque: lee localStorage, hace token-login silencioso |
| `submitGateToken()` | Handler del gate: valida token, guarda en localStorage |
| `setDMMode(bool)` | Toggle `body.dm-mode` + indicador en nav |
| `setSessionIndicator(text, color)` | Actualiza `#session-indicator` en el nav |
| `lockApp()` / `unlockApp()` | Toggle `body.app-locked` |
| `showAppGate()` | Muestra gate + limpia input |
| `dmLogout()` | Destruye sesión + quita token de localStorage + muestra gate |

**Interceptor global de fetch:** cualquier respuesta `401` de `/api/*` (excepto `/api/auth`) muestra un toast y redirige al gate tras 1.8s.

---

## Frontend — players.js

| Función | Qué hace |
|---------|---------|
| `setPlayerSession(player)` | Guarda `window.PLAYER_SESSION`, actualiza indicador nav, muestra/oculta sección de notas privadas del char |
| `loadPrivateNotes(charId)` | Fetch GET `/api/players/me/notes` |
| `onPrivateNoteInput(charId)` | Debounce 1200ms → `savePrivateNotes()` |
| `renderPlayersPanel()` | Panel DM en sub-tab "Jugadores" de Campaña: lista players con tokens + copy |
| `createPlayer()` / `deletePlayer()` | CRUD de players desde el panel DM |

`CHAR_NAMES = { rac:'Rac', relyo:'Relyo', tyrell:'Tyrell', boyd:'Boyd', esdas:'Esdas' }`

---

## Nav y tabs

| Tab | Id de página | Visibilidad |
|-----|-------------|-------------|
| Inicio | `page-overview` | Todos |
| Historia | `page-story` | Todos |
| Sesión Live | `page-live` | Todos (controles internos dm-only) |
| Campaña | `page-campaign` | dm-only |
| Personajes | `page-chars` | Todos (controles de edición dm-only) |
| NPCs | `page-npcs` | dm-only |
| Bestiario | `page-bestiary` | dm-only |
| Items | `page-items` | Todos (botón agregar dm-only) |

El indicador de sesión (`#session-indicator`) arriba a la derecha muestra:
- `🎲 DM` (dorado) — cuando es DM
- `⚔ Rac` (azul) — nombre del personaje del jugador logueado
- Vacío — nunca visible (CSS: `display:none` si está vacío)

---

## Filosofía de la campaña (IMPORTANTE para decisiones de diseño)

1. **Evolución orgánica.** Los personajes aprenden features/hechizos por eventos narrativos, no por "subir de nivel automáticamente". El codex Nv 1-20 es un menú de posibilidades.
2. **Subclases mezclables.** Un personaje puede tomar rasgos de varias subclases si la historia lo justifica.
3. **El dado físico del jugador manda.** El loot, tiradas, etc. usan el dado real del jugador. La app asiste, el DM tiene la última palabra.
4. **Reglas D&D 5E como base.** Spell slots, descansos, recursos por clase: todo RAW. House rules explícitas marcadas (ej: Esdas multi-escuela).

Los 5 personajes: **rac** (Bárbaro), **relyo** (Monje), **tyrell** (Paladín), **boyd** (Druida), **esdas** (Wizard). Nivel actual: 4 en mesa (en la base siguen en Nv 3 — ver Estado de la campaña).

---

## Estado de la campaña

- **Jugado hasta la Sesión 8** (11/09/2026). Todo lo jugado está cargado en la base: eventos (`campaignevents`), stream de cada sesión (`sessions` #1–#8), Historia (`storychapters`/`storyacts`, capítulos 1–8), NPCs, hilos, lugares, items e inventarios.
- **Dónde están:** en Solmira, tras rechazar la invasión Fell (S7) y la muerte de Aldren Solmiren. Decidieron ir hacia Jabal Thalos pasando por **SolNeth**. Al amanecer siguiente a la S8 es el funeral de Aldren.
- **Main quest:** el ritual de las dos gemas para revertir el Fell. La de espacio y tiempo está en una mazmorra enana de Jabal Thalos; la de naturaleza, en la Ciudad del Oro, bajo el Lago del Oeste. Esdas tiene los dos tomos.
- **Nivel 4:** subieron después de la pelea con Saren (S7/S8) pero **todavía no está aplicado en la base**, y nadie eligió su ASI/dote. Se va a aplicar desde la app (mejora pendiente).
- **Subclases:** Esdas → Adivinación (`committedSchool: divination`). Relyo → Camino de la Sombra (registrado como hilo; la app no tiene campo de subclase de monje). Rac, Tyrell y Boyd: sin subclase todavía.
- **Monedero:** el grupo tiene 55 de plata; Relyo, 8 de oro propios.
- **Sesión Live:** antes de jugar la Sesión 9, verificar que el número en el header sea **9** (el navegador quedó en 8). Si el número ya está archivado, el header muestra un aviso con botón "Usar #N+1", y Finalizar pide confirmación explícita antes de sobrescribir una sesión archivada.

**Fuente de verdad narrativa: la base de datos (MongoDB).** Los documentos de diseño viejos (`Ardaetheros_*_V1/V2.md`, Pendientes) se eliminaron por desactualizados. En `documentos/` quedan solo `EVOLUCION_PERSONAJES.md`, `dnd_campaign_v_1_worldbuilding_summary.md`, la guía de dados y los manuales de 5E.

Las Sesiones 6, 7 y 8 no salieron de la Sesión Live: se reconstruyeron después (S6 desde audios resumidos, S7 desde el relato del DM, S8 desde la transcripción del audio). Las notas del stream de S7 y S8 están marcadas con `reconstructed: true`.

---

## Fases completadas

- **Fase 1** ✅ Migración de `file://` monolítico a Node.js + Express + MongoDB
- **Fase 2** ✅ CRUD completo para todas las colecciones via API REST
- **Fase 3** ✅ Historial de sesiones (Session model, stream de notas)
- **Fase 4** ✅ Auth DM: token en `.env`, gate de acceso, `body.dm-mode`, `requireDM`
- **Fase 4B** ✅ Visibilidad por rol: CSS `dm-only`/`player-only`, spells/slots read-only para jugadores
- **Fase 5** ✅ Cuentas de jugadores: tokens únicos, notas privadas, panel DM en Campaña
- **Fase 6** ✅ Vistas de jugador refinadas (navegación automática al char del jugador al loguearse)
- **Fase 7** ✅ Socket.IO para sesión live en tiempo real (múltiples clientes viendo simultáneamente)
- **Fase 8** ✅ Deploy a Render

---

## Sistema de combate y loot (Sesión Live)

`live.js` maneja `LIVE_SESSION = { meta, notes, combat, updatedAt }`. Persiste en localStorage (`ard_live_session`) y en MongoDB (`CampaignState.liveSession`, PUT `/api/state` con debounce de 1.5s, solo el DM). Al cargar gana la copia con `updatedAt` más nuevo — sobrevive a cambiar de dispositivo, borrar datos del navegador o reiniciar el server (el relay de Socket.IO es solo memoria).

- **Combat tracker:** jugadores (HP desde hoja), monstruos (HP por instancia). Iniciativa, rounds, condiciones, buffs, HP temporales, death saves, stat block del monstruo desplegable.
- **Turnos:** `combat.currentId` = de quién es el turno (ordenado por iniciativa; se reordena al cambiar iniciativa o sumar combatientes). **Guardar una nota NO termina el turno** — lo hace "Fin de turno ▶". ⚔ abre el form para cualquiera en cualquier momento (reacciones, ataques de oportunidad), ⏭ saltea, ▶ da el turno fuera de orden.
- **Economía de acciones** (recordatorio, no bloquea): cada nota registra acción / bonus / reacción / ataques en el combatiente (`turnUse`, `reactionUsed`). Saves y skill checks no gastan nada. Una acción de alguien que ya jugó su turno = reacción. Ataque Extra (Nv 5: Rac, Relyo, Tyrell) = 2 ataques → "Guardar + otro ataque".
- **Estado por PJ** (`LIVE_SESSION.pcState[charId]`): buffs, HP temporales, death saves, CA manual, smite cargado, concentración fuera del tracker. Vive por personaje (no en el combatiente) → funciona fuera de combate. Monstruos: lo mismo en el propio combatiente.
- **Daño** (`applyDamage`): HP temporales → Forma Salvaje (sobrante pasa a Boyd) → PJ a 0 HP = death saves (golpe estando caído = 1 fallo, crítico = 2; sobrante ≥ HP máx = muerte) → CON save de concentración. Monstruos: avisos al cruzar umbrales de HP que mencionan sus habilidades/fases.
- **Input rápido de HP** en cada tarjeta: `7`/`-7` daño · `+5` curación · `t5` HP temporales (`t0` los quita).
- **Quick-add:** Acción jugador / Conversación / Combate / Narrativa.
  - **Acción jugador** — se resuelve según `getActionMode()`: ataque (arma o spell attack, override ✓/✗ del DM, crítico = doble de dados, riders de Castigo Divino / smite cargado / Favor Divino), salvación (enemigos y aliados en el área, con competencia en saves del PJ), curación (cualquier PJ, caídos y fuera de combate), smite (Bonus Action que queda cargado al próximo golpe), Misil Mágico (dardos por objetivo), Rayo Abrasador (un ataque por rayo), Sueño (pool de HP), daño automático, buffs multi-objetivo y utilidad. El slot sale de la tabla por nivel de personaje (≥ nivel del hechizo); concentrado en el mismo hechizo → "efecto sostenido" sin gastar slot.
  - **Acción de monstruo:** ataque (con Shield de Esdas, Desviar Proyectiles de Relyo y resistencia de Furia) o habilidad/hechizo con salvación sobre varios objetivos. "Guardar + otro ataque" para Multiattack.
  - **Narrativa:** vincula a evento de Campaña → transición de estado (planificado → en curso → hecho).
- **Armas:** el bonus de daño = modificador del atributo del ataque (+ Furia en STR cuerpo a cuerpo, + Arma Mágica). Armas de monje y finesse usan el mayor entre STR y DEX; Relyo usa el dado de Artes Marciales si es mayor.
- **Loot roll:** d20 del jugador → items con `minRoll` cumplido → asignados a mochila. `minRoll:0` = garantizado, `minRoll:20` = solo nat 20.

### Campos de mecánica en los hechizos (`db/seed-data/class-presets.js`)
El form lee estos campos; si faltan, infiere tiempo de lanzamiento y concentración del texto (`desc` que arranca con "Concentración", "Bonus Action", "Reaction").
`castingTime` ('bonus' | 'reaction') · `concentration` · `smite` · `effect.targetConditionOnFail` · `missiles` · `rays` · `sleepPool` · `autoDamage` · `areaSave` · `weaponRider` · `buff` (`acBonus`, `acMin`, `rollBonus`, `tempHP`, `tempHPEachTurn`, `weaponAtkBonus`, `untilNextTurn`) · `maxTargets` / `targetsPerLevel`.
**Después de editarlos hay que correr `node db/seed.js`** (hace upsert de los class presets; no toca el resto de las colecciones).

### Flujo Narrativa ↔ Eventos de Campaña
- Elegir evento → prefill título/descripción (editables).
- Guardar nota → evento pasa a **"en curso"**.
- Borrar nota → evento vuelve a **"planificado"**.
- Finalizar sesión → eventos vinculados pasan a **"Hecho"**.

### Stream agrupado por capítulos
Cada narrativa es un header de capítulo. Sus notas hijo aparecen indentadas.
Notas sin narrativa → "Sin evento narrativo". Borrar narrativa con hijos → hijos pasan al bucket pre-narrativa.

### Presentes como tarjetas
Tarjetas clickeables con toggle ☑/☐. Click en cuerpo → modal con hoja del personaje.
El modal mueve el nodo real del DOM (no clona) → cualquier edición es la fuente de verdad.

---

## Sistema de condiciones

15 condiciones en MongoDB. Las de los hechizos (Restrained, Prone, Frightened, Paralyzed, Incapacitated, Unconscious de Sueño…) se aplican solas al fallar la salvación y se quitan si se rompe la concentración del caster. Los avisos tácticos (ventaja/desventaja) salen de `mechanical` de cada condición; Dodge e Inconsciente (PJ a 0 HP) también avisan.

Duración: `turnsLeft` baja en `advanceRound()`. 1 minuto = 10 rounds. Lo que dura "hasta tu próximo turno" (Dodge, Ataque Imprudente, Shield) vence en `startTurn()` del combatiente.

---

## Convenciones importantes

- **Sin `import/export`** en frontend — todo scope global.
- **Prefijo `ard_`** en localStorage para datos del cliente (HP, inventario, notas, retratos).
- El **estado del servidor** (levels, slots, money) persiste en MongoDB via API.
- **`save()` con claves de personaje** (`hp_`, `hp_max_`, `char_level_`, `slots_`, `resource_`, `inv_`, etc.) actualiza `CHAR_STATE` automáticamente (`_CHAR_STATE_FIELDS` en `storage.js`). `syncCharState()` y los getters leen `CHAR_STATE`: escribir esas claves por fuera de `save()` hace que el cambio no llegue a MongoDB y se pierda al recargar.
- **`dm-only` con CSS**, no con JS condicional — el estado de rol es reactivo sin re-renders.
- **`body.app-locked` en el HTML** antes de que cargue JS — no hay flash de contenido sin auth.
- **Tokens sin expiración** — la sesión del servidor (cookie) sí expira en 8h.
- **Notas privadas de jugador**: solo `requirePlayer` las ve; `requireDM` no tiene acceso intencional. Esto es por diseño.

---

## Notas para editar

- **Agregar item:** sumar a `public/data/items.js` con `known:true/false`, correr `node db/seed.js`.
- **Agregar NPC:** sumar a `public/data/npcs.js`, correr seed.
- **Agregar monstruo:** sumar a `public/data/monsters.js`, correr seed.
- **Agregar evento/hilo/lugar:** sumar al archivo correspondiente en `public/data/`, correr seed.
- **Agregar hechizo/feature:** editar `db/seed-data/class-presets.js` (con los campos de mecánica de arriba si aplica), correr `node db/seed.js`.
- **Agregar jugador:** desde el panel DM en Campaña → sub-tab "Jugadores".
- **Re-seedear todo:** `node db/seed.js` — limpia y re-crea todas las colecciones.
- **El archivo `public/CLAUDE.md`** es la doc histórica de la app pre-migración (file://). No actualizar.
