# Graph Report - D&D  (2026-10-30)

## Corpus Check
- 59 files · ~79,497 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 912 nodes · 2082 edges · 59 communities (45 shown, 14 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 239 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1fc24189`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Character Abilities & Stats|Character Abilities & Stats]]
- [[_COMMUNITY_Campaign Events & Locations|Campaign Events & Locations]]
- [[_COMMUNITY_World Lore & Narrative|World Lore & Narrative]]
- [[_COMMUNITY_Live Session Combat (Core)|Live Session Combat (Core)]]
- [[_COMMUNITY_Live Session Combat (AddManage)|Live Session Combat (Add/Manage)]]
- [[_COMMUNITY_DB Migration Scripts|DB Migration Scripts]]
- [[_COMMUNITY_DM Auth & Role System|DM Auth & Role System]]
- [[_COMMUNITY_Spell Slots & Resources|Spell Slots & Resources]]
- [[_COMMUNITY_DB Seed & Init|DB Seed & Init]]
- [[_COMMUNITY_Conversation & Exchange UI|Conversation & Exchange UI]]
- [[_COMMUNITY_REST API Routes|REST API Routes]]
- [[_COMMUNITY_Character State Sync (CHAR_STATE)|Character State Sync (CHAR_STATE)]]
- [[_COMMUNITY_NPC & Bestiary Data|NPC & Bestiary Data]]
- [[_COMMUNITY_Player Accounts & Notes|Player Accounts & Notes]]
- [[_COMMUNITY_Items Catalog|Items Catalog]]
- [[_COMMUNITY_Money & Economy|Money & Economy]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]

## God Nodes (most connected - your core abstractions)
1. `renderActionForm()` - 54 edges
2. `saveLiveSession()` - 45 edges
3. `saveActionNote()` - 44 edges
4. `getCombatant()` - 42 edges
5. `liveEscape()` - 41 edges
6. `save()` - 40 edges
7. `renderNoteForm()` - 36 edges
8. `load()` - 35 edges
9. `getCharLevel()` - 31 edges
10. `pushNote()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `connectDB()` --semantically_similar_to--> `seed()`  [INFERRED] [semantically similar]
  db/connect.js → db/seed.js
- `seed()` --references--> `CampaignEventSchema`  [EXTRACTED]
  db/seed.js → models/CampaignEvent.js
- `seed()` --references--> `CampaignThreadSchema`  [EXTRACTED]
  db/seed.js → models/CampaignThread.js
- `seed()` --references--> `NpcSchema`  [EXTRACTED]
  db/seed.js → models/Npc.js
- `Render.com deploy config` --references--> `app`  [EXTRACTED]
  render.yaml → server.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **seed.js populates all Mongoose model collections in one script** — db_seed_seed, models_item_itemschema, models_condition_conditionschema, models_npc_npcschema, models_monster_monsterschema, models_campaignevent_campaigneventschema, models_campaignthread_campaignthreadschema, models_campaignlocation_campaignlocationschema, models_classpreset_classpresetschema, models_campaignstate_campaignstateschema, models_story_storyschema [EXTRACTED 1.00]
- **DM and Player auth guards protect API routes via session checks** — middleware_requiredm_requiredm, middleware_requireplayer_requireplayer, concept_dm_auth_guard, concept_player_auth_guard [INFERRED 0.85]
- **Spell slot system: CLASS_PRESETS → getSpellSlotsForLevel → loadSlotState → consumeSpellSlot** — data_classpresets_classpresets, js_data_getspellslotsforlevel, js_abilities_loadslotstate, js_abilities_consumespellslot [EXTRACTED 0.95]
- **Auth gate: checkDMSession → setDMMode/setPlayerSession → unlockApp/showAppGate** — js_dmauth_checkdmsession, js_dmauth_setdmmode, js_dmauth_unlockapp, js_dmauth_showappgate [EXTRACTED 1.00]
- **Dual persistence: localStorage write triggers API sync (DM only)** — js_storage_save, js_storage_maybeSyncToApi, js_storage_synccharstate, js_storage_syncmoney [EXTRACTED 1.00]
- **Live session sync: DM save → socket emit → server relay → player receive → render** — js_live_savelivesession, js_socketclient_socket, server_livecache, js_socketclient_applysessionsync [EXTRACTED 1.00]

## Communities (59 total, 14 thin omitted)

### Community 0 - "Character Abilities & Stats"
Cohesion: 0.10
Nodes (23): renderAllAbilities(), fetchAPI(), initApp(), loadCharState(), loadReferenceData(), changeMoneyCoin(), COIN_TYPES, getMoney() (+15 more)

### Community 1 - "Campaign Events & Locations"
Cohesion: 0.08
Nodes (22): ABILITY_SCORES, _ABILITY_SCORES_FALLBACK, AC_FORMULA, CHARS, CLASS_PRESETS, CONCENTRATION_META, CONDITIONS, DEFAULT_CAMPAIGN_EVENTS (+14 more)

### Community 2 - "World Lore & Narrative"
Cohesion: 0.08
Nodes (42): addCampaignEvent(), addCampaignLocation(), addCampaignThread(), addWildShapeForm(), API, attachDragHandlers(), bindDragFromHandleOnly(), CAMPAIGN (+34 more)

### Community 3 - "Live Session Combat (Core)"
Cohesion: 0.10
Nodes (27): attachDragHandlers(), bindDragFromHandleOnly(), campaign.js, _clearDirty(), Dirty-tracking system (_dirty, _isNew, _orderDirty), discardOrder(), initCampaign(), live.js (+19 more)

### Community 4 - "Live Session Combat (Add/Manage)"
Cohesion: 0.05
Nodes (31): ABILITY_META, blowDamage(), blowOutcome(), CASTING_LABEL, CHAR_CLASS_ABILITIES, checkMonsterThresholds(), closeCharSheetModal(), combatantCardClick() (+23 more)

### Community 5 - "DB Migration Scripts"
Cohesion: 0.19
Nodes (17): changeMonsterHP(), deleteMonster(), filterMonsters(), _hpSyncTimers, loadMonsters(), MONSTERS, renderMonsters(), resetMonsterHP() (+9 more)

### Community 6 - "DM Auth & Role System"
Cohesion: 0.07
Nodes (22): mongoose, Session, mongoose, StoryAct, acts, chapters, mongoose, seedStory() (+14 more)

### Community 7 - "Spell Slots & Resources"
Cohesion: 0.14
Nodes (27): addBuff(), addDeathFailures(), applyDamage(), applyPCDamage(), canTakeTurn(), getBuffs(), getCombatantHP(), getCombatantName() (+19 more)

### Community 8 - "DB Seed & Init"
Cohesion: 0.06
Nodes (42): Socket.IO live session relay pattern, connectDB(), mongoose, checkDMSession(), dmLogout(), lockApp(), setDMMode(), setSessionIndicator() (+34 more)

### Community 9 - "Conversation & Exchange UI"
Cohesion: 0.07
Nodes (28): requireDM middleware, requirePlayer middleware, CampaignState, Player, POST/GET/DELETE /api/players, GET/PUT /api/players/me/notes, POST /api/sessions/:number/notes, PUT /api/state/character/:charId (+20 more)

### Community 10 - "REST API Routes"
Cohesion: 0.10
Nodes (31): actCombatant(), addExchangeLine(), attackOutcome(), getAttackCA(), getCombatantAC(), getCombatantHPMax(), getDefaultFormData(), isNat1() (+23 more)

### Community 11 - "Character State Sync (CHAR_STATE)"
Cohesion: 0.15
Nodes (28): schoolBadge(), calcSpellAttackMod(), calcSpellSaveDC(), getCantripDamageDice(), getCondition(), buffCasterKey(), cantripRequiresAttack(), castingTag() (+20 more)

### Community 12 - "NPC & Bestiary Data"
Cohesion: 0.07
Nodes (20): CampaignEvent, CampaignLocation, CampaignState, CampaignThread, ClassPreset, Condition, conds, events (+12 more)

### Community 13 - "Player Accounts & Notes"
Cohesion: 0.20
Nodes (14): liveEscape(), renderActionNoteBody(), renderCombatForm(), renderConversationForm(), renderConversationNoteBody(), renderLootForm(), renderLootRollRow(), renderNarrativeChapterHeader() (+6 more)

### Community 14 - "Items Catalog"
Cohesion: 0.10
Nodes (19): dependencies, dotenv, express, express-session, mongoose, socket.io, description, devDependencies (+11 more)

### Community 15 - "Money & Economy"
Cohesion: 0.25
Nodes (11): dmgTypeOptions(), getMaxAttacks(), isNpcSaveMode(), renderAttackBlock(), renderAutoDamageBlock(), renderEconomyChips(), renderHitOverride(), renderNpcActionForm() (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (14): Singleton Document Pattern, seed(), CampaignLocationSchema, { Schema, model }, CampaignStateSchema, { Schema, model }, ClassPresetSchema, { Schema, model } (+6 more)

### Community 17 - "Community 17"
Cohesion: 0.26
Nodes (14): CATEGORY_LABELS, clearItemForm(), deleteItem(), filterItems(), initItems, initItems(), openEditItem(), renderItemCard() (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (11): CampaignEvent.order, fixSessionDates.js, fixStoryActsS3.js, reorderEvents.js, updateS2S3.js, CampaignEvent, Session, StoryAct (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (17): CampaignLocation.order, CampaignThread.order, crudRouter (crudFactory), crudFactory sort param, fetchAPI(), init.js, loadCharState(), loadReferenceData() (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.28
Nodes (13): getItem(), calcWeaponAttackMod(), calcWeaponDamageBonus(), charBuffBonus(), diceOnly(), isMonkWeapon(), normalizeDamageType(), parseDamageBonus() (+5 more)

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (5): CampaignEvent, mongoose, ORDER, CampaignEventSchema, { Schema, model }

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (4): DM Authentication Guard, Player Authentication Guard, requireDM(), requirePlayer()

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (40): API de datos (`/api`), Archivos clave, Ardaetheros — Compañero de Campaña D&D 5E, Arquitectura general, Campos de mecánica en los hechizos (`db/seed-data/class-presets.js`), Clases CSS, Comunidades principales (navegación rápida), Convenciones importantes (+32 more)

### Community 24 - "Community 24"
Cohesion: 0.53
Nodes (4): applyImage(), closeImageModal(), openImageModal(), setPortrait()

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (4): PlayerSchema, { Schema, model }, Player, { Router }

### Community 26 - "Community 26"
Cohesion: 0.40
Nodes (5): checkDMSession, setDMMode, setSessionIndicator, showAppGate, unlockApp

### Community 27 - "Community 27"
Cohesion: 0.07
Nodes (27): Ardaetheros — Compañero de Campaña D&D 5E, Carga de datos pendiente (de mesa), Combat tracker — mejoras de acción (acordadas, a implementar), Convenciones de localStorage (prefijo `ard_`), Cómo correrlo, data.js — el corazón de los datos, DONE (cambios completados — referencia histórica), En código (buscar `// TODO` en data.js) (+19 more)

### Community 28 - "Community 28"
Cohesion: 0.60
Nodes (4): applyHPSync(), applySessionSync(), isLivePageActive(), _socket

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (26): applyConcentration(), applyCondition(), attackDamageBreakdown(), breakConcentration(), cancelStartCombat(), changeCombatantHP(), changeWildShapeHP(), clearDodge() (+18 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (22): ABILITY_KEYS, ASI_FORM, ASI_LEVELS, changeResourcePool(), getMaxSpellLevel(), isCantripActive(), loadResourceState(), longRest() (+14 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (22): applyASI(), asiChanges(), closeScoresEditor(), fmtMod(), getASIForm(), getASIState(), getPendingASI(), nextASILevel() (+14 more)

### Community 33 - "Community 33"
Cohesion: 0.35
Nodes (11): applyLevelUp(), levelUpCharacter(), setAbilityScores(), changeVital(), updateHP(), getHPMax(), hitDieAvg(), hpGainOnLevelUp() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (9): archivedSessionLabel(), checkArchivedSessionNumber(), fetchArchivedSession(), finalizeSession(), onSessionNumberInput(), renderArchivedWarning(), renderLiveHeader(), updateLiveMeta() (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (16): localStorage ↔ MongoDB dual persistence, saveNotes(), toggleCondition(), commitToSchool(), applyHPSync, _CHAR_STATE_FIELDS, _CHAR_SYNC_PREFIXES, _charFromStateKey() (+8 more)

### Community 46 - "Community 46"
Cohesion: 0.21
Nodes (21): consumeSpellSlot(), getCharSaveBonus(), getCharSkillBonus(), isSpellPrepared(), loadSlotState(), abilityMod(), getCharLevel(), getCharProfBonus() (+13 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (16): buffMaxTargets(), computeSleep(), ensureRays(), getAliveMonsters(), missileCount(), missileDamagePerDart(), rayCount(), renderBuffBlock() (+8 more)

### Community 48 - "Community 48"
Cohesion: 0.47
Nodes (9): addItem(), delItem(), _getInventory(), renderInventory(), _setInventory(), toggleInvTransfer(), transferItem(), assignSingleLoot() (+1 more)

### Community 50 - "Community 50"
Cohesion: 0.50
Nodes (3): Item known field — player visibility control, ItemSchema, { Schema, model }

### Community 53 - "Community 53"
Cohesion: 0.16
Nodes (18): advanceRound(), beginTurn(), confirmStartCombat(), endRageBtn(), endTurn(), forceNextRound(), getCurrentCombatant(), getTurnOrder() (+10 more)

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (17): buildGroupedStream(), closeNoteForm(), getCurrentNarrativeId(), groupLevelUp(), groupLongRest(), groupShortRest(), nowIso(), nowTime() (+9 more)

### Community 55 - "Community 55"
Cohesion: 0.27
Nodes (10): addAdhocMonster(), addAllPlayersToCombat(), addMonsterFromBestiary(), addPlayerToCombat(), closeMonsterPicker(), newId(), newPlayerCombatant(), openPlayerPicker() (+2 more)

### Community 56 - "Community 56"
Cohesion: 0.40
Nodes (6): initApp(), loadStory(), renderStory(), GET /api/story, Story 'Capítulo' chapter label, story.js

### Community 57 - "Community 57"
Cohesion: 0.50
Nodes (5): defaultSlotLevel(), getAttackRiders(), getSlotOptions(), isWeaponAttack(), renderAttackRiders()

### Community 58 - "Community 58"
Cohesion: 0.50
Nodes (4): getAlivePlayers(), getHealTargets(), renderCombatantsTargetPicker(), renderHealBlock()

## Knowledge Gaps
- **230 isolated node(s):** `version`, `configurations`, `bgIsolation`, `allow`, `mongoose` (+225 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 9 inferred relationships involving `renderActionForm()` (e.g. with `schoolBadge()` and `calcSpellAttackMod()`) actually correct?**
  _`renderActionForm()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `saveActionNote()` (e.g. with `consumeSpellSlot()` and `abilityMod()`) actually correct?**
  _`saveActionNote()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `version`, `configurations`, `bgIsolation` to the rest of the system?**
  _233 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Character Abilities & Stats` be split into smaller, more focused modules?**
  _Cohesion score 0.10080645161290322 - nodes in this community are weakly interconnected._
- **Should `Campaign Events & Locations` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `World Lore & Narrative` be split into smaller, more focused modules?**
  _Cohesion score 0.08067375886524823 - nodes in this community are weakly interconnected._
- **Should `Live Session Combat (Core)` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._