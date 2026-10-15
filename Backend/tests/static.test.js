const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');
const { fakeRepo, makeStorage } = require('./helpers');

const app = createApp({ repo: fakeRepo(), storageDir: makeStorage() });

test('the frontend is served from the same origin', async () => {
  await request(app).get('/').expect(200);
  for (const page of ['dashboard.html', 'dsa.html', 'file.html?document=ctdl-master&course=ctdl', 'docs.html', 'js/api-config.js']) {
    await request(app).get(`/Frontend/${page}`).expect(200);
  }
  await request(app).get('/resources/Logo/UIT.webp').expect(200);
});

test('backend source, secrets and git data are not reachable', async () => {
  for (const url of ['/Backend/.env', '/backend/.env', '/Backend/package.json', '/Backend/storage/samples/ctdl-master.pdf',
    '/.git/config', '/Frontend/../Backend/.env', '/%2e%2e/Backend/.env', '/package.json']) {
    const res = await request(app).get(url);
    assert.equal(res.status, 404, url);
  }
});

test('CSP lets the frontend run: inline theme script, Font Awesome and Google Fonts', async () => {
  const csp = (await request(app).get('/Frontend/file.html')).headers['content-security-policy'];
  const directive = name => csp.split(';').find(d => d.startsWith(name));
  assert.match(directive('script-src'), /'unsafe-inline'/);
  assert.match(directive('script-src'), /https:\/\/cdnjs\.cloudflare\.com/);
  assert.match(directive('style-src'), /https:\/\/fonts\.googleapis\.com/);
  assert.match(directive('font-src'), /https:\/\/fonts\.gstatic\.com/);
  assert.match(directive('font-src'), /https:\/\/cdnjs\.cloudflare\.com/);
  assert.match(directive('frame-src'), /'self'/); // the PDF iframe is same-origin
  assert.doesNotMatch(csp, /upgrade-insecure-requests/); // would break plain-http localhost
});

test('api-config.js is served with the API enabled, while the repo file stays disabled', async () => {
  const repoFile = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'Frontend', 'js', 'api-config.js'), 'utf8');
  assert.match(repoFile, /enabled:\s*false/);
  for (const url of ['/Frontend/js/api-config.js', '/frontend/js/api-config.js', '/Frontend/js/api-config.js?v=1']) {
    const res = await request(app).get(url).expect(200);
    assert.match(res.headers['content-type'], /^application\/javascript/);
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.match(res.text, /enabled: true/);
    assert.doesNotMatch(res.text, /enabled:\s*false/);
    assert.equal(res.text, repoFile.replace('enabled: false', 'enabled: true')); // nothing else changed
  }
});
