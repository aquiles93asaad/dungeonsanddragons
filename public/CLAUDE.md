# Ardaetheros — Compañero de Campaña D&D 5E

App web local (sin servidor, sin build) para gestionar una campaña de D&D 5E.
Es la herramienta del DM en mesa: hojas de personaje, NPCs, bestiario con loot,
sesión en vivo, guía de campaña con eventos/hilos/lugares.

**Idioma:** todo en español (es-AR), con términos D&D bilingües (inglés / español).
**Se abre directo con doble-click** en `Ardaetheros_Campaign.html` (protocolo `file://`).
No usa servidor, ni npm, ni build step, ni frameworks. Vanilla JS + CSS.

---

## Cómo correrlo

Abrir `Ardaetheros_Campaign.html` en un navegador (doble-click o arrastrar).
Todo el estado se guarda en **localStorage** del navegador con prefijo `ard_`.
No hay backend — los datos viven en el navegador de quien lo usa.

> ⚠ Como es `file://`, **no se pueden usar ES modules** (`import`/`export`) —
> el navegador los bloquea por CORS. Por eso todo son `<script>` clásicos
> cargados en orden, compartiendo scope global. El orden de carga importa
> (ver abajo).

---

## Filosofía de la campaña (IMPORTANTE para entender decisiones de diseño)

Esta campaña NO funciona como un videojuego. Las decisiones de producto reflejan eso:

1. **Evolución orgánica de personajes.** Los personajes no "suben de nivel y
   desbloquean todo". Aprenden hechizos y features **por eventos narrativos**
   ("Nira te enseñó esto", "viste a alguien hacer aquello"). El codex de Nv 1-20
   está visible como **menú de posibilidades**, no como contrato.

2. **Subclases mezclables.** Un personaje puede tomar rasgos de varias subclases
   si la historia lo justifica. No hay "elegí subclase del dropdown".

3. **El dado físico del jugador manda.** El loot, las tiradas, etc. usan el
   resultado del dado real del jugador. La app asiste con cálculos pero el DM
   tiene siempre la última palabra (override narrativo).

4. **Reglas D&D 5E respetadas como base.** Spell slots, descansos, recursos por
   clase — todo RAW. Con house rules explícitas marcadas (ej: Esdas multi-escuela).

Ver `../EVOLUCION_PERSONAJES.md` para el detalle de cómo se implementa la
progresión post-sesión.

---

## Estructura de archivos

```
pagina_web/
├── Ardaetheros_Campaign.html   Shell: HTML de todas las páginas + <link>/<script>
├── CLAUDE.md                   Este archivo
├── css/                        Estilos por feature
│   ├── base.css                Variables CSS, reset, tipografía, scrollbar, responsive
│   ├── layout.css              Top-bar, nav-tabs, sidebar, .page, cards
│   ├── characters.css          Ficha, stats, vitals/HP, condiciones, armas, inventario, marcas, overview cards
│   ├── abilities.css           Saves/skills, resources, rest/levelup buttons, slots, cantrips, spells, school badges, campaign-notes
│   ├── money.css               Monedero (cp/sp/gp/pp)
│   ├── npcs.css                Grid y cards de NPCs
│   ├── story.css               Timeline de Historia
│   ├── bestiary.css            Lista de monstruos, detalle, form de alta, loot table
│   ├── campaign.css            Sub-tabs, cards reordenables (eventos/hilos/lugares), status pills
│   ├── live.css                Sesión Live: header, combat tracker, quick-add, note forms, stream
│   └── modal.css               Modal de imágenes
└── js/                         Lógica por feature (orden de carga abajo)
    ├── data.js                 ★ TODA la data: constantes, presets, NPCs, monstruos, campaña, D&D rules
    ├── storage.js              save()/load() localStorage + showSaved()
    ├── navigation.js           showPage/showSidebar/showChar
    ├── characters.js           HP, condiciones, inventario, notas de personaje
    ├── abilities.js            Saves/skills, resources, slots, cantrips, spells, rest, level-up, scaling
    ├── money.js                Monedero personal + grupo
    ├── npcs.js                 Render dinámico de NPCs desde NPCS array
    ├── images.js               Modal de imágenes (URL o archivo) + retratos
    ├── overview.js             Tarjetas de estado del grupo en página Inicio
    ├── bestiary.js             Render/CRUD de monstruos, filtros, form, loot table de referencia
    ├── campaign.js             Eventos/hilos/lugares reordenables (drag&drop), tab Ideas
    ├── live.js                 ★ Sesión Live completa: combat tracker, notas, loot roll, finalizar
    └── init.js                 Arranque: orquesta el render inicial de todo
```

---

## Orden de carga (NO cambiar sin cuidado)

**CSS** (en `<head>`): base → layout → characters → abilities → money → npcs →
story → bestiary → campaign → live → modal.

**JS** (antes de `</body>`): **data → storage** → navigation → characters →
abilities → money → npcs → images → overview → bestiary → campaign → live →
**init**.

Reglas:
- `data.js` **primero** — todos dependen de sus constantes/presets.
- `storage.js` segundo — todos usan `save()`/`load()`.
- `init.js` **último** — llama a las funciones de render de todos los módulos.
- Las funciones viven en scope global (no hay módulos). Cuidado con colisiones
  de nombres entre archivos.

---

## Las páginas (tabs del nav)

| Tab | id de la página | JS principal |
|-----|-----------------|--------------|
| Inicio | `page-overview` | overview.js + money.js (grupo) |
| Historia | `page-story` | (HTML estático — timeline Sesión 1, aún no data-driven) |
| Sesión Live | `page-live` | live.js |
| Campaña | `page-campaign` | campaign.js |
| Personajes | `page-chars` | characters.js + abilities.js + money.js |
| NPCs | `page-npcs` | npcs.js |
| Bestiario | `page-bestiary` | bestiary.js |

---

## data.js — el corazón de los datos

Todo lo editable/preset vive acá. Secciones (en orden):

- **Constantes de personajes:** `CHARS`, `HP_MAX`, `DEFAULT_INVENTORY`
- **TODO magic-items** (comentario): sistema de items mágicos sin implementar
- **NPCS** (array) + `NPC_IDS` (derivado): 19 NPCs con id/name/icon/faction/role/status/desc/extra
- **CAMPAÑA:** `DEFAULT_CAMPAIGN_EVENTS` (26), `DEFAULT_CAMPAIGN_THREADS` (23), `DEFAULT_CAMPAIGN_LOCATIONS` (12)
- **D&D 5E rules:**
  - `ABILITY_SCORES`, `CHAR_LEVEL`, `PROF_BONUS`, `HIT_DIE_BY_CHAR`
  - `abilityMod()`, `hitDieAvg()`, `hpGainOnLevelUp()`
  - Getters dinámicos: `getCharLevel()`, `getHPMax()`, `getCharProfBonus()`
  - `FULL_CASTER_SLOTS` / `HALF_CASTER_SLOTS` (tablas Nv 1-20) + `getSpellSlotsForLevel()`
  - `getResourceMax()` (Rage/Ki/Lay on Hands/Wild Shape escalan por nivel)
  - `getRageDamageBonus()`, `getMartialArtsDie()`, `getUnarmoredMovementBonus()`
  - `getCantripDamageDice()` (escalado de cantrips + house rule de Esdas)
  - `commitToSchool()` (Esdas elige escuela arcana)
- **`CLASS_PRESETS`** (bloque grande): por personaje → saveProfs, skillProfs,
  resources, **levelFeatures** (Nv 1-20 completos), cantripsData, spellList.
  Arriba tiene un **bloque maestro de TODOs** (subclases, magic items, etc.)
- **`PRESET_MONSTERS`** (9): stats, attacks, abilities, phases, **loot** (con minRoll), rewards, notes

Los 5 personajes: **rac** (Bárbaro), **relyo** (Monje), **tyrell** (Paladín),
**boyd** (Druida), **esdas** (Wizard). Todos arrancan Nv 2.

---

## Convenciones de localStorage (prefijo `ard_`)

| Clave | Qué guarda |
|-------|-----------|
| `ard_hp_<char>` | HP actual del personaje |
| `ard_hp_max_<char>` | HP máximo (cambia con level-up) |
| `ard_char_level_<char>` | Nivel del personaje (sube individualmente) |
| `ard_cond_<char>` | Condiciones activas (array) |
| `ard_inv_<char>` | Inventario/mochila (array de strings) |
| `ard_notes_<char>` | Notas libres del personaje |
| `ard_portrait_<char>` / `ard_portrait_npc-<id>` | Retrato (data URL o URL) |
| `ard_slots_<char>_<level>` | Spell slots gastados de ese nivel |
| `ard_resource_<char>_<key>` | Recurso gastado/pool (rage, ki, lay-on-hands...) |
| `ard_prepared_<char>` | Hechizos preparados (array de nombres) |
| `ard_active_cantrips_<char>` | Cantrips activos (house rule) |
| `ard_committed_school_<char>` | Escuela arcana elegida (Esdas) |
| `ard_money_<owner>` | Monedero (`group` o nombre de char): {cp,sp,gp,pp} |
| `ard_npc_note_<id>` | Notas DM privadas de cada NPC |
| `ard_bestiary` | Array completo de monstruos (con HP actual) |
| `ard_campaign` | {events, threads, locations} |
| `ard_campaign_ideas` | Textarea de ideas libres |
| `ard_live_session` | {meta, notes, combat} de la sesión en curso |

**Migraciones:** `loadMonsters()` (bestiary.js) y `loadCampaign()` (campaign.js)
mergean entradas nuevas del preset en la cache existente sin pisar ediciones del
usuario. Importante al agregar nuevos monstruos/eventos/hilos/lugares: aparecen
automáticamente aunque el usuario ya tenga data cacheada.

---

## Sistema de combate y loot (Sesión Live)

`live.js` maneja `LIVE_SESSION = { meta, notes, combat }`:

- **Combat tracker:** participantes (jugadores del grupo o monstruos del bestiario
  o ad-hoc). Jugadores leen/escriben HP de su hoja (única fuente de verdad).
  Monstruos tienen HP propio por instancia (4 spiderlings = 4 entradas). Iniciativa,
  turnos, rounds, condiciones.
- **Quick-add notes:** 4 tipos → Acción jugador / NPC habla / Combate / Narrativa.
  - **Acción jugador:** asistencia D&D (tirada d20 + mod vs AC/DC, hit/miss/pass/fail,
    nat 20/nat 1, consume spell slot automático, aplica daño al objetivo en tiempo real)
  - **Narrativa:** se vincula a eventos de Campaña (ver abajo)
- **Loot roll:** botón 🎲 en cada monstruo del bestiario que esté en el tracker.
  Tira d20 del jugador → items con `minRoll` cumplido caen → se asignan a la
  mochila de un personaje. `minRoll:0` = Garantizado, `minRoll:20` = solo NAT 20.
  Genera nota en el stream.

### Flujo Narrativa ↔ Eventos de Campaña

- "+ Narrativa" tiene un dropdown: "No planificado" o un evento existente (ordenados
  como en Campaña, excluyendo los "Hecho").
- Elegir evento → prefill de título/descripción (editables).
- Guardar nota vinculada → evento pasa a **"en curso"** + actualiza su texto.
- Borrar la nota → evento vuelve a **"planificado"** (si no quedan otras notas vinculadas).
- **Finalizar sesión** → eventos vinculados pasan a **"Hecho"**; notas no
  planificadas se crean como eventos nuevos "Hecho" con la sesión actual.

---

## Estado de la campaña (al momento de este doc)

- **Sesión 1:** jugada (canon). Historia hardcodeada en `page-story`.
- **Sesión 2:** jugada — fue corta y mayormente narrativa (conocer NPCs en Aether Grove).
  Salió distinta a lo planeado. Los eventos REALES de lo que pasó en mesa todavía
  NO están cargados en la app (ver TODO).
- **Personajes siguen en Nv 2.** Todavía NO subieron a Nv 3 — aunque el preset de
  eventos de Sesión 2 incluía "Subida a Nivel 3", eso aún no ocurrió en mesa.
- 5 jugadores: Rac, Relyo, Tyrell, Boyd, Esdas.

Fuentes de verdad de la narrativa (documentos del DM, en `../`):
`Ardaetheros_Personajes_V1.md`, `_NPCs_V1.md`, `_Monstruos_V1.md`,
`_Lugares_V1.md`, `_Eventos_V1.md`. Toda esa data ya fue volcada a `data.js`.

---

## Pendientes discutidos (TODO)

### En código (buscar `// TODO` en data.js)
- **`TODO subclass`** (×5): features de subclase por personaje. Las opciones están
  listadas en `levelFeatures` pero los features concretos se agregan cuando el
  jugador elija orgánicamente. Ver `../EVOLUCION_PERSONAJES.md`.
- **`TODO cantrip-progression`** (Boyd, Esdas): templates ya escritos inline en
  `cantripsData` de cada uno — basta con descomentar y mover al array cuando
  el jugador llegue a Nv 4 / Nv 10 y elija qué cantrip aprender.
- **`TODO magic-items`**: sistema de items mágicos completo (rarity, attunement,
  charges). Hoy el inventario son strings simples.

### Carga de datos pendiente (de mesa)
- **Eventos reales de Sesión 2:** la S2 salió corta y muy narrativa (conocer NPCs
  en Aether Grove), distinta a lo planeado. Hay que cargar/ajustar los eventos de
  lo que REALMENTE pasó en mesa — los presets de S2 en `data.js` son la versión
  planeada, no la jugada. Recordar: **los jugadores NO subieron a Nv 3 todavía**,
  así que el evento "Subida a Nivel 3" no debe quedar como "Hecho".

### Features mayores sin construir
- **Historia data-driven:** `page-story` es HTML estático de Sesión 1. Idea: que
  se alimente de los eventos "Hecho" de Campaña (cerrar el ciclo Sesión Live →
  Historia). Esto se mencionó como "Fase 3".
- **Subir de nivel no automatiza features:** el botón sube HP/prof/slots pero
  los features de subclase, ASIs y cantrips nuevos se agregan a mano (por diseño,
  ver filosofía orgánica).

### Mecanismos identificados para Nv 3 (en EVOLUCION_PERSONAJES.md)
- Sistema de Disciplines del Monje (solo si Relyo elige Four Elements)

### Sistema de condiciones D&D 5E — pendientes de implementación mecánica

Los 15 estados están definidos en `data.js` (array `CONDITIONS`) con nombre EN/ES, ícono,
color y campo `mechanical` con sus efectos. **Solo Restrained tiene mecánica activa** en el
combat tracker. Los demás muestran el badge visual pero no afectan los cálculos todavía.

**Mecánica activa implementada:**
- ✅ **Restrained** — Velocidad 0, ataques contra él con ventaja, sus ataques con desventaja,
  sus DEX saves con desventaja. Se aplica automáticamente al fallar el save de un spell con
  `effect.targetConditionOnFail:'restrained'`.
- ✅ **Concentración** — Badge especial `◎ Spell (Xr)`. CON save automático al recibir daño
  (DC = max 10, daño÷2). Se rompe al lanzar otro spell de concentración. Romper concentración
  quita todas las condiciones vinculadas en los targets.

**Mecánica TODO para los 14 restantes:**
Cada uno requiere hookear los forms de acción y save para mostrar advertencias y modificar
automáticamente las tiradas. El campo `mechanical` en `CONDITIONS` ya define qué debe
implementarse para cada uno:

| Condición | Efecto mecánico a implementar |
|-----------|-------------------------------|
| Blinded | Desventaja en ataques propios; ventaja en ataques contra él |
| Charmed | Bloquear ataques al encantador; ventaja en checks sociales |
| Deafened | Solo informativo (sin mecánica de combate directa) |
| Exhaustion | 6 niveles — requiere tracker de nivel separado |
| Frightened | Desventaja si origen en LOS; bloquear movimiento hacia origen |
| Grappled | Velocidad 0 |
| Incapacitated | Bloquear acciones y reacciones |
| Invisible | Ventaja en ataques propios; desventaja en ataques contra él |
| Paralyzed | Todo de Incapacitated + velocidad 0 + falla STR/DEX saves + crits automáticos melee |
| Petrified | Todo de Paralyzed + resistencia a todo daño |
| Poisoned | Desventaja en ataques y ability checks |
| Prone | Desventaja en ataques propios; ventaja melee contra él; desventaja ranged contra él |
| Stunned | Todo de Incapacitated + falla STR/DEX saves + ventaja en ataques contra él |
| Unconscious | Todo de Paralyzed + prone |

**Regla de duración (house rule acordada):**
- Duración se mide en **rounds** (no en turnos individuales)
- `turnsLeft` baja 1 en `advanceRound()` (cuando todos los combatientes actuaron)
- 1 minuto = 10 rounds, 10 minutos = 100 rounds
- Concentración se puede soltar voluntariamente en cualquier turno del caster

**Nota sobre el form de acción cuando hay condiciones activas:**
Cuando un combatiente tiene condiciones, el form de acción debería mostrar advertencias
automáticas (ej: "⚠ objetivo está Restrained → tus ataques tienen ventaja") y en el futuro
aplicar automáticamente ventaja/desventaja a las tiradas. Por ahora es solo visual/informativo.

### Combat tracker — mejoras de acción (acordadas, a implementar)

**B. Múltiples objetivos**
- En cualquier acción (jugador o NPC), permitir seleccionar varios objetivos
  simultáneamente (todos los combatientes vivos son candidatos, incluyendo aliados
  para curación). La mayoría de las veces se elige uno; para efectos de zona (Fireball,
  Enredar, etc.) se eligen varios.
- El daño/efecto se aplica a cada objetivo por separado.

**C. Save throws por objetivo**
- Si la acción tiene `saveType` (STR/DEX/CON/INT/WIS/CHA) y `saveDC`, mostrar para
  cada objetivo seleccionado un campo de tirada de save.
- La app decide pass/fail comparando el roll + stat mod del objetivo vs DC.
- Si el objetivo es un personaje del grupo, el stat mod se lee del preset.
  Si es monstruo del bestiario, se lee de `PRESET_MONSTERS[].saves` (o stat base).
- El DM puede override el resultado (pass→fail o fail→pass) para efecto narrativo.
- Siempre hay campo de notas.
- **Fórmula de Spell Save DC:** `8 + profBonus + spellcastingMod`. Se calcula
  automáticamente para cada personaje (los spellcasting stats son:
  rac→STR, relyo→WIS, tyrell→CHA, boyd→WIS, esdas→INT). DM puede editarla.

**B. Múltiples objetivos**
- En cualquier acción (jugador o NPC), permitir seleccionar varios objetivos
  simultáneamente (todos los combatientes vivos son candidatos, incluyendo aliados
  para curación). La mayoría de las veces se elige uno; para efectos de zona (Fireball,
  Enredar, etc.) se eligen varios.
- El daño/efecto se aplica a cada objetivo por separado.

**C. Save throws por objetivo**
- Si la acción tiene `saveType` (STR/DEX/CON/INT/WIS/CHA) y `saveDC`, mostrar para
  cada objetivo seleccionado un campo de tirada de save.
- La app decide pass/fail comparando el roll + stat mod del objetivo vs DC.
- Si el objetivo es un personaje del grupo, el stat mod se lee del preset.
  Si es monstruo del bestiario, se lee de `PRESET_MONSTERS[].saves` (o stat base).
- El DM puede override el resultado (pass→fail o fail→pass) para efecto narrativo.
- Siempre hay campo de notas.
- **Fórmula de Spell Save DC:** `8 + profBonus + spellcastingMod`. Se calcula
  automáticamente para cada personaje (los spellcasting stats son:
  rac→STR, relyo→WIS, tyrell→CHA, boyd→WIS, esdas→INT). DM puede editarla.

---

## DONE (cambios completados — referencia histórica)

Esta sección lista lo que ya se implementó y se sacó del TODO. Mantenida por
fecha aproximada de implementación para que cada cosa quede rastreable.

### Items — catálogo global + armas estructuradas + auto-fill en combate
- ✅ **`ITEMS` array en `data.js`**: 18 armas (Greataxe, Handaxe, Longsword, Shortsword,
  Quarterstaff, Dagger, Spear, Mace, Warhammer, Rapier, Unarmed, Martial Arts Strike,
  Shortbow, Longbow, Light Crossbow, Scimitar, Sickle) + 4 items de campaña (loot/quest).
  Cada arma tiene `damage`, `damageType`, `atkStat`, `dmgStat`, `proficient`, `properties`, `range`.
- ✅ **`equipment` en cada preset** (`CLASS_PRESETS[char].equipment`): array `{itemId, equipped}`.
  Rac→Greataxe+Handaxe, Relyo→Quarterstaff+Martial Arts, Tyrell→Shortsword, Boyd→Dagger, Esdas→Dagger.
- ✅ **`getEquippedWeapons(charId)`** y **`getItem(id)`** helpers en `data.js`.
- ✅ **Auto-fill en form de acción jugador** (melee/ranged): dropdown de armas equipadas →
  seleccionar rellena `modifier` (abilityMod + profBonus, respeta finesse/monk), `damageDice`,
  `damageType`. Todo editable.
- ✅ **Auto-fill en form de Acción NPC**: dropdown de ataques del monstruo → selecciona →
  rellena `modifier` (parseado del campo `bonus`), `damageDice` y `damageType` (parseado
  del campo `dmg`, incluyendo traducción español→inglés de tipos de daño). Si el monstruo
  tiene un solo ataque, se pre-selecciona automáticamente.
- ✅ **Nueva tab "Items"** (`page-items`): catálogo visual filtrable por categoría
  (Todos/Armas/Mágicos/Loot/Quest/Misc) + búsqueda por texto. Cards con pills de dado,
  tipo de daño, stat y propiedades. Badge que indica qué personajes llevan el ítem equipado.
- ✅ **`js/items.js`** + **`css/items.css`** nuevos.

### Sesión Live — combat tracker overhaul completo
- ✅ **"+ Todos los jugadores"** (`addAllPlayersToCombat`): agrega todos los presentes
  de una vez, sin duplicar los que ya están.
- ✅ **Form de inicio de combate:** al clickear "Iniciar combate" aparece un textarea
  inline para describir la escena. `confirmStartCombat()` guarda la nota y arranca
  el combate. No hay combate sin contexto narrativo.
- ✅ **Marcador visual "ya actuó"** (`actedThisRound` flag por combatiente): los que
  ya actuaron en el round tienen opacidad reducida (`.has-acted`) y muestran badge ✓.
- ✅ **Click para actuar:** cada combatiente vivo y sin actuar muestra dos botones:
  - ⚔ (`actCombatant`): abre form de acción jugador (pre-seleccionado) o form de
    Acción NPC para monstruos.
  - ⏭ (`skipCombatant`): abre form de "Saltar turno" (textarea de notas + marca actuado).
- ✅ **Acción NPC (`renderNpcActionForm`):** form completo para monstruos — tipo de
  ataque, objetivo, d20+mod vs AC, dado de daño opcional, apply-damage automático.
  Nota en stream con ícono 👹 y borde rojo.
- ✅ **Auto-advance de round** (`checkRoundComplete` → `advanceRound`): cuando todos
  los combatientes vivos actuaron, el round avanza automáticamente, se resetean flags
  y se empuja nota.
- ✅ **Contador de rounds** en el header del tracker activo: número grande de round,
  contador "X sin actuar / Y actuaron", estado visual.
- ✅ **"Forzar round"** (`forceNextRound`): botón de escape para cuando alguien murió
  o huyó sin actuar y el auto-advance no dispara.
- ✅ **`triggeringCombatantId`** en `currentForm.data`: los forms de acción y NPC
  llaman `markActed()` al guardar, encadenando el flujo correctamente.

### Sesión Live — stream agrupado por capítulos narrativos
- ✅ **Cada nota no-narrativa lleva `narrativeId`** apuntando a la narrativa activa
  al momento de ser creada. Se inyecta automáticamente en `pushNote()`.
- ✅ **Migración automática** (`migrateNarrativeLinks`): notas viejas sin el campo
  reciben el id de la narrativa cronológicamente anterior. Solo escribe si necesario.
- ✅ **Stream renderizado en capítulos** (`buildGroupedStream`):
  - Cada narrativa es un **header de capítulo** (dorado, con título y texto del evento).
  - Sus notas hijo (acciones, conversaciones, combates) aparecen indentadas debajo.
  - Notas sin narrativa vinculada → sección colapsada "Sin evento narrativo" al tope.
  - **Narrativa sin hijos → badge "Solo narrativo"** (indicador visual de que fue un
    evento puramente narrativo sin acciones ni combates asociados).
- ✅ **Borrar una narrativa con hijos:** los hijos pasan a "Sin evento narrativo"
  (narrativeId apunta a un id inexistente → caen al bucket pre-narrativa).

### Sesión Live — "Presentes" como tarjetas + modal de hoja
- ✅ **Input de texto "Presentes" reemplazado por tarjetas clickeables** (estilo
  overview-card). Cada tarjeta tiene un toggle ☑/☐ para marcar presente/ausente
  y al clickear el cuerpo abre un modal con la hoja del personaje.
- ✅ **Modal de hoja reusa el nodo real.** `openCharSheetModal(c)` MUEVE el
  nodo `#char-<id>` al `#charModalBody` (recordando `originalParent` y
  `originalNextSibling`) y `closeCharSheetModal()` lo devuelve. Sin duplicar
  estado ni clonar ids — cualquier cambio en el modal escribe a la hoja real.
- ✅ **Auto-close en navegación.** `showPage()` cierra el modal si está abierto
  antes de cambiar de tab (evita que el nodo quede huérfano en el modal).
- ✅ **Estado de presencia persistido en `meta.presentChars` (array).** Default:
  todos presentes. `meta.present` (string legacy) se mantiene sincronizado para
  compatibilidad con finalize/exports.
- ✅ **HP en tarjetas refresca automáticamente** desde combat tracker, rest
  grupal y level-up grupal.

### Sesión Live — conversaciones multi-turno
- ✅ **`+ NPC habla` → `+ Conversación`.** Nuevo tipo de nota `conversation` con
  array de `exchanges` (cada uno con `speakerKind` npc/char/narrator/group +
  `speaker` id + `text`). El form permite agregar/borrar/reordenar líneas;
  el dropdown de speaker incluye los 19 NPCs, los 5 personajes, narrador y
  "el grupo" (coral). Soporta "Otro NPC" con campo de nombre libre por línea.
  Render en stream: bubbles alternadas (NPC izquierda, Personaje derecha,
  narrador centrado en cursiva). Notas viejas tipo `npc` siguen renderizando
  con el modelo legacy (un único dialogue+reaction).

### Sesión Live — header y acciones grupales
- ✅ **Ubicación actual del grupo en el header.** Dropdown de `CAMPAIGN.locations`
  + input de detalle libre. Persistido en `LIVE_SESSION.meta.locationId` y
  `meta.locationDetail`. En `live.js` (`renderLiveHeader`) y `live.css`.
- ✅ **Acciones grupales en el header.** `groupShortRest()`, `groupLongRest()`,
  `groupLevelUp()` en `live.js`. Iteran sobre `CHARS`, una sola confirmación,
  dejan nota automática en el stream. No reemplazan a las individuales por hoja.

### Mecanismos D&D Nv 3
- ✅ **`TODO subclass-resource`: Channel Divinity (Tyrell).** Recurso en
  `tyrell.resources` con `restoresOn:'short'`. `getResourceMax()` devuelve 1 si
  level ≥ 3, sino 0 (el renderer ya esconde recursos con max 0, así que aparece
  solo al subir a Nv 3).
- ✅ **`TODO boyd-flight`: Vuelo racial Owlin.** Campo `speed:{walk:30,fly:30}`
  en `boyd` preset + `campaignNotes` con las reglas. HTML del char-boyd
  actualizado para mostrar las dos velocidades.
- ✅ **`alwaysPrepared`/`circleSpell` flag.** Nuevos campos opcionales en spells:
  `alwaysPrepared: true`, `alwaysPreparedAt: <nivel>`, `circleSpell: '<label>'`.
  `isSpellPrepared()` los respeta automáticamente cuando el char alcanza el
  unlock level. El renderer muestra una `★` en lugar del toggle y un badge
  dorado con el origen (ej: "Land (Bosque) ★"). Aplicado a los Land Spells de
  Boyd (Barkskin/Spider Climb @ Nv 3, Call Lightning/Plant Growth @ Nv 5,
  Freedom of Movement @ Nv 7, Tree Stride/Commune with Nature @ Nv 9).
- ✅ **Spider Climb (Boyd).** Hechizo Nv 2 agregado al `spellList` de boyd,
  marcado como Land Spell de Bosque (always-prepared a Nv 3).
- ✅ **Templates de `cantrip-progression`.** Para Boyd y Esdas, los templates
  comentados (Nv 4 y Nv 10) están escritos inline en `cantripsData`. Cuando
  el jugador elija en mesa, descomentar y mover al array.

---

## Notas para editar este proyecto

- **Agregar un NPC:** sumar entrada al array `NPCS` en data.js. El render es
  automático. Las notas DM y retrato persisten por id.
- **Agregar un monstruo:** sumar a `PRESET_MONSTERS`. La migración lo inserta en
  caches existentes. Loot: usar `minRoll` (0 = garantizado, 20 = solo nat 20).
- **Agregar evento/hilo/lugar:** sumar al `DEFAULT_CAMPAIGN_*` correspondiente.
  Migración automática. Mantener `id` único y estable.
- **Agregar hechizo/feature a un personaje:** editar su entrada en `CLASS_PRESETS`.
- **Nunca usar `import/export`** (rompe en `file://`). Funciones globales.
- **Respetar el prefijo `ard_`** en localStorage para no perder datos del usuario.
- **No romper el orden de carga** de `<script>`/`<link>`.
- El archivo monolítico original quedó en `../Ardaetheros_Campaign.html` (raíz de
  D&D) como referencia/backup. El proyecto activo es **`pagina_web/`**.
