const fs = require('fs');

/** Raised when Firebase is not usable on the server (missing/invalid service account). */
class AuthConfigError extends Error {}
/** Raised when a verified identity collides with another USERS row. */
class EmailConflictError extends Error {}

/**
 * Lazily initialises firebase-admin so the public endpoints keep working without credentials.
 * Returns `{ verify(token) }`; `verify` resolves to the decoded ID token.
 */
function createFirebaseVerifier(serviceAccountPath) {
  let auth;
  return {
    async verify(token) {
      if (!auth) {
        if (!serviceAccountPath) throw new AuthConfigError('FIREBASE_SERVICE_ACCOUNT_PATH is not set');
        let account;
        try {
          account = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        } catch (error) {
          throw new AuthConfigError(`Cannot read the Firebase service account: ${error.message}`);
        }
        const { initializeApp, cert } = require('firebase-admin/app');
        const { getAuth } = require('firebase-admin/auth');
        auth = getAuth(initializeApp({ credential: cert(account) }));
      }
      return auth.verifyIdToken(token);
    }
  };
}

const deny = (res, status, code, error) => res.status(status).json({ error, code });

/**
 * Express middleware factory. Verifies `Authorization: Bearer <Firebase ID token>`, enforces a
 * verified email and the optional domain allowlist, then upserts the USERS row into `req.user`.
 */
function createRequireAuth({ verifier, repo, allowedDomains = [] }) {
  const allowed = new Set(allowedDomains.map(d => d.toLowerCase()));
  return async function requireAuth(req, res, next) {
    const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '');
    if (!match) return deny(res, 401, 'missing_token', 'Authentication required');

    let token;
    try {
      token = await verifier.verify(match[1]);
    } catch (error) {
      if (error instanceof AuthConfigError) {
        console.error(error.message);
        return deny(res, 503, 'auth_not_configured', 'Authentication is not configured on the server');
      }
      return deny(res, 401, 'invalid_token', 'Invalid or expired token');
    }

    const email = typeof token.email === 'string' ? token.email.trim().toLowerCase() : '';
    if (!email || !token.uid) return deny(res, 403, 'email_required', 'An email address is required');
    // Checked before verification so people learn early that their address can never be used.
    if (allowed.size && !allowed.has(email.split('@').pop())) {
      return deny(res, 403, 'email_domain_not_allowed', 'This email domain is not allowed');
    }
    // Required for every provider; Google accounts always arrive verified.
    if (token.email_verified !== true) return deny(res, 403, 'email_not_verified', 'Verify your email address first');

    try {
      req.user = await repo.upsertUser({ uid: token.uid, email, name: typeof token.name === 'string' && token.name ? token.name.slice(0, 100) : null });
    } catch (error) {
      if (error instanceof EmailConflictError) return deny(res, 409, 'email_in_use', 'This email belongs to another account');
      throw error;
    }
    next();
  };
}

module.exports = { AuthConfigError, EmailConflictError, createFirebaseVerifier, createRequireAuth };
