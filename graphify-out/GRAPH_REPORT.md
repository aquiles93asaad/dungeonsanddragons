# Graph Report - .  (2026-06-08)

## Corpus Check
- 54 files · ~58,035 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 544 nodes · 1140 edges · 37 communities (20 shown, 17 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 165 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Live Session & Combat|Live Session & Combat]]
- [[_COMMUNITY_Character Abilities & Persistence|Character Abilities & Persistence]]
- [[_COMMUNITY_Combat Mechanics & Damage|Combat Mechanics & Damage]]
- [[_COMMUNITY_Game Data (Presets & Items)|Game Data (Presets & Items)]]
- [[_COMMUNITY_Campaign Narrative World|Campaign Narrative World]]
- [[_COMMUNITY_DM Auth & Role System|DM Auth & Role System]]
- [[_COMMUNITY_Campaign Management|Campaign Management]]
- [[_COMMUNITY_Server & Role Visibility|Server & Role Visibility]]
- [[_COMMUNITY_Database Seeding|Database Seeding]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_REST API Routes|REST API Routes]]
- [[_COMMUNITY_Story Data Seeding|Story Data Seeding]]
- [[_COMMUNITY_Items Catalog UI|Items Catalog UI]]
- [[_COMMUNITY_Singleton Campaign State|Singleton Campaign State]]
- [[_COMMUNITY_Auth Middleware Guards|Auth Middleware Guards]]
- [[_COMMUNITY_Image & Portrait Modal|Image & Portrait Modal]]
- [[_COMMUNITY_Player Model & Auth|Player Model & Auth]]
- [[_COMMUNITY_App Gate & Session UI|App Gate & Session UI]]
- [[_COMMUNITY_Socket.IO Client|Socket.IO Client]]
- [[_COMMUNITY_Item Visibility Control|Item Visibility Control]]
- [[_COMMUNITY_VS Code Launch Config|VS Code Launch Config]]
- [[_COMMUNITY_Conditions Data|Conditions Data]]
- [[_COMMUNITY_Campaign Event Model|Campaign Event Model]]
- [[_COMMUNITY_Campaign Location Model|Campaign Location Model]]
- [[_COMMUNITY_Campaign Thread Model|Campaign Thread Model]]
- [[_COMMUNITY_Condition Model|Condition Model]]
- [[_COMMUNITY_Monster Model|Monster Model]]
- [[_COMMUNITY_NPC Model|NPC Model]]
- [[_COMMUNITY_Live Session Sync|Live Session Sync]]
- [[_COMMUNITY_Story Act & Chapter Models|Story Act & Chapter Models]]
- [[_COMMUNITY_Gate Token Submission|Gate Token Submission]]
- [[_COMMUNITY_Live Page Detection|Live Page Detection]]
- [[_COMMUNITY_API Sync Flag|API Sync Flag]]
- [[_COMMUNITY_App Gate HTML|App Gate HTML]]
- [[_COMMUNITY_Nav Tabs HTML|Nav Tabs HTML]]
- [[_COMMUNITY_Project Root Config|Project Root Config]]
- [[_COMMUNITY_Auth Me Endpoint|Auth Me Endpoint]]

## God Nodes (most connected - your core abstractions)
1. `save()` - 34 edges
2. `saveLiveSession()` - 33 edges
3. `renderNoteForm()` - 31 edges
4. `load()` - 29 edges
5. `renderActionForm()` - 26 edges
6. `liveEscape()` - 24 edges
7. `getCombatant()` - 24 edges
8. `pushNote()` - 24 edges
9. `saveClassAbilityNote()` - 20 edges
10. `renderCombatTracker()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `No ES modules (global scope, file:// compat)` --rationale_for--> `save()`  [INFERRED]
  CLAUDE.md → public/js/storage.js
- `Organic character progression philosophy` --rationale_for--> `CHAR_CLASS_ABILITIES`  [INFERRED]
  CLAUDE.md → public/js/live.js
- `Render.com deploy config` --references--> `app`  [EXTRACTED]
  render.yaml → server.js
- `DM vs Player role system` --conceptually_related_to--> `API Routes Setup`  [INFERRED]
  CLAUDE.md → routes/api.js
- `connectDB()` --semantically_similar_to--> `seed()`  [INFERRED] [semantically similar]
  db/connect.js → db/seed.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **seed.js populates all Mongoose model collections in one script** — db_seed_seed, models_item_itemschema, models_condition_conditionschema, models_npc_npcschema, models_monster_monsterschema, models_campaignevent_campaigneventschema, models_campaignthread_campaignthreadschema, models_campaignlocation_campaignlocationschema, models_classpreset_classpresetschema, models_campaignstate_campaignstateschema, models_story_storyschema [EXTRACTED 1.00]
- **DM and Player auth guards protect API routes via session checks** — middleware_requiredm_requiredm, middleware_requireplayer_requireplayer, concept_dm_auth_guard, concept_player_auth_guard [INFERRED 0.85]
- **Campaign data flows: DEFAULT_CAMPAIGN_* → loadCampaign → CAMPAIGN → renderEvents** — data_campaignevents_defaultcampaignevents, js_campaign_loadcampaign, js_campaign_campaign, js_campaign_renderevents [EXTRACTED 0.95]
- **Spell slot system: CLASS_PRESETS → getSpellSlotsForLevel → loadSlotState → consumeSpellSlot** — data_classpresets_classpresets, js_data_getspellslotsforlevel, js_abilities_loadslotstate, js_abilities_consumespellslot [EXTRACTED 0.95]
- **Auth gate: checkDMSession → setDMMode/setPlayerSession → unlockApp/showAppGate** — js_dmauth_checkdmsession, js_dmauth_setdmmode, js_dmauth_unlockapp, js_dmauth_showappgate [EXTRACTED 1.00]
- **App startup chain: checkDMSession → loadReferenceData → loadCharState → initApp** — js_init_loadreferencedata, js_init_loadcharstate, js_init_initapp, js_storage_apisyncenabled [EXTRACTED 1.00]
- **Live session sync: DM save → socket emit → server relay → player receive → render** — js_live_savelivesession, js_socketclient_socket, server_livecache, js_socketclient_applysessionsync [EXTRACTED 1.00]
- **Dual persistence: localStorage write triggers API sync (DM only)** — js_storage_save, js_storage_maybeSyncToApi, js_storage_synccharstate, js_storage_syncmoney [EXTRACTED 1.00]

## Communities (37 total, 17 thin omitted)

### Community 0 - "Live Session & Combat"
Cohesion: 0.07
Nodes (78): Organic character progression philosophy, ABILITY_META, addAdhocMonster(), addAllPlayersToCombat(), addMonsterFromBestiary(), addPlayerToCombat(), advanceRound(), applyConcentration() (+70 more)

### Community 1 - "Character Abilities & Persistence"
Cohesion: 0.06
Nodes (59): No ES modules (global scope, file:// compat), localStorage ↔ MongoDB dual persistence, changeResourcePool(), consumeSpellSlot(), getMaxSpellLevel(), isCantripActive(), levelUpCharacter(), loadResourceState() (+51 more)

### Community 2 - "Combat Mechanics & Damage"
Cohesion: 0.08
Nodes (50): schoolBadge(), getItem(), actCombatant(), addExchangeLine(), calcWeaponDamageBonus(), getAliveMonsters(), getAlivePlayers(), getCombatantAC() (+42 more)

### Community 3 - "Game Data (Presets & Items)"
Cohesion: 0.07
Nodes (43): CLASS_PRESETS, ITEMS, getCharSaveBonus(), getCharSkillBonus(), isSpellPrepared(), ABILITY_SCORES, abilityMod(), calcSpellAttackMod() (+35 more)

### Community 4 - "Campaign Narrative World"
Cohesion: 0.10
Nodes (25): Aether Grove (location), Fell Corruption (energy/faction), Solmira (location), Sunbound Druids (faction), Velo Elmyra (faction), DEFAULT_CAMPAIGN_EVENTS, DEFAULT_CAMPAIGN_LOCATIONS, DEFAULT_CAMPAIGN_THREADS (+17 more)

### Community 5 - "DM Auth & Role System"
Cohesion: 0.12
Nodes (26): checkDMSession(), dmLogout(), lockApp(), setDMMode(), setSessionIndicator(), showAppGate(), submitGateToken(), unlockApp() (+18 more)

### Community 6 - "Campaign Management"
Cohesion: 0.14
Nodes (25): addCampaignEvent(), addCampaignLocation(), addCampaignThread(), addWildShapeForm(), _apiDebounce, attachDragHandlers(), bindDragFromHandleOnly(), _campaignDelete() (+17 more)

### Community 7 - "Server & Role Visibility"
Cohesion: 0.09
Nodes (22): CSS-based role visibility (dm-only/player-only), DM vs Player role system, Socket.IO live session relay pattern, connectDB(), mongoose, _socket, Render.com deploy config, API Routes Setup (+14 more)

### Community 8 - "Database Seeding"
Cohesion: 0.09
Nodes (22): CampaignEvent, CampaignLocation, CampaignState, CampaignThread, ClassPreset, Condition, conds, events (+14 more)

### Community 9 - "Package Dependencies"
Cohesion: 0.10
Nodes (19): dependencies, dotenv, express, express-session, mongoose, socket.io, description, devDependencies (+11 more)

### Community 10 - "REST API Routes"
Cohesion: 0.11
Nodes (18): CampaignEvent, CampaignLocation, CampaignState, CampaignThread, ClassPreset, Condition, crud, crypto (+10 more)

### Community 11 - "Story Data Seeding"
Cohesion: 0.12
Nodes (13): acts, chapters, mongoose, seedStory(), StoryAct, StoryChapter, NoteSchema, { Schema, model } (+5 more)

### Community 12 - "Items Catalog UI"
Cohesion: 0.27
Nodes (12): CATEGORY_LABELS, clearItemForm(), customItems, filterItems(), initItems, initItems(), renderItemCard(), renderItemsList() (+4 more)

### Community 13 - "Singleton Campaign State"
Cohesion: 0.20
Nodes (9): Singleton Document Pattern, loadDataFile(), seed(), CampaignStateSchema, { Schema, model }, ClassPresetSchema, { Schema, model }, { Schema, model } (+1 more)

### Community 14 - "Auth Middleware Guards"
Cohesion: 0.33
Nodes (4): DM Authentication Guard, Player Authentication Guard, requireDM(), requirePlayer()

### Community 15 - "Image & Portrait Modal"
Cohesion: 0.53
Nodes (4): applyImage(), closeImageModal(), openImageModal(), setPortrait()

### Community 16 - "Player Model & Auth"
Cohesion: 0.33
Nodes (4): PlayerSchema, { Schema, model }, Player, { Router }

### Community 17 - "App Gate & Session UI"
Cohesion: 0.40
Nodes (5): checkDMSession, setDMMode, setSessionIndicator, showAppGate, unlockApp

### Community 18 - "Socket.IO Client"
Cohesion: 0.60
Nodes (4): applyHPSync(), applySessionSync(), isLivePageActive(), _socket

### Community 19 - "Item Visibility Control"
Cohesion: 0.50
Nodes (3): Item known field — player visibility control, ItemSchema, { Schema, model }

## Knowledge Gaps
- **137 isolated node(s):** `version`, `configurations`, `mongoose`, `mongoose`, `fs` (+132 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `API Routes Setup` connect `Server & Role Visibility` to `Live Session & Combat`?**
  _High betweenness centrality (0.264) - this node is a cross-community bridge._
- **Why does `deleteNote()` connect `Live Session & Combat` to `Campaign Management`, `Server & Role Visibility`?**
  _High betweenness centrality (0.254) - this node is a cross-community bridge._
- **Are the 22 inferred relationships involving `save()` (e.g. with `No ES modules (global scope, file:// compat)` and `changeResourcePool()`) actually correct?**
  _`save()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `load()` (e.g. with `isCantripActive()` and `isSpellPrepared()`) actually correct?**
  _`load()` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `renderActionForm()` (e.g. with `schoolBadge()` and `calcSpellAttackMod()`) actually correct?**
  _`renderActionForm()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `version`, `configurations`, `mongoose` to the rest of the system?**
  _143 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Live Session & Combat` be split into smaller, more focused modules?**
  _Cohesion score 0.06730506155950752 - nodes in this community are weakly interconnected._