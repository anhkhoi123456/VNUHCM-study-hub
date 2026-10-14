// Runs against a migrated + seeded SQL Server. Opt in with: RUN_DB_TESTS=1 npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const path = require('path');
const { createApp } = require('../src/app');
const { close, getPool, sql } = require('../src/db');
const { fakeVerifier } = require('./helpers');

const skip = process.env.RUN_DB_TESTS === '1' ? false : 'set RUN_DB_TESTS=1 (needs migrated and seeded SQL Server)';
const app = () => createApp({ storageDir: path.join(__dirname, '..', 'storage') });

test('seeded data is served through the real repository', { skip }, async t => {
  t.after(close);
  const doc = await request(app()).get('/api/documents/ctdl-master').expect(200);
  assert.equal(doc.body.courseId, 'ctdl');
  assert.equal(doc.body.type, 'PDF');
  assert.equal(doc.body.master, true);
  const pdf = await request(app()).get(doc.body.fileUrl).expect(200);
  assert.equal(pdf.headers['content-type'], 'application/pdf');
  assert.ok(pdf.body.toString().startsWith('%PDF'));
  const slides = await request(app()).get('/api/documents/ctdl-slides').expect(200);
  await request(app()).get(slides.body.previewUrl).expect(200).expect('Content-Type', 'application/pdf');
  const catalog = await request(app()).get('/api/catalog').expect(200);
  const uit = catalog.body.universities.find(u => u.id === 'UIT');
  const cttt = uit.faculties.find(f => f.id === 'httt').majors.find(m => m.id === 'httt-cttt');
  assert.ok(cttt.courses.some(c => c.id === 'ctdl' && c.documentCount === 2));
  const list = await request(app()).get('/api/courses/ctdl/documents').expect(200);
  assert.deepEqual(list.body.documents.map(d => d.id).sort(), ['ctdl-master', 'ctdl-slides']);
});

test('auth against the real database: upsert, adopt legacy row, conflict, saved documents', { skip }, async t => {
  const pool = await getPool();
  const cleanup = () => pool.request().query(
    "DELETE FROM dbo.SAVED_DOCUMENT WHERE USER_ID IN (SELECT USER_ID FROM dbo.USERS WHERE EMAIL LIKE '%@itest.example'); DELETE FROM dbo.USERS WHERE EMAIL LIKE '%@itest.example'");
  await cleanup();
  t.after(async () => { await cleanup(); await close(); });
  const verifier = fakeVerifier({
    n: { uid: 'itest-new', email: 'new@itest.example', email_verified: true, name: 'New User', firebase: {} },
    l: { uid: 'itest-legacy', email: 'legacy@itest.example', email_verified: true, firebase: {} },
    c: { uid: 'itest-other', email: 'legacy@itest.example', email_verified: true, firebase: {} }
  });
  const api = createApp({ verifier, storageDir: path.join(__dirname, '..', 'storage'), allowedEmailDomains: ['itest.example'] });
  const as = (token, method = 'get', url = '/api/me') => request(api)[method](url).set('Authorization', `Bearer ${token}`);

  const me = (await as('n').expect(200)).body;
  assert.equal(me.email, 'new@itest.example');
  assert.equal(me.displayName, 'New User');
  assert.equal(me.role, 'student');
  assert.equal((await as('n').expect(200)).body.id, me.id); // second call: same row
  await as('alice').expect(403); // outside the allowlist

  await pool.request().query("INSERT dbo.USERS (EMAIL) VALUES ('legacy@itest.example')");
  const adopted = (await as('l').expect(200)).body;
  assert.equal(adopted.email, 'legacy@itest.example');
  await as('c').expect(409);
  const row = (await pool.request().query("SELECT FIREBASE_UID, LAST_LOGIN_AT FROM dbo.USERS WHERE EMAIL = 'legacy@itest.example'")).recordset[0];
  assert.equal(row.FIREBASE_UID, 'itest-legacy');
  assert.ok(row.LAST_LOGIN_AT);

  await as('n', 'post', '/api/me/saved-documents').send({ documentId: 'ctdl-master' }).expect(201);
  await as('n', 'post', '/api/me/saved-documents').send({ documentId: 'ctdl-master' }).expect(200);
  await as('n', 'post', '/api/me/saved-documents').send({ documentId: 'missing-doc' }).expect(404);
  assert.deepEqual((await as('n', 'get', '/api/me/saved-documents').expect(200)).body.documents.map(d => d.id), ['ctdl-master']);
  assert.equal((await as('l', 'get', '/api/me/saved-documents').expect(200)).body.documents.length, 0);
  await as('n', 'delete', '/api/me/saved-documents/ctdl-master').expect(204);
  assert.equal((await as('n', 'get', '/api/me/saved-documents')).body.documents.length, 0);
});
