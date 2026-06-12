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

const items     = require('./seed-data/items.js');
const conds     = require('./seed-data/conditions.js');
const npcs      = require('./seed-data/npcs.js');
const events    = require('./seed-data/campaign-events.js');
const threads   = require('./seed-data/campaign-threads.js');
const locations = require('./seed-data/campaign-locations.js');
const monsters  = require('./seed-data/monsters.js');
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
  await Item.insertMany(items);
  console.log(`✓ Items: ${items.length}`);

  // Conditions
  await Condition.deleteMany({});
  await Condition.insertMany(conds);
  console.log(`✓ Conditions: ${conds.length}`);

  // NPCs
  await Npc.deleteMany({});
  await Npc.insertMany(npcs);
  console.log(`✓ NPCs: ${npcs.length}`);

  // Monsters
  await Monster.deleteMany({});
  await Monster.insertMany(monsters.map(m => ({
    ...m, hpCurrent: m.hpMax, showInLive: true,
  })));
  console.log(`✓ Monsters: ${monsters.length}`);

  // Campaign Events
  await CampaignEvent.deleteMany({});
  await CampaignEvent.insertMany(events);
  console.log(`✓ Campaign Events: ${events.length}`);

  // Campaign Threads
  await CampaignThread.deleteMany({});
  await CampaignThread.insertMany(threads);
  console.log(`✓ Campaign Threads: ${threads.length}`);

  // Campaign Locations
  await CampaignLocation.deleteMany({});
  await CampaignLocation.insertMany(locations);
  console.log(`✓ Campaign Locations: ${locations.length}`);

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
