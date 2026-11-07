# Graph Report - D&D  (2026-11-06)

## Corpus Check
- 59 files · ~83,957 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 964 nodes · 2241 edges · 56 communities (42 shown, 14 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 254 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4dc34061`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Character Abilities & Stats|Character Abilities & Stats]]
- [[_COMMUNITY_Community 1|Community 1]]
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
- [[_COMMUNITY_Community 15|Community 15]]
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

## God Nodes (most connected - your core abstractions)
1. `renderActionForm()` - 56 edges
2. `saveActionNote()` - 46 edges
3. `saveLiveSession()` - 45 edges
4. `getCombatant()` - 42 edges
5. `save()` - 42 edges
6. `liveEscape()` - 41 edges
7. `load()` - 38 edges
8. `renderNoteForm()` - 36 edges
9. `renderCharAbilities()` - 34 edges
10. `getCharLevel()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `connectDB()` --semantically_similar_to--> `seed()`  [INFERRED] [semantically similar]
  db/connect.js → db/seed.js
- `seed()` --references--> `CampaignEventSchema`  [EXTRACTED]
  db/seed.js → models/CampaignEvent.js
- `seed()` --references--> `CampaignThreadSchema`  [EXTRACTED]
  db/seed.js → models/CampaignThread.js
- `seed()` --references--> `NpcSchema`  [EXTRACTED]
  db/seed.js → models/Npc.js
- `submitPlayerLogin()` --references--> `player-login endpoint`  [EXTRACTED]
  public/js/players.js → routes/auth.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **seed.js populates all Mongoose model collections in one script** — db_seed_seed, models_item_itemschema, models_condition_conditionschema, models_npc_npcschema, models_monster_monsterschema, models_campaignevent_campaigneventschema, models_campaignthread_campaignthreadschema, models_campaignlocation_campaignlocationschema, models_classpreset_classpresetschema, models_campaignstate_campaignstateschema, models_story_storyschema [EXTRACTED 1.00]
- **DM and Player auth guards protect API routes via session checks** — middleware_requiredm_requiredm, middleware_requireplayer_requireplayer, concept_dm_auth_guard, concept_player_auth_guard [INFERRED 0.85]
- **Spell slot system: CLASS_PRESETS → getSpellSlotsForLevel → loadSlotState → consumeSpellSlot** — data_classpresets_classpresets, js_data_getspellslotsforlevel, js_abilities_loadslotstate, js_abilities_consumespellslot [EXTRACTED 0.95]
- **Auth gate: checkDMSession → setDMMode/setPlayerSession → unlockApp/showAppGate** — js_dmauth_checkdmsession, js_dmauth_setdmmode, js_dmauth_unlockapp, js_dmauth_showappgate [EXTRACTED 1.00]
- **Dual persistence: localStorage write triggers API sync (DM only)** — js_storage_save, js_storage_maybeSyncToApi, js_storage_synccharstate, js_storage_syncmoney [EXTRACTED 1.00]
- **Live session sync: DM save → socket emit → server relay → player receive → render** — js_live_savelivesession, js_socketclient_socket, server_livecache, js_socketclient_applysessionsync [EXTRACTED 1.00]

## Communities (56 total, 14 thin omitted)

### Community 0 - "Character Abilities & Stats"
Cohesion: 0.10
Nodes (23): renderAllAbilities(), fetchAPI(), initApp(), loadCharState(), loadReferenceData(), changeMoneyCoin(), COIN_TYPES, getMoney() (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (25): getCharSaveBonus(), getCharSkillBonus(), abilityMod(), getCharLevel(), getCharProfBonus(), getMartialArtsDie(), getRageDamageBonus(), getResourceMax() (+17 more)

### Community 2 - "World Lore & Narrative"
Cohesion: 0.06
Nodes (66): addCampaignEvent(), addCampaignLocation(), addCampaignThread(), addWildShapeForm(), API, attachDragHandlers(), bindDragFromHandleOnly(), CAMPAIGN (+58 more)

### Community 3 - "Live Session Combat (Core)"
Cohesion: 0.10
Nodes (27): attachDragHandlers(), bindDragFromHandleOnly(), campaign.js, _clearDirty(), Dirty-tracking system (_dirty, _isNew, _orderDirty), discardOrder(), initCampaign(), live.js (+19 more)

### Community 4 - "Live Session Combat (Add/Manage)"
Cohesion: 0.06
Nodes (17): ABILITY_META, CASTING_LABEL, CHAR_CLASS_ABILITIES, DMG_TYPE_ES, DMG_TYPES, EXTRA_ATTACK_CHARS, getPresentChars(), isCharPresent() (+9 more)

### Community 5 - "DB Migration Scripts"
Cohesion: 0.19
Nodes (17): changeMonsterHP(), deleteMonster(), filterMonsters(), _hpSyncTimers, loadMonsters(), MONSTERS, renderMonsters(), resetMonsterHP() (+9 more)

### Community 6 - "DM Auth & Role System"
Cohesion: 0.07
Nodes (22): mongoose, Session, mongoose, StoryAct, acts, chapters, mongoose, seedStory() (+14 more)

### Community 7 - "Spell Slots & Resources"
Cohesion: 0.16
Nodes (19): localStorage ↔ MongoDB dual persistence, consumeSpellSlot(), loadSlotState(), _patchCharStateSlot(), toggleSpellSlot(), saveNotes(), toggleCondition(), applyHPSync (+11 more)

### Community 8 - "DB Seed & Init"
Cohesion: 0.10
Nodes (28): checkDMSession(), dmLogout(), lockApp(), setDMMode(), setSessionIndicator(), showAppGate(), submitGateToken(), unlockApp() (+20 more)

### Community 9 - "Conversation & Exchange UI"
Cohesion: 0.07
Nodes (28): requireDM middleware, requirePlayer middleware, CampaignState, Player, POST/GET/DELETE /api/players, GET/PUT /api/players/me/notes, POST /api/sessions/:number/notes, PUT /api/state/character/:charId (+20 more)

### Community 10 - "REST API Routes"
Cohesion: 0.12
Nodes (17): actCombatant(), addExchangeLine(), getDefaultFormData(), moveExchangeLine(), openLiveLootForm(), openNoteForm(), overrideTargetSave(), removeExchangeLine() (+9 more)

### Community 11 - "Character State Sync (CHAR_STATE)"
Cohesion: 0.08
Nodes (45): schoolBadge(), calcSpellAttackMod(), calcSpellSaveDC(), getCantripDamageDice(), getCondition(), applyCondition(), buffMaxTargets(), cantripRequiresAttack() (+37 more)

### Community 12 - "NPC & Bestiary Data"
Cohesion: 0.07
Nodes (20): CampaignEvent, CampaignLocation, CampaignState, CampaignThread, ClassPreset, Condition, conds, events (+12 more)

### Community 13 - "Player Accounts & Notes"
Cohesion: 0.20
Nodes (19): applyLevelUp(), getMaxSpellLevel(), getUnlockedSpells(), isCantripActive(), isSpellPrepared(), isSpellUnlocked(), levelUpCharacter(), longRest() (+11 more)

### Community 14 - "Items Catalog"
Cohesion: 0.10
Nodes (19): dependencies, dotenv, express, express-session, mongoose, socket.io, description, devDependencies (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.28
Nodes (13): getItem(), calcWeaponAttackMod(), calcWeaponDamageBonus(), charBuffBonus(), diceOnly(), isMonkWeapon(), normalizeDamageType(), parseDamageBonus() (+5 more)

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
Cohesion: 0.47
Nodes (9): addItem(), delItem(), _getInventory(), renderInventory(), _setInventory(), toggleInvTransfer(), transferItem(), assignSingleLoot() (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (5): CampaignEvent, mongoose, ORDER, CampaignEventSchema, { Schema, model }

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (4): DM Authentication Guard, Player Authentication Guard, requireDM(), requirePlayer()

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (41): API de datos (`/api`), Archivos clave, Ardaetheros — Compañero de Campaña D&D 5E, Arquitectura general, Campos de mecánica en los hechizos (`db/seed-data/class-presets.js`), Clases CSS, Comunidades principales (navegación rápida), Convenciones importantes (+33 more)

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (9): archivedSessionLabel(), checkArchivedSessionNumber(), fetchArchivedSession(), finalizeSession(), onSessionNumberInput(), renderArchivedWarning(), renderLiveHeader(), updateLiveMeta() (+1 more)

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
Cohesion: 0.12
Nodes (43): addAdhocMonster(), addAllPlayersToCombat(), addDeathFailures(), addMonsterFromBestiary(), addPlayerToCombat(), applyConcentration(), applyDamage(), applyHealing() (+35 more)

### Community 31 - "Community 31"
Cohesion: 0.40
Nodes (6): initApp(), loadStory(), renderStory(), GET /api/story, Story 'Capítulo' chapter label, story.js

### Community 32 - "Community 32"
Cohesion: 0.53
Nodes (4): applyImage(), closeImageModal(), openImageModal(), setPortrait()

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (28): addBuff(), applyPostHitReactions(), applyPreHitReactions(), attackDamageBreakdown(), attackOutcome(), buffCasterKey(), combatKey(), defaultSlotLevel() (+20 more)

### Community 34 - "Community 34"
Cohesion: 0.67
Nodes (4): checkMonsterThresholds(), getMonsterHPThresholds(), getMonsterPreset(), renderMonsterStatBlock()

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (36): canTakeTurn(), getAttackCA(), getBuffs(), getCombatantAC(), getCombatantBaseAC(), getCombatantHP(), getCombatantHPMax(), getCombatantName() (+28 more)

### Community 46 - "Community 46"
Cohesion: 0.08
Nodes (23): ABILITY_SCORES, _ABILITY_SCORES_FALLBACK, AC_FORMULA, CHARS, CLASS_PRESETS, CONCENTRATION_META, CONDITIONS, DEFAULT_CAMPAIGN_EVENTS (+15 more)

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (4): missileCount(), missileDamagePerDart(), renderMissilesBlock(), renderMissileSummary()

### Community 49 - "Community 49"
Cohesion: 0.09
Nodes (45): ABILITY_KEYS, applyASI(), ASI_FORM, ASI_LEVELS, asiChanges(), changeResourcePool(), closeFeatEditor(), closeScoresEditor() (+37 more)

### Community 50 - "Community 50"
Cohesion: 0.50
Nodes (3): Item known field — player visibility control, ItemSchema, { Schema, model }

### Community 53 - "Community 53"
Cohesion: 0.12
Nodes (17): Socket.IO live session relay pattern, connectDB(), mongoose, _socket, Render.com deploy config, player-login endpoint, token-login endpoint, app (+9 more)

### Community 54 - "Community 54"
Cohesion: 0.10
Nodes (35): advanceRound(), beginTurn(), buildGroupedStream(), closeMonsterPicker(), closeNoteForm(), confirmStartCombat(), endRageBtn(), forceNextRound() (+27 more)

### Community 55 - "Community 55"
Cohesion: 0.17
Nodes (16): liveEscape(), renderActionNoteBody(), renderCombatForm(), renderConversationForm(), renderConversationNoteBody(), renderLootForm(), renderLootRollRow(), renderNarrativeChapterHeader() (+8 more)

## Knowledge Gaps
- **238 isolated node(s):** `version`, `configurations`, `bgIsolation`, `allow`, `mongoose` (+233 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `submitPlayerLogin()` connect `DB Seed & Init` to `Community 53`?**
  _High betweenness centrality (0.330) - this node is a cross-community bridge._
- **Why does `player-login endpoint` connect `Community 53` to `DB Seed & Init`?**
  _High betweenness centrality (0.300) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `renderActionForm()` (e.g. with `schoolBadge()` and `calcSpellAttackMod()`) actually correct?**
  _`renderActionForm()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `saveActionNote()` (e.g. with `consumeSpellSlot()` and `abilityMod()`) actually correct?**
  _`saveActionNote()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 34 inferred relationships involving `save()` (e.g. with `applyASI()` and `applyLevelUp()`) actually correct?**
  _`save()` has 34 INFERRED edges - model-reasoned connections that need verification._
- **What connects `version`, `configurations`, `bgIsolation` to the rest of the system?**
  _241 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Character Abilities & Stats` be split into smaller, more focused modules?**
  _Cohesion score 0.10080645161290322 - nodes in this community are weakly interconnected._