const path = require('path');
const express = require('express');
const { toDocument, toCatalog } = require('../serializers');

const ID_PATTERN = /^[A-Za-z0-9_-]{1,50}$/;
const notFound = res => res.status(404).json({ error: 'Not found' });

/** Resolves a stored relative path inside the storage root; null if it escapes or is empty. */
function resolveStoragePath(storageDir, relative) {
  if (!relative) return null;
  const root = path.resolve(storageDir);
  const full = path.resolve(root, relative);
  return full.startsWith(root + path.sep) ? full : null;
}

function createApiRouter({ repo, storageDir }) {
  const router = express.Router();

  router.get('/health', (req, res) => res.json({ ok: true }));

  router.get('/catalog', async (req, res) => {
    res.json(toCatalog(await repo.getCatalogRows()));
  });

  router.get('/courses/:id/documents', async (req, res) => {
    if (!ID_PATTERN.test(req.params.id)) return notFound(res);
    const course = await repo.getCourse(req.params.id);
    if (!course) return notFound(res);
    const rows = await repo.listCourseDocuments(course.id);
    res.json({ ...course, documents: rows.map(toDocument) });
  });

  router.get('/documents/:id', async (req, res) => {
    if (!ID_PATTERN.test(req.params.id)) return notFound(res);
    const row = await repo.getDocument(req.params.id);
    if (!row) return notFound(res);
    const views = await repo.recordView(row.id);
    res.json(toDocument({ ...row, views: views ?? row.views }));
  });

  /** Streams a stored file. `inline` only for PDF; everything else is offered as a download. */
  function sendDocumentFile(column, { pdfOnly }) {
    return async (req, res) => {
      if (!ID_PATTERN.test(req.params.id)) return notFound(res);
      const row = await repo.getDocument(req.params.id);
      const full = row && resolveStoragePath(storageDir, row[column]);
      if (!full) return notFound(res);
      const mime = pdfOnly ? 'application/pdf' : row.mimeType || 'application/octet-stream';
      const inline = mime === 'application/pdf';
      const filename = encodeURIComponent(path.basename(full));
      res.set({
        'Content-Type': mime,
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${filename}`,
        'X-Content-Type-Options': 'nosniff'
      });
      res.sendFile(full, { dotfiles: 'deny' }, error => {
        if (error && !res.headersSent) notFound(res);
      });
    };
  }

  router.get('/documents/:id/content', sendDocumentFile('filePath', { pdfOnly: false }));
  router.get('/documents/:id/preview', sendDocumentFile('previewPath', { pdfOnly: true }));

  router.use((req, res) => notFound(res));
  return router;
}

module.exports = { createApiRouter, resolveStoragePath };
