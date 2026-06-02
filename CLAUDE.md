# Ardaetheros — Compañero de Campaña D&D 5E

App web para gestionar una campaña de D&D 5E. Herramienta del DM en mesa:
hojas de personaje, NPCs, bestiario con loot, sesión en vivo, historia, campaña.

**Idioma:** todo en español (es-AR), con términos D&D bilingües (EN/ES).
**Stack:** Node.js + Express + MongoDB Atlas + Vanilla JS. Sin frameworks de frontend.

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

Los 5 personajes: **rac** (Bárbaro), **relyo** (Monje), **tyrell** (Paladín), **boyd** (Druida), **esdas** (Wizard). Nivel actual: 2.

---

## Estado de la campaña

- Sesión 1: jugada (canon).
- Sesión 2: jugada, corta y narrativa (conocer NPCs en Aether Grove), salió distinta a lo planeado.
- Los personajes siguen en Nv 2.
- Los eventos reales de S2 no están cargados — los presets son la versión planeada.

Fuentes de verdad narrativa (en `D&D/`): `Ardaetheros_Personajes_V1.md`, `_NPCs_V1.md`, `_Monstruos_V1.md`, `_Lugares_V1.md`, `_Eventos_V1.md`.

---

## Fases completadas

- **Fase 1** ✅ Migración de `file://` monolítico a Node.js + Express + MongoDB
- **Fase 2** ✅ CRUD completo para todas las colecciones via API REST
- **Fase 3** ✅ Historial de sesiones (Session model, stream de notas)
- **Fase 4** ✅ Auth DM: token en `.env`, gate de acceso, `body.dm-mode`, `requireDM`
- **Fase 4B** ✅ Visibilidad por rol: CSS `dm-only`/`player-only`, spells/slots read-only para jugadores
- **Fase 5** ✅ Cuentas de jugadores: tokens únicos, notas privadas, panel DM en Campaña

## Fases pendientes

- **Fase 6** — Vistas de jugador refinadas (navegación automática al char del jugador al loguearse)
- **Fase 7** — Socket.IO para sesión live en tiempo real (múltiples clientes viendo simultáneamente)
- **Fase 8** — Deploy a Render

---

## Sistema de combate y loot (Sesión Live)

`live.js` maneja `LIVE_SESSION = { meta, notes, combat }` (persiste en MongoDB via `/api/state`).

- **Combat tracker:** jugadores (HP desde hoja), monstruos (HP por instancia). Iniciativa, turnos, rounds, condiciones.
- **Quick-add:** Acción jugador / Conversación / Combate / Narrativa.
  - **Acción jugador:** d20+mod vs AC/DC, hit/miss, consume spell slot, aplica daño automático.
  - **Narrativa:** vincula a evento de Campaña → transición de estado (planificado → en curso → hecho).
- **Loot roll:** d20 del jugador → items con `minRoll` cumplido → asignados a mochila. `minRoll:0` = garantizado, `minRoll:20` = solo nat 20.

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

15 condiciones en MongoDB. **Solo Restrained y Concentración tienen mecánica activa.**
Los 13 restantes muestran badge visual pero no afectan cálculos aún.

Duración: `turnsLeft` baja en `advanceRound()`. 1 minuto = 10 rounds.

---

## Convenciones importantes

- **Sin `import/export`** en frontend — todo scope global.
- **Prefijo `ard_`** en localStorage para datos del cliente (HP, inventario, notas, retratos).
- El **estado del servidor** (levels, slots, money) persiste en MongoDB via API.
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
- **Agregar hechizo/feature:** editar `public/data/class-presets.js`, correr seed.
- **Agregar jugador:** desde el panel DM en Campaña → sub-tab "Jugadores".
- **Re-seedear todo:** `node db/seed.js` — limpia y re-crea todas las colecciones.
- **El archivo `public/CLAUDE.md`** es la doc histórica de la app pre-migración (file://). No actualizar.
