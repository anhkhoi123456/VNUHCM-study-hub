const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { createSqlRepository } = require('./repositories/sqlRepository');
const { createApiRouter } = require('./routes/api');

/**
 * helmet's default CSP would break the buildless frontend: every page has an inline theme
 * <script> in <head>, and Font Awesome / Google Fonts load from CDNs.
 */
const contentSecurityPolicy = {
  useDefaults: false,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'data:', 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    frameSrc: ["'self'"],
    objectSrc: ["'self'"], // the native PDF viewer may embed via <object>/<embed>
    frameAncestors: ["'self'"],
    baseUri: ["'self'"],
    formAction: ["'self'"]
  }
};

function createApp({
  repo = createSqlRepository(),
  storageDir = path.join(__dirname, '..', 'storage'),
  repoRoot = path.join(__dirname, '..', '..'),
  corsOrigins = config.corsOrigins,
  development = config.env !== 'production'
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy, crossOriginResourcePolicy: { policy: 'same-site' } }));
  // Development: reflect any origin. Elsewhere: only listed origins (same-origin needs no CORS).
  app.use('/api', cors({ origin: development ? true : corsOrigins, credentials: true }));
  app.use('/api', createApiRouter({ repo, storageDir }));

  // Same origin as the API. Only the site itself is public: an allowlist (not "serve the repo root")
  // keeps Backend/ (.env, source, storage), .git and node_modules unreachable, whatever the URL casing.
  app.get('/', (req, res) => res.sendFile(path.join(repoRoot, 'index.html')));
  for (const dir of ['Frontend', 'resources']) {
    app.use(`/${dir}`, express.static(path.join(repoRoot, dir), { dotfiles: 'ignore', index: false }));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

module.exports = { createApp, contentSecurityPolicy };
