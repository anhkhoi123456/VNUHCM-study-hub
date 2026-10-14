const express = require('express');
const { toDocument } = require('../serializers');

const ID_PATTERN = /^[A-Za-z0-9_-]{1,50}$/;

/** Routes for the signed-in user. `requireAuth` must populate `req.user`. */
function createMeRouter({ repo, requireAuth }) {
  const router = express.Router();
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.use(requireAuth);

  router.get('/', (req, res) => {
    const { id, email, displayName, role } = req.user;
    res.json({ id, email, displayName, role, emailVerified: true });
  });

  router.get('/saved-documents', async (req, res) => {
    const rows = await repo.listSavedDocuments(req.user.id);
    res.json({ documents: rows.map(toDocument) });
  });

  router.post('/saved-documents', express.json({ limit: '1kb' }), async (req, res) => {
    const documentId = req.body && req.body.documentId;
    if (typeof documentId !== 'string' || !ID_PATTERN.test(documentId)) {
      return res.status(400).json({ error: 'documentId is required', code: 'invalid_document_id' });
    }
    if (!(await repo.getDocument(documentId))) return res.status(404).json({ error: 'Not found' });
    const created = await repo.saveDocument(req.user.id, documentId);
    res.status(created ? 201 : 200).json({ documentId, saved: true });
  });

  router.delete('/saved-documents/:documentId', async (req, res) => {
    if (!ID_PATTERN.test(req.params.documentId)) return res.status(404).json({ error: 'Not found' });
    await repo.removeSavedDocument(req.user.id, req.params.documentId);
    res.status(204).end();
  });

  return router;
}

module.exports = { createMeRouter };
