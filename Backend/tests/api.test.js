const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');
const { formatSize } = require('../src/serializers');
const { fakeRepo, makeStorage } = require('./helpers');

const build = (options = {}) => createApp({ repo: fakeRepo(), storageDir: makeStorage(), ...options });

test('GET /api/documents/:id returns the documented contract', async () => {
  const res = await request(build()).get('/api/documents/ctdl-master').expect(200);
  assert.match(res.headers['content-type'], /application\/json/);
  assert.deepEqual(res.body, {
    id: 'ctdl-master', courseId: 'ctdl', courseTitle: 'CTDL', title: 'Master', description: 'd', type: 'PDF',
    mimeType: 'application/pdf', lecturer: 'L', updated: '2024-06-20', size: '12.4 MB', views: 1201, master: true,
    fileUrl: '/api/documents/ctdl-master/content', previewUrl: null
  });
});

test('metadata of an Office document points at its PDF preview', async () => {
  const res = await request(build()).get('/api/documents/ctdl-slides').expect(200);
  assert.equal(res.body.fileUrl, '/api/documents/ctdl-slides/content');
  assert.equal(res.body.previewUrl, '/api/documents/ctdl-slides/preview');
  assert.equal(res.body.master, false);
});

test('a record without files has null urls (frontend shows its empty state)', async () => {
  const res = await request(build()).get('/api/documents/no-file').expect(200);
  assert.equal(res.body.fileUrl, null);
  assert.equal(res.body.previewUrl, null);
});

test('each metadata read counts one view', async () => {
  const app = build();
  await request(app).get('/api/documents/ctdl-slides');
  const res = await request(app).get('/api/documents/ctdl-slides');
  assert.equal(res.body.views, 7);
});

test('unknown or malformed ids give a JSON 404', async () => {
  const app = build();
  for (const id of ['nope', 'a.b', '%2e%2e', 'x'.repeat(51)]) {
    const res = await request(app).get(`/api/documents/${id}`).expect(404);
    assert.deepEqual(res.body, { error: 'Not found' });
  }
});

test('GET /content serves a PDF inline with application/pdf', async () => {
  const res = await request(build()).get('/api/documents/ctdl-master/content').expect(200);
  assert.equal(res.headers['content-type'], 'application/pdf');
  assert.match(res.headers['content-disposition'], /^inline;/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
  assert.ok(res.body.toString().startsWith('%PDF'));
});

test('GET /content of a non-PDF keeps its mime type and is an attachment', async () => {
  const res = await request(build()).get('/api/documents/ctdl-slides/content').expect(200);
  assert.match(res.headers['content-type'], /presentationml\.presentation/);
  assert.match(res.headers['content-disposition'], /^attachment;/);
});

test('GET /preview serves the PDF representation inline; 404 when none', async () => {
  const app = build();
  const res = await request(app).get('/api/documents/ctdl-slides/preview').expect(200);
  assert.equal(res.headers['content-type'], 'application/pdf');
  assert.match(res.headers['content-disposition'], /^inline;/);
  await request(app).get('/api/documents/ctdl-master/preview').expect(404);
});

test('missing files, missing records and path traversal all give 404', async () => {
  const app = build();
  for (const id of ['no-file', 'missing-on-disk', 'escape', 'unknown']) {
    await request(app).get(`/api/documents/${id}/content`).expect(404);
  }
});

test('GET /api/catalog nests university > faculty > major > course', async () => {
  const { body } = await request(build()).get('/api/catalog').expect(200);
  const uit = body.universities.find(u => u.id === 'UIT');
  assert.equal(uit.logoUrl, '/resources/Logo/UIT.webp');
  assert.equal(body.universities.find(u => u.id === 'AGU').logoUrl, null);
  assert.deepEqual(body.universities.find(u => u.id === 'AGU').faculties, []);
  const course = uit.faculties[0].majors[0].courses[0];
  assert.equal(course.id, 'ctdl');
  assert.equal(course.documentCount, 2);
  assert.deepEqual(course.formats, ['PDF', 'PPTX']);
  assert.equal('parentId' in course, false);
});

test('GET /api/courses/:id/documents lists the course documents', async () => {
  const { body } = await request(build()).get('/api/courses/ctdl/documents').expect(200);
  assert.equal(body.id, 'ctdl');
  assert.ok(body.documents.some(d => d.id === 'ctdl-master' && d.master === true));
  assert.ok(body.documents.every(d => d.id && d.title));
  await request(build()).get('/api/courses/unknown/documents').expect(404);
});

test('unknown /api routes give JSON 404', async () => {
  const res = await request(build()).get('/api/whatever').expect(404);
  assert.deepEqual(res.body, { error: 'Not found' });
});

test('repository failures become a generic 500 without leaking details', async () => {
  const repo = fakeRepo();
  repo.getDocument = async () => { throw new Error('connection string secret'); };
  const original = console.error;
  console.error = () => {};
  try {
    const res = await request(createApp({ repo, storageDir: makeStorage() })).get('/api/documents/ctdl-master').expect(500);
    assert.deepEqual(res.body, { error: 'Internal server error' });
  } finally {
    console.error = original;
  }
});

test('CORS: any origin in development, only listed origins otherwise', async () => {
  const origin = 'http://localhost:5500';
  const dev = await request(build({ development: true })).get('/api/catalog').set('Origin', origin);
  assert.equal(dev.headers['access-control-allow-origin'], origin);
  assert.equal(dev.headers['access-control-allow-credentials'], 'true');
  const prod = await request(build({ development: false, corsOrigins: [] })).get('/api/catalog').set('Origin', origin);
  assert.equal(prod.headers['access-control-allow-origin'], undefined);
  const listed = await request(build({ development: false, corsOrigins: [origin] })).get('/api/catalog').set('Origin', origin);
  assert.equal(listed.headers['access-control-allow-origin'], origin);
});

test('formatSize', () => {
  assert.equal(formatSize(null), '');
  assert.equal(formatSize(512), '512 B');
  assert.equal(formatSize(2962), '2.9 KB');
  assert.equal(formatSize(12.4 * 1024 * 1024), '12.4 MB');
});
