// Runs against a migrated + seeded SQL Server. Opt in with: RUN_DB_TESTS=1 npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const path = require('path');
const { createApp } = require('../src/app');
const { close } = require('../src/db');

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
