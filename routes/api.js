const { Router } = require('express');
const router = Router();
const crud = require('./crudFactory');
const requireDM     = require('../middleware/requireDM');
const requirePlayer = require('../middleware/requirePlayer');
const crypto        = require('crypto');

// ── Modelos ────────────────────────────────────────────────────────────────
const Item             = require('../models/Item');
const Condition        = require('../models/Condition');
const Npc              = require('../models/Npc');
const Monster          = require('../models/Monster');
const CampaignEvent    = require('../models/CampaignEvent');
const CampaignThread   = require('../models/CampaignThread');
const CampaignLocation = require('../models/CampaignLocation');
const ClassPreset      = require('../models/ClassPreset');
const Session          = require('../models/Session');
const StoryChapter     = require('../models/StoryChapter');
const StoryAct         = require('../models/StoryAct');
const CampaignState    = require('../models/CampaignState');
const Player           = require('../models/Player');

// ── Catálogos (CRUD estándar — GET público, escrituras requieren DM) ──────
router.use('/items',      crud(Item,             { protect: requireDM, playerFilter: { known: true } }));
router.use('/conditions', crud(Condition,         { protect: requireDM }));
router.use('/npcs',       crud(Npc,               { protect: requireDM }));
router.use('/monsters',   crud(Monster,           { protect: requireDM }));
router.use('/events',     crud(CampaignEvent,     { protect: requireDM, sort: { order: 1 } }));
router.use('/threads',    crud(CampaignThread,    { protect: requireDM, sort: { order: 1 } }));
router.use('/locations',  crud(CampaignLocation,  { protect: requireDM, sort: { order: 1 } }));

// ── Class Presets (id = charId: 'rac', 'relyo', etc.) ─────────────────────
router.use('/presets', crud(ClassPreset, { idField: 'charId', protect: requireDM }));

// Endpoint adicional: devuelve presets como objeto { rac: {...}, relyo: {...} }
// para mantener compatibilidad con el código que usa CLASS_PRESETS[charId]
router.get('/presets-map', async (req, res) => {
  try {
    const docs = await ClassPreset.find().lean();
    const map  = {};
    docs.forEach(d => { map[d.charId] = d.data; });
    res.json(map);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Sessions ───────────────────────────────────────────────────────────────
router.use('/sessions', crud(Session, { idField: 'number', protect: requireDM }));

// Agregar nota al stream de una sesión
router.post('/sessions/:number/notes', requireDM, async (req, res) => {
  try {
    const session = await Session.findOne({ number: req.params.number });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    session.notes.push(req.body);
    await session.save();
    res.status(201).json(session.notes[session.notes.length - 1]);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── Historia ───────────────────────────────────────────────────────────────
router.use('/story/chapters', crud(StoryChapter, { idField: 'number', protect: requireDM }));
router.use('/story/acts',     crud(StoryAct,     { idField: '_id',    protect: requireDM }));

// Devuelve historia completa ordenada: { chapters: [...], acts: [...] }
router.get('/story', async (req, res) => {
  try {
    const [chapters, acts] = await Promise.all([
      StoryChapter.find().sort({ number: 1 }).lean(),
      StoryAct.find().sort({ chapter: 1, order: 1 }).lean(),
    ]);
    res.json({ chapters, acts });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Campaign State (documento único) ──────────────────────────────────────
router.get('/state', async (req, res) => {
  try {
    const state = await CampaignState.findOne().lean();
    res.json(state || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/state', requireDM, async (req, res) => {
  try {
    const state = await CampaignState.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(state);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Actualizar solo el estado de un personaje específico
router.put('/state/character/:charId', requireDM, async (req, res) => {
  try {
    const update = {};
    Object.keys(req.body).forEach(k => {
      update[`characters.${req.params.charId}.${k}`] = req.body[k];
    });
    const state = await CampaignState.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true }
    );
    res.json(state.characters[req.params.charId] || {});
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── Players ────────────────────────────────────────────────────────────────

// Notas privadas — solo accesible por el propio jugador, ni el DM las ve
router.get('/players/me/notes', requirePlayer, async (req, res) => {
  try {
    const player = await Player.findById(req.session.playerId).lean();
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json({ notes: player.privateNotes || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/players/me/notes', requirePlayer, async (req, res) => {
  try {
    await Player.findByIdAndUpdate(req.session.playerId, { privateNotes: req.body.notes ?? '' });
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DM: crear jugador con token auto-generado
router.post('/players', requireDM, async (req, res) => {
  try {
    const { username, characterId } = req.body;
    const accessToken = crypto.randomUUID();
    const player = await Player.create({ username, characterId, accessToken });
    res.status(201).json(player);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DM: listar, obtener y borrar jugadores (GET público permite que el jugador logueado reciba su lista)
router.get('/players', requireDM, async (req, res) => {
  try {
    const players = await Player.find().lean();
    res.json(players);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/players/:username', requireDM, async (req, res) => {
  try {
    const doc = await Player.findOneAndDelete({ username: req.params.username });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
