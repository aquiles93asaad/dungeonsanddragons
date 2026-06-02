function requirePlayer(req, res, next) {
  if (req.session && req.session.playerId) return next();
  res.status(401).json({ error: 'No autorizado. Iniciá sesión como jugador.' });
}

module.exports = requirePlayer;
