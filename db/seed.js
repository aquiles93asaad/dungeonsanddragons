require('dotenv').config();
const mongoose = require('mongoose');


const items     = require('./seed-data/items.js');
const conds     = require('./seed-data/conditions.js');
const npcs      = require('./seed-data/npcs.js');
const events    = require('./seed-data/campaign-events.js');
const threads   = require('./seed-data/campaign-threads.js');
const locations = require('./seed-data/campaign-locations.js');
const monsters  = require('./seed-data/monsters.js');
const presets   = require('./seed-data/class-presets.js');

// Modelos
const Item             = require('../models/Item');
const Condition        = require('../models/Condition');
const Npc              = require('../models/Npc');
const Monster          = require('../models/Monster');
const CampaignEvent    = require('../models/CampaignEvent');
const CampaignThread   = require('../models/CampaignThread');
const CampaignLocation = require('../models/CampaignLocation');
const ClassPreset      = require('../models/ClassPreset');
const CampaignState    = require('../models/CampaignState');
const Story            = require('../models/Story');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB. Seeding...\n');

  // Items — solo si no hay data
  const itemCount = await Item.countDocuments();
  if(itemCount === 0){
    await Item.insertMany(items);
    console.log(`✓ Items: ${items.length} (inicializados)`);
  } else {
    console.log(`✓ Items: ya existen (${itemCount}), sin cambios`);
  }

  // Conditions — solo si no hay data
  const condCount = await Condition.countDocuments();
  if(condCount === 0){
    await Condition.insertMany(conds);
    console.log(`✓ Conditions: ${conds.length} (inicializadas)`);
  } else {
    console.log(`✓ Conditions: ya existen (${condCount}), sin cambios`);
  }

  // NPCs — solo si no hay data (no pisar ediciones del DM)
  const npcCount = await Npc.countDocuments();
  if(npcCount === 0){
    await Npc.insertMany(npcs);
    console.log(`✓ NPCs: ${npcs.length} (inicializados)`);
  } else {
    console.log(`✓ NPCs: ya existen (${npcCount}), sin cambios`);
  }

  // Monsters — solo si no hay data
  const monsterCount = await Monster.countDocuments();
  if(monsterCount === 0){
    await Monster.insertMany(monsters.map(m => ({ ...m, hpCurrent: m.hpMax, showInLive: true })));
    console.log(`✓ Monsters: ${monsters.length} (inicializados)`);
  } else {
    console.log(`✓ Monsters: ya existen (${monsterCount}), sin cambios`);
  }

  // Campaign Events — solo si no hay data (no pisar estado real de campaña)
  const eventCount = await CampaignEvent.countDocuments();
  if(eventCount === 0){
    await CampaignEvent.insertMany(events);
    console.log(`✓ Campaign Events: ${events.length} (inicializados)`);
  } else {
    console.log(`✓ Campaign Events: ya existen (${eventCount}), sin cambios`);
  }

  // Campaign Threads — solo si no hay data
  const threadCount = await CampaignThread.countDocuments();
  if(threadCount === 0){
    await CampaignThread.insertMany(threads);
    console.log(`✓ Campaign Threads: ${threads.length} (inicializados)`);
  } else {
    console.log(`✓ Campaign Threads: ya existen (${threadCount}), sin cambios`);
  }

  // Campaign Locations — solo si no hay data
  const locationCount = await CampaignLocation.countDocuments();
  if(locationCount === 0){
    await CampaignLocation.insertMany(locations);
    console.log(`✓ Campaign Locations: ${locations.length} (inicializados)`);
  } else {
    console.log(`✓ Campaign Locations: ya existen (${locationCount}), sin cambios`);
  }

  // Class Presets — upsert por personaje, nunca borra
  const presetDocs = Object.entries(presets).map(([charId, data]) => ({ charId, data }));
  for(const doc of presetDocs){
    await ClassPreset.updateOne({ charId: doc.charId }, { $set: { data: doc.data } }, { upsert: true });
  }
  console.log(`✓ Class Presets: ${presetDocs.length} personajes (upsert)`);

  // Campaign State — documento único vacío si no existe
  const stateExists = await CampaignState.findOne();
  if (!stateExists) {
    await CampaignState.create({ characters: {}, combat: null, money: {}, misc: {} });
    console.log('✓ Campaign State: inicializado');
  } else {
    console.log('✓ Campaign State: ya existe, sin cambios');
  }

  // Story — documento único vacío si no existe
  const storyExists = await Story.findOne();
  if (!storyExists) {
    await Story.create({ content: '' });
    console.log('✓ Story: inicializada');
  } else {
    console.log('✓ Story: ya existe, sin cambios');
  }

  console.log('\n✅ Seed completo.');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Error en seed:', err);
  process.exit(1);
});
