# Graph Report - .  (2026-06-12)

## Corpus Check
- 59 files · ~64,544 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 590 nodes · 1212 edges · 48 communities (32 shown, 16 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 168 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `saveLiveSession()` - 34 edges
2. `save()` - 32 edges
3. `load()` - 32 edges
4. `renderNoteForm()` - 31 edges
5. `renderActionForm()` - 26 edges
6. `liveEscape()` - 24 edges
7. `getCombatant()` - 24 edges
8. `pushNote()` - 24 edges
9. `saveClassAbilityNote()` - 20 edges
10. `renderCombatTracker()` - 20 edges

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
- **Auth gate: checkDMSession → setDMMode/setPlayerSession → unlockApp/showAppGate** — js_dmauth_checkdmsession, js_dmauth_setdmmode, js_dmauth_unlockapp, js_dmauth_showappgate [EXTRACTED 1.00]

## Communities (48 total, 16 thin omitted)

### Community 0 - "Character Abilities & Stats"
Cohesion: 0.07
Nodes (51): getCharSaveBonus(), getCharSkillBonus(), levelUpCharacter(), ABILITY_SCORES, _ABILITY_SCORES_FALLBACK, abilityMod(), calcSpellAttackMod(), calcSpellSaveDC() (+43 more)

### Community 1 - "Campaign Events & Locations"
Cohesion: 0.09
Nodes (42): DEFAULT_CAMPAIGN_EVENTS (data), addCampaignEvent(), addCampaignLocation(), addCampaignThread(), addWildShapeForm(), API, attachDragHandlers(), bindDragFromHandleOnly() (+34 more)

### Community 2 - "World Lore & Narrative"
Cohesion: 0.09
Nodes (24): Aether Grove (location), Fell Corruption (energy/faction), Solmira (location), Sunbound Druids (faction), Velo Elmyra (faction), DEFAULT_CAMPAIGN_LOCATIONS, DEFAULT_CAMPAIGN_THREADS, CLASS_PRESETS (+16 more)

### Community 3 - "Live Session Combat (Core)"
Cohesion: 0.09
Nodes (26): ABILITY_META, actCombatant(), calcWeaponDamageBonus(), CHAR_CLASS_ABILITIES, closeCharSheetModal(), combatantCardClick(), getAlivePlayers(), getAliveTargets() (+18 more)

### Community 4 - "Live Session Combat (Add/Manage)"
Cohesion: 0.14
Nodes (32): addAdhocMonster(), addAllPlayersToCombat(), addMonsterFromBestiary(), addPlayerToCombat(), applyCondition(), cancelStartCombat(), changeCombatantHP(), changeWildShapeHP() (+24 more)

### Community 5 - "DB Migration Scripts"
Cohesion: 0.07
Nodes (22): mongoose, Session, mongoose, StoryAct, acts, chapters, mongoose, seedStory() (+14 more)

### Community 6 - "DM Auth & Role System"
Cohesion: 0.12
Nodes (25): checkDMSession(), dmLogout(), lockApp(), setDMMode(), setSessionIndicator(), showAppGate(), submitGateToken(), unlockApp() (+17 more)

### Community 7 - "Spell Slots & Resources"
Cohesion: 0.16
Nodes (21): changeResourcePool(), consumeSpellSlot(), getMaxSpellLevel(), isCantripActive(), isSpellPrepared(), loadResourceState(), loadSlotState(), renderAllAbilities() (+13 more)

### Community 8 - "DB Seed & Init"
Cohesion: 0.09
Nodes (22): CampaignEvent, CampaignLocation, CampaignState, CampaignThread, ClassPreset, Condition, conds, events (+14 more)

### Community 9 - "Conversation & Exchange UI"
Cohesion: 0.13
Nodes (22): addExchangeLine(), liveEscape(), moveExchangeLine(), removeExchangeLine(), renderActionNoteBody(), renderCombatantConditions(), renderCombatForm(), renderConversationForm() (+14 more)

### Community 10 - "REST API Routes"
Cohesion: 0.10
Nodes (19): dependencies, dotenv, express, express-session, mongoose, socket.io, description, devDependencies (+11 more)

### Community 11 - "Character State Sync (CHAR_STATE)"
Cohesion: 0.17
Nodes (19): buildGroupedStream(), closeNoteForm(), deleteNote(), getCurrentNarrativeId(), groupLevelUp(), groupLongRest(), groupShortRest(), moveChapter() (+11 more)

### Community 12 - "NPC & Bestiary Data"
Cohesion: 0.11
Nodes (18): CampaignEvent, CampaignLocation, CampaignState, CampaignThread, ClassPreset, Condition, crud, crypto (+10 more)

### Community 13 - "Player Accounts & Notes"
Cohesion: 0.23
Nodes (16): breakConcentration(), getCombatantHP(), getCombatantHPMax(), getCombatantName(), isNat1(), isNat20(), openLiveLootForm(), renderNpcActionForm() (+8 more)

### Community 14 - "Items Catalog"
Cohesion: 0.13
Nodes (13): connectDB(), mongoose, Render.com deploy config, app, connectDB, express, http, io (+5 more)

### Community 15 - "Money & Economy"
Cohesion: 0.24
Nodes (13): CHAR_STATE priority chain (MongoDB→localStorage→hardcoded), longRest(), changeVital(), updateHP(), ABILITY_SCORES Proxy, getAbilityScores(), getCharLevel(), getHPMax() (+5 more)

### Community 16 - "Community 16"
Cohesion: 0.27
Nodes (12): CATEGORY_LABELS, clearItemForm(), customItems, filterItems(), initItems, initItems(), renderItemCard(), renderItemsList() (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.20
Nodes (9): Singleton Document Pattern, loadDataFile(), seed(), CampaignStateSchema, { Schema, model }, ConditionSchema, { Schema, model }, { Schema, model } (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (10): initApp(), changeMoneyCoin(), COIN_TYPES, getMoney(), getMoneyTotalSP(), MONEY_DEFAULTS, renderAllMoney(), renderMoney() (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.36
Nodes (8): addItem(), delItem(), renderInventory(), saveNotes(), toggleCondition(), getAbilityScores(), assignLootFromForm(), load()

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (9): advanceRound(), applyConcentration(), cantripRequiresAttack(), checkRoundComplete(), forceNextRound(), markActed(), saveActionNote(), saveSkipTurnNote() (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.32
Nodes (7): _CHAR_SYNC_PREFIXES, _charFromStateKey(), _charSyncTimers, _maybeSyncToAPI(), showSaved(), syncMoney(), GET/PUT /api/state

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (5): CampaignEvent, mongoose, ORDER, CampaignEventSchema, { Schema, model }

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (5): loadStory(), renderStory(), GET /api/story, crudRouter(), { Router }

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (4): DM Authentication Guard, Player Authentication Guard, requireDM(), requirePlayer()

### Community 25 - "Community 25"
Cohesion: 0.53
Nodes (4): applyImage(), closeImageModal(), openImageModal(), setPortrait()

### Community 26 - "Community 26"
Cohesion: 0.47
Nodes (4): fetchAPI(), loadCharState(), loadReferenceData(), GET /api/presets-map

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (4): PlayerSchema, { Schema, model }, Player, { Router }

### Community 28 - "Community 28"
Cohesion: 0.40
Nodes (5): checkDMSession, setDMMode, setSessionIndicator, showAppGate, unlockApp

### Community 29 - "Community 29"
Cohesion: 0.40
Nodes (4): LIVE_SESSION, applySessionSync(), socket live:sync handler, socket live:welcome handler

### Community 31 - "Community 31"
Cohesion: 0.60
Nodes (4): applyHPSync(), applySessionSync(), isLivePageActive(), _socket

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (3): Item known field — player visibility control, ItemSchema, { Schema, model }

## Ambiguous Edges - Review These
- `fixSessionDates.js` → `CampaignEvent.js`  [AMBIGUOUS]
  db/fixSessionDates.js · relation: references
- `fixStoryActsS3.js` → `CampaignEvent.js`  [AMBIGUOUS]
  db/fixStoryActsS3.js · relation: references

## Knowledge Gaps
- **160 isolated node(s):** `version`, `configurations`, `mongoose`, `mongoose`, `Session` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `fixSessionDates.js` and `CampaignEvent.js`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `fixStoryActsS3.js` and `CampaignEvent.js`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `updateEvent()` connect `Campaign Events & Locations` to `Community 22`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `load()` connect `Community 19` to `Character Abilities & Stats`, `Campaign Events & Locations`, `World Lore & Narrative`, `Live Session Combat (Core)`, `Live Session Combat (Add/Manage)`, `Spell Slots & Resources`, `Player Accounts & Notes`, `Money & Economy`, `Community 18`, `Community 21`, `Community 30`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **Why does `renderEvents()` connect `Campaign Events & Locations` to `Character State Sync (CHAR_STATE)`, `Live Session Combat (Add/Manage)`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `save()` (e.g. with `changeResourcePool()` and `consumeSpellSlot()`) actually correct?**
  _`save()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `load()` (e.g. with `isCantripActive()` and `isSpellPrepared()`) actually correct?**
  _`load()` has 23 INFERRED edges - model-reasoned connections that need verification._