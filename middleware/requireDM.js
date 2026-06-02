function requireDM(req, res, next) {
  if (req.session && req.session.isDM) return next();
  res.status(401).json({ error: 'No autorizado. Iniciá sesión como DM.' });
}

module.exports = requireDM;
