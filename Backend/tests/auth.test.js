const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');
const { fakeRepo, fakeVerifier, makeStorage } = require('./helpers');

function build(options = {}) {
  const repo = fakeRepo();
  const verifier = fakeVerifier();
  const app = createApp({ repo, verifier, storageDir: makeStorage(), allowedEmailDomains: [], ...options });
  return { app, repo, verifier };
}
const as = (app, token, method = 'get', url = '/api/me') => request(app)[method](url).set('Authorization', `Bearer ${token}`);

test('GET /api/me without credentials is 401 and never reaches the verifier', async () => {
  const { app, verifier } = build();
  for (const header of [undefined, 'Basic abc', 'Bearer', 'Bearer a b']) {
    const req = request(app).get('/api/me');
    const res = await (header ? req.set('Authorization', header) : req).expect(401);
    assert.equal(res.body.code, 'missing_token');
  }
  assert.equal(verifier.calls.length, 0);
});

test('an invalid or expired token is 401', async () => {
  const res = await as(build().app, 'garbage').expect(401);
  assert.equal(res.body.code, 'invalid_token');
});

test('a valid token returns the profile and creates the user once', async () => {
  const { app, repo } = build();
  const first = await as(app, 'alice').expect(200);
  assert.deepEqual(first.body, { id: 1, email: 'alice@gm.uit.edu.vn', displayName: 'Alice', role: 'student', emailVerified: true });
  assert.equal(first.headers['cache-control'], 'no-store');
  await as(app, 'alice').expect(200);
  assert.equal(repo.users.length, 1);
  assert.equal(repo.users[0].firebaseUid, 'uid-alice');
  assert.equal(repo.users[0].role, 'student');
});

test('unverified email is rejected for every provider', async () => {
  const { app, repo } = build();
  for (const token of ['unverified', 'unverified-google']) {
    const res = await as(app, token).expect(403);
    assert.equal(res.body.code, 'email_not_verified');
  }
  assert.equal(repo.users.length, 0);
});

test('a token without an email is rejected', async () => {
  const res = await as(build().app, 'no-email').expect(403);
  assert.equal(res.body.code, 'email_required');
});

test('ALLOWED_EMAIL_DOMAINS: empty allows everyone', async () => {
  await as(build({ allowedEmailDomains: [] }).app, 'outsider').expect(200);
});

test('ALLOWED_EMAIL_DOMAINS restricts by exact domain, case-insensitively', async () => {
  const { app, repo } = build({ allowedEmailDomains: ['gm.uit.edu.vn', 'HCMUT.edu.vn'] });
  await as(app, 'alice').expect(200); // Alice@gm.uit.edu.vn
  await as(app, 'bob').expect(200);
  const res = await as(app, 'outsider').expect(403);
  assert.equal(res.body.code, 'email_domain_not_allowed');
  assert.equal(repo.users.some(u => u.email === 'o@gmail.com'), false);
});

test('the domain check does not accept look-alike domains', async () => {
  const verifier = fakeVerifier({
    sub: { uid: 'u1', email: 'x@evil.gm.uit.edu.vn', email_verified: true, firebase: {} },
    suffix: { uid: 'u2', email: 'x@notgm.uit.edu.vn', email_verified: true, firebase: {} }
  });
  const app = createApp({ repo: fakeRepo(), verifier, storageDir: makeStorage(), allowedEmailDomains: ['gm.uit.edu.vn'] });
  await as(app, 'sub').expect(403);
  await as(app, 'suffix').expect(403);
});

test('an email already owned by another account is a 409', async () => {
  const { app } = build();
  await as(app, 'alice').expect(200);
  const res = await as(app, 'alice-clone').expect(409);
  assert.equal(res.body.code, 'email_in_use');
});

test('missing server credentials give 503 on authenticated routes only', async () => {
  const { app } = build();
  const res = await as(app, 'unconfigured').expect(503);
  assert.equal(res.body.code, 'auth_not_configured');
  await request(app).get('/api/documents/ctdl-master').expect(200);
});

test('document and catalog endpoints stay public', async () => {
  const { app, verifier } = build({ allowedEmailDomains: ['gm.uit.edu.vn'] });
  for (const url of ['/api/documents/ctdl-master', '/api/documents/ctdl-master/content', '/api/catalog', '/api/courses/ctdl/documents']) {
    await request(app).get(url).expect(200);
  }
  assert.equal(verifier.calls.length, 0);
});

test('saved documents require authentication', async () => {
  const { app } = build();
  await request(app).get('/api/me/saved-documents').expect(401);
  await request(app).post('/api/me/saved-documents').send({ documentId: 'ctdl-master' }).expect(401);
  await request(app).delete('/api/me/saved-documents/ctdl-master').expect(401);
});

test('saved documents: save, list, idempotent save, delete', async () => {
  const { app } = build();
  assert.deepEqual((await as(app, 'alice', 'get', '/api/me/saved-documents').expect(200)).body, { documents: [] });
  await as(app, 'alice', 'post', '/api/me/saved-documents').send({ documentId: 'ctdl-master' }).expect(201);
  await as(app, 'alice', 'post', '/api/me/saved-documents').send({ documentId: 'ctdl-master' }).expect(200);
  await as(app, 'alice', 'post', '/api/me/saved-documents').send({ documentId: 'ctdl-slides' }).expect(201);
  const list = (await as(app, 'alice', 'get', '/api/me/saved-documents').expect(200)).body.documents;
  assert.deepEqual(list.map(d => d.id), ['ctdl-slides', 'ctdl-master']); // newest first
  assert.equal(list[0].fileUrl, '/api/documents/ctdl-slides/content'); // same shape as /api/documents/:id
  await as(app, 'alice', 'delete', '/api/me/saved-documents/ctdl-master').expect(204);
  await as(app, 'alice', 'delete', '/api/me/saved-documents/ctdl-master').expect(204);
  assert.deepEqual((await as(app, 'alice', 'get', '/api/me/saved-documents')).body.documents.map(d => d.id), ['ctdl-slides']);
});

test('saved documents are private per user', async () => {
  const { app } = build();
  await as(app, 'alice', 'post', '/api/me/saved-documents').send({ documentId: 'ctdl-master' }).expect(201);
  assert.deepEqual((await as(app, 'bob', 'get', '/api/me/saved-documents').expect(200)).body, { documents: [] });
  await as(app, 'bob', 'delete', '/api/me/saved-documents/ctdl-master').expect(204); // no effect on Alice
  assert.equal((await as(app, 'alice', 'get', '/api/me/saved-documents')).body.documents.length, 1);
});

test('saving validates the body and the document', async () => {
  const { app } = build();
  const post = body => as(app, 'alice', 'post', '/api/me/saved-documents').send(body);
  assert.equal((await post({}).expect(400)).body.code, 'invalid_document_id');
  await post({ documentId: 5 }).expect(400);
  await post({ documentId: '../x' }).expect(400);
  await post({ documentId: 'nope' }).expect(404);
  await as(app, 'alice', 'post', '/api/me/saved-documents').set('Content-Type', 'application/json').send('{bad').expect(400);
});
