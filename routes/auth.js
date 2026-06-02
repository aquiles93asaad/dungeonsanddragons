const { Router } = require('express');
const router = Router();
const Player = require('../models/Player');

// POST /api/auth/login — DM con password (devuelve el token para guardar en localStorage)
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.DM_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }
  req.session.isDM = true;
  res.json({ ok: true, token: process.env.DM_TOKEN });
});

// POST /api/auth/token-login — login silencioso vía token guardado en localStorage
router.post('/token-login', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ error: 'Token requerido.' });

    // ¿Es el token del DM?
    if (process.env.DM_TOKEN && token === process.env.DM_TOKEN) {
      req.session.isDM = true;
      return res.json({ ok: true, role: 'dm' });
    }

    // ¿Es el token de un jugador?
    const player = await Player.findOne({ accessToken: token.trim() }).lean();
    if (player) {
      req.session.playerId       = player._id.toString();
      req.session.characterId    = player.characterId;
      req.session.playerUsername = player.username;
      return res.json({ ok: true, role: 'player',
        username: player.username, characterId: player.characterId });
    }

    res.status(401).json({ error: 'Token inválido.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/player-login — jugador vía token
router.post('/player-login', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ error: 'Token requerido.' });
    const player = await Player.findOne({ accessToken: token.trim() }).lean();
    if (!player) return res.status(401).json({ error: 'Token inválido.' });
    req.session.playerId       = player._id.toString();
    req.session.characterId    = player.characterId;
    req.session.playerUsername = player.username;
    res.json({ ok: true, token: player.accessToken,
      username: player.username, characterId: player.characterId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// GET /api/auth/me — estado de sesión (DM o jugador)
router.get('/me', (req, res) => {
  res.json({
    isDM: !!(req.session && req.session.isDM),
    player: req.session?.playerId
      ? { username: req.session.playerUsername, characterId: req.session.characterId }
      : null,
  });
});

module.exports = router;
