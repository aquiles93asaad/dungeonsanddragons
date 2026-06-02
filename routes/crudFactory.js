const { Router } = require('express');

/**
 * Genera un router con GET/POST/PUT/DELETE estándar para un modelo Mongoose.
 * idField: campo que actúa como id público (por defecto 'id')
 */
function crudRouter(Model, { idField = 'id', protect = null, playerFilter = null } = {}) {
  const router = Router();
  const auth = protect || ((req, res, next) => next());

  // GET all — público (playerFilter se aplica cuando no es DM)
  router.get('/', async (req, res) => {
    try {
      const filter = (!req.session?.isDM && playerFilter) ? playerFilter : {};
      const docs = await Model.find(filter).lean();
      res.json(docs);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // GET one — público
  router.get('/:id', async (req, res) => {
    try {
      const doc = await Model.findOne({ [idField]: req.params.id }).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // POST create — requiere auth
  router.post('/', auth, async (req, res) => {
    try {
      const doc = await Model.create(req.body);
      res.status(201).json(doc);
    } catch (e) { res.status(400).json({ error: e.message }); }
  });

  // PUT update — requiere auth
  router.put('/:id', auth, async (req, res) => {
    try {
      const doc = await Model.findOneAndUpdate(
        { [idField]: req.params.id },
        req.body,
        { new: true, runValidators: true }
      );
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    } catch (e) { res.status(400).json({ error: e.message }); }
  });

  // DELETE — requiere auth
  router.delete('/:id', auth, async (req, res) => {
    try {
      const doc = await Model.findOneAndDelete({ [idField]: req.params.id });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  return router;
}

module.exports = crudRouter;
