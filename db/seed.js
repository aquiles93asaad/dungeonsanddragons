require('dotenv').config();
const mongoose = require('mongoose');

// Cargar datos desde los archivos existentes
// (usan variables globales, los evaluamos en contexto Node)
const fs   = require('fs');
const path = require('path');

const vm = require('vm');

function loadDataFile(file) {
  const src = fs.readFileSync(path.join(__dirname, '../public/data', file), 'utf8');
  // const/let no se asignan al sandbox en vm; reemplazamos por var para capturarlos
  const modifiedSrc = src.replace(/^(const|let)\s+/gm, 'var ');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(modifiedSrc, sandbox);
  return sandbox;
}

const items     = loadDataFile('items.js');
const conds     = loadDataFile('conditions.js');
const npcs      = loadDataFile('npcs.js');
const events    = loadDataFile('campaign-events.js');
const threads   = loadDataFile('campaign-threads.js');
const locations = loadDataFile('campaign-locations.js');
const monsters  = loadDataFile('monsters.js');
const presets   = loadDataFile('class-presets.js');

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

  // Items
  await Item.deleteMany({});
  await Item.insertMany(items.ITEMS);
  console.log(`✓ Items: ${items.ITEMS.length}`);

  // Conditions
  await Condition.deleteMany({});
  await Condition.insertMany(conds.CONDITIONS);
  console.log(`✓ Conditions: ${conds.CONDITIONS.length}`);

  // NPCs
  await Npc.deleteMany({});
  await Npc.insertMany(npcs.NPCS);
  console.log(`✓ NPCs: ${npcs.NPCS.length}`);

  // Monsters
  await Monster.deleteMany({});
  await Monster.insertMany(monsters.PRESET_MONSTERS);
  console.log(`✓ Monsters: ${monsters.PRESET_MONSTERS.length}`);

  // Campaign Events
  await CampaignEvent.deleteMany({});
  await CampaignEvent.insertMany(events.DEFAULT_CAMPAIGN_EVENTS);
  console.log(`✓ Campaign Events: ${events.DEFAULT_CAMPAIGN_EVENTS.length}`);

  // Campaign Threads
  await CampaignThread.deleteMany({});
  await CampaignThread.insertMany(threads.DEFAULT_CAMPAIGN_THREADS);
  console.log(`✓ Campaign Threads: ${threads.DEFAULT_CAMPAIGN_THREADS.length}`);

  // Campaign Locations
  await CampaignLocation.deleteMany({});
  await CampaignLocation.insertMany(locations.DEFAULT_CAMPAIGN_LOCATIONS);
  console.log(`✓ Campaign Locations: ${locations.DEFAULT_CAMPAIGN_LOCATIONS.length}`);

  // Class Presets — un doc por personaje
  await ClassPreset.deleteMany({});
  const presetDocs = Object.entries(presets.CLASS_PRESETS).map(([charId, data]) => ({ charId, data }));
  await ClassPreset.insertMany(presetDocs);
  console.log(`✓ Class Presets: ${presetDocs.length} personajes`);

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
