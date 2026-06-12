# Graph Report - .  (2026-06-12)

## Corpus Check
- 59 files · ~64,033 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 657 nodes · 1312 edges · 45 communities (29 shown, 16 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 175 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Live Session & Combat|Live Session & Combat]]
- [[_COMMUNITY_Character Abilities & Persistence|Character Abilities & Persistence]]
- [[_COMMUNITY_DM Auth & Role System|DM Auth & Role System]]
- [[_COMMUNITY_REST API Routes|REST API Routes]]
- [[_COMMUNITY_Campaign Narrative World|Campaign Narrative World]]
- [[_COMMUNITY_Game Data (Presets & Items)|Game Data (Presets & Items)]]
- [[_COMMUNITY_DB Migration Scripts|DB Migration Scripts]]
- [[_COMMUNITY_Campaign UI & Dirty Tracking|Campaign UI & Dirty Tracking]]
- [[_COMMUNITY_Story & Sessions View|Story & Sessions View]]
- [[_COMMUNITY_MongoDB Models (Order)|MongoDB Models (Order)]]
- [[_COMMUNITY_Frontend Init & Navigation|Frontend Init & Navigation]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
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

## God Nodes (most connected - your core abstractions)
1. `saveLiveSession()` - 34 edges
2. `save()` - 32 edges
3. `renderNoteForm()` - 31 edges
4. `load()` - 29 edges
5. `renderActionForm()` - 26 edges
6. `liveEscape()` - 24 edges
7. `getCombatant()` - 24 edges
8. `pushNote()` - 24 edges
9. `getCharLevel()` - 20 edges
10. `saveClassAbilityNote()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `connectDB()` --semantically_similar_to--> `seed()`  [INFERRED] [semantically similar]
  db/connect.js → db/seed.js
- `seed()` --references--> `CampaignEventSchema`  [EXTRACTED]
  db/seed.js → models/CampaignEvent.js
- `seed()` --references--> `CampaignLocationSchema`  [EXTRACTED]
  db/seed.js → models/CampaignLocation.js
- `seed()` --references--> `CampaignThreadSchema`  [EXTRACTED]
  db/seed.js → models/CampaignThread.js
- `seed()` --references--> `ClassPresetSchema`  [EXTRACTED]
  db/seed.js → models/ClassPreset.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **seed.js populates all Mongoose model collections in one script** — db_seed_seed, models_item_itemschema, models_condition_conditionschema, models_npc_npcschema, models_monster_monsterschema, models_campaignevent_campaigneventschema, models_campaignthread_campaignthreadschema, models_campaignlocation_campaignlocationschema, models_classpreset_classpresetschema, models_campaignstate_campaignstateschema, models_story_storyschema [EXTRACTED 1.00]
- **DM and Player auth guards protect API routes via session checks** — middleware_requiredm_requiredm, middleware_requireplayer_requireplayer, concept_dm_auth_guard, concept_player_auth_guard [INFERRED 0.85]
- **Spell slot system: CLASS_PRESETS → getSpellSlotsForLevel → loadSlotState → consumeSpellSlot** — data_classpresets_classpresets, js_data_getspellslotsforlevel, js_abilities_loadslotstate, js_abilities_consumespellslot [EXTRACTED 0.95]
- **Auth gate: checkDMSession → setDMMode/setPlayerSession → unlockApp/showAppGate** — js_dmauth_checkdmsession, js_dmauth_setdmmode, js_dmauth_unlockapp, js_dmauth_showappgate [EXTRACTED 1.00]
- **Dual persistence: localStorage write triggers API sync (DM only)** — js_storage_save, js_storage_maybeSyncToApi, js_storage_synccharstate, js_storage_syncmoney [EXTRACTED 1.00]
- **Live session sync: DM save → socket emit → server relay → player receive → render** — js_live_savelivesession, js_socketclient_socket, server_livecache, js_socketclient_applysessionsync [EXTRACTED 1.00]

## Communities (45 total, 16 thin omitted)

### Community 0 - "Live Session & Combat"
Cohesion: 0.06
Nodes (55): localStorage ↔ MongoDB dual persistence, CONCENTRATION_META, CONDITIONS, changeResourcePool(), consumeSpellSlot(), isCantripActive(), isSpellPrepared(), loadResourceState() (+47 more)

### Community 1 - "Character Abilities & Persistence"
Cohesion: 0.07
Nodes (49): CLASS_PRESETS, ITEMS, getCharSaveBonus(), getCharSkillBonus(), getMaxSpellLevel(), levelUpCharacter(), ABILITY_SCORES, abilityMod() (+41 more)

### Community 2 - "DM Auth & Role System"
Cohesion: 0.08
Nodes (41): addCampaignEvent(), addCampaignLocation(), addCampaignThread(), addWildShapeForm(), API, attachDragHandlers(), bindDragFromHandleOnly(), CAMPAIGN (+33 more)

### Community 3 - "REST API Routes"
Cohesion: 0.10
Nodes (27): attachDragHandlers(), bindDragFromHandleOnly(), campaign.js, _clearDirty(), Dirty-tracking system (_dirty, _isNew, _orderDirty), discardOrder(), initCampaign(), live.js (+19 more)

### Community 4 - "Campaign Narrative World"
Cohesion: 0.08
Nodes (28): ABILITY_META, actCombatant(), advanceRound(), calcWeaponDamageBonus(), CHAR_CLASS_ABILITIES, checkRoundComplete(), closeCharSheetModal(), combatantCardClick() (+20 more)

### Community 5 - "Game Data (Presets & Items)"
Cohesion: 0.10
Nodes (23): Aether Grove (location), Fell Corruption (energy/faction), Solmira (location), Sunbound Druids (faction), Velo Elmyra (faction), DEFAULT_CAMPAIGN_EVENTS, DEFAULT_CAMPAIGN_LOCATIONS, DEFAULT_CAMPAIGN_THREADS (+15 more)

### Community 6 - "DB Migration Scripts"
Cohesion: 0.07
Nodes (22): mongoose, Session, mongoose, StoryAct, acts, chapters, mongoose, seedStory() (+14 more)

### Community 7 - "Campaign UI & Dirty Tracking"
Cohesion: 0.14
Nodes (30): addAdhocMonster(), addAllPlayersToCombat(), addMonsterFromBestiary(), addPlayerToCombat(), applyCondition(), cancelStartCombat(), changeCombatantHP(), changeWildShapeHP() (+22 more)

### Community 8 - "Story & Sessions View"
Cohesion: 0.13
Nodes (23): checkDMSession(), dmLogout(), lockApp(), setDMMode(), setSessionIndicator(), showAppGate(), submitGateToken(), unlockApp() (+15 more)

### Community 9 - "MongoDB Models (Order)"
Cohesion: 0.07
Nodes (28): requireDM middleware, requirePlayer middleware, CampaignState, Player, POST/GET/DELETE /api/players, GET/PUT /api/players/me/notes, POST /api/sessions/:number/notes, PUT /api/state/character/:charId (+20 more)

### Community 10 - "Frontend Init & Navigation"
Cohesion: 0.16
Nodes (25): applyConcentration(), breakConcentration(), cantripRequiresAttack(), getAliveMonsters(), getAlivePlayers(), getCombatantHP(), getCombatantHPMax(), getCombatantName() (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (24): buildGroupedStream(), closeNoteForm(), deleteNote(), getCurrentNarrativeId(), groupLevelUp(), groupLongRest(), groupShortRest(), markActed() (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (22): CampaignEvent, CampaignLocation, CampaignState, CampaignThread, ClassPreset, Condition, conds, events (+14 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (22): addExchangeLine(), liveEscape(), moveExchangeLine(), removeExchangeLine(), renderActionNoteBody(), renderCombatantConditions(), renderCombatForm(), renderConversationForm() (+14 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (19): dependencies, dotenv, express, express-session, mongoose, socket.io, description, devDependencies (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (17): Socket.IO live session relay pattern, connectDB(), mongoose, _socket, Render.com deploy config, player-login endpoint, token-login endpoint, app (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (10): Item known field — player visibility control, Singleton Document Pattern, loadDataFile(), seed(), CampaignStateSchema, { Schema, model }, ItemSchema, { Schema, model } (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.27
Nodes (12): CATEGORY_LABELS, clearItemForm(), customItems, filterItems(), initItems, initItems(), renderItemCard(), renderItemsList() (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (11): CampaignEvent.order, fixSessionDates.js, fixStoryActsS3.js, reorderEvents.js, updateS2S3.js, CampaignEvent, Session, StoryAct (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.20
Nodes (10): CampaignLocation.order, CampaignThread.order, crudRouter (crudFactory), crudFactory sort param, CampaignLocation, CampaignThread, GET/POST/PUT/DELETE /api/locations, GET/POST/PUT/DELETE /api/threads (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.32
Nodes (7): fetchAPI(), init.js, loadCharState(), loadReferenceData(), GET /api/presets-map, GET/PUT /api/state, saveWildShapeForms()

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (5): CampaignEvent, mongoose, ORDER, CampaignEventSchema, { Schema, model }

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (4): DM Authentication Guard, Player Authentication Guard, requireDM(), requirePlayer()

### Community 23 - "Community 23"
Cohesion: 0.40
Nodes (6): initApp(), loadStory(), renderStory(), GET /api/story, Story 'Capítulo' chapter label, story.js

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
Cohesion: 0.60
Nodes (3): fetchAPI(), loadCharState(), loadReferenceData()

### Community 28 - "Community 28"
Cohesion: 0.60
Nodes (4): applyHPSync(), applySessionSync(), isLivePageActive(), _socket

## Knowledge Gaps
- **154 isolated node(s):** `version`, `configurations`, `mongoose`, `mongoose`, `Session` (+149 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `submitPlayerLogin()` connect `Story & Sessions View` to `Community 15`?**
  _High betweenness centrality (0.438) - this node is a cross-community bridge._
- **Why does `player-login endpoint` connect `Community 15` to `Story & Sessions View`?**
  _High betweenness centrality (0.399) - this node is a cross-community bridge._
- **Are the 25 inferred relationships involving `save()` (e.g. with `changeResourcePool()` and `consumeSpellSlot()`) actually correct?**
  _`save()` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `load()` (e.g. with `isCantripActive()` and `isSpellPrepared()`) actually correct?**
  _`load()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **What connects `version`, `configurations`, `mongoose` to the rest of the system?**
  _157 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Live Session & Combat` be split into smaller, more focused modules?**
  _Cohesion score 0.06241519674355495 - nodes in this community are weakly interconnected._
- **Should `Character Abilities & Persistence` be split into smaller, more focused modules?**
  _Cohesion score 0.06531204644412192 - nodes in this community are weakly interconnected._