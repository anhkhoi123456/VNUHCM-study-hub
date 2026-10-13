const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function context(extra = {}) {
  const ctx = vm.createContext({ ...extra });
  ctx.window = ctx;
  for (const file of ['js/templates.js', 'js/data/catalog.js', 'js/data/courses.js']) vm.runInContext(read(file), ctx);
  return ctx;
}
function element(value = 'all') {
  return { value, hidden: false, innerHTML: '', attrs: {}, listeners: {},
    addEventListener(type, callback) { this.listeners[type] = callback; },
    setAttribute(key, value) { this.attrs[key] = value; },
    getAttribute(key) { return this.attrs[key]; },
    classList: { toggle() {} }
  };
}

test('catalog templates retain routes, card counts, themes, and escape content', () => {
  const ctx = context(), templates = ctx.StudyHub, data = ctx.StudyHubCatalog;
  assert.equal(data.schools.length, 8);
  assert.equal(data.faculties.length, 6);
  assert.equal(data.majors.length, 3);
  assert.equal(data.subjects.length, 6);
  for (const item of [...data.faculties, ...data.majors]) {
    assert.match(item.theme, /^theme-(blue|purple|green|yellow|pink|orange)$/);
    assert.match(templates.folderCard(item), /class="faculty-card theme-/);
  }
  assert.equal(data.schools[0].href, 'uit-faculties.html');
  assert.equal(data.faculties[1].href, 'uit-is-majors.html');
  assert.equal(data.majors[1].href, 'uit-is-cttt-subjects.html');
  const dsa = data.subjects.find(item => item.id === 'ctdl');
  assert.equal(dsa.href, 'dsa.html');
  assert.equal(dsa.count, ctx.StudyHubCourses.ctdl.documents.length);
  assert.match(templates.subjectCard(dsa), /href="dsa.html"/);
  assert.equal(templates.normalize('Đại số tuyến tính'), 'dai so tuyen tinh');
  assert.equal(templates.escape('<script>"&'), '&lt;script&gt;&quot;&amp;');
  assert.match(templates.folderCard({ ...data.faculties[0], name: '<img onerror="bad">' }), /&lt;img/);
  assert.equal((templates.breadcrumbs(templates.path).match(/aria-current="page"/g) || []).length, 1);
});

test('all refactored HTML dependencies and data-driven links resolve locally', () => {
  const ctx = context();
  const pages = ['dashboard.html', 'uit-faculties.html', 'uit-is-majors.html', 'uit-is-cttt-subjects.html', 'library.html', 'dsa.html', 'file.html'];
  for (const page of pages) {
    const html = read(page);
    for (const [, link] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if (/^https?:/.test(link)) continue;
      assert.ok(fs.existsSync(path.resolve(root, link.split('?')[0])), `${page}: ${link}`);
    }
    assert.ok(html.indexOf('js/templates.js') < html.indexOf('js/app-shell.js'));
    assert.match(html, /data-app-sidebar/);
    assert.match(html, new RegExp(`data-active-nav="${page === 'library.html' ? 'library.html' : 'dashboard.html'}"`));
  }
  for (const item of [...ctx.StudyHubCatalog.schools, ...ctx.StudyHubCatalog.faculties, ...ctx.StudyHubCatalog.majors, ...ctx.StudyHubCatalog.subjects]) {
    if (item.href) assert.ok(fs.existsSync(path.join(root, item.href.split('?')[0])), item.href);
    if (item.image) assert.ok(fs.existsSync(path.resolve(root, item.image)), item.image);
  }
});

test('course page filters type and text together and links to the reusable file page', () => {
  const ids = Object.fromEntries(['courseDocuments', 'courseSearch', 'courseEmpty'].map(id => [id, element('')]));
  const buttons = ['all', 'PDF', 'PPTX'].map(type => ({ ...element(), dataset: { type } }));
  const main = { ...element(), dataset: { courseId: 'ctdl' }, querySelectorAll: () => buttons };
  const ctx = context({ document: { querySelector: () => main, getElementById: id => ids[id] } });
  vm.runInContext(read('js/course-detail.js'), ctx);
  const rows = () => (ids.courseDocuments.innerHTML.match(/<tr>/g) || []).length;
  assert.equal(rows(), 2);
  buttons[1].listeners.click(); assert.equal(rows(), 1);
  assert.match(ids.courseDocuments.innerHTML, /Tài liệu tổng hợp/);
  ids.courseSearch.value = 'slide'; ids.courseSearch.listeners.input(); assert.equal(rows(), 0);
  assert.equal(ids.courseEmpty.hidden, false);
  buttons[2].listeners.click(); assert.equal(rows(), 1);
  assert.equal(buttons[2].attrs['aria-pressed'], 'true');
  assert.match(ids.courseDocuments.innerHTML, /href="file.html\?document=ctdl-slides&amp;course=ctdl"/);
  assert.doesNotMatch(main.innerHTML, /documentDialog/);
});

test('subject filters, sorting, and saved state survive template refactor', () => {
  const ids = Object.fromEntries(['subjectSearch','semesterFilter','courseTypeFilter','lecturerFilter','subjectSort','subjectsEmpty','subjectFilters','subjectFiltersToggle'].map(id => [id, element()]));
  ids.subjectSearch.value = ''; ids.subjectSort.value = 'newest'; ids.subjectFiltersToggle.attrs['aria-expanded'] = 'true';
  const storage = new Map(); let appended = [];
  const ctx = context({ document: { getElementById: id => ids[id] }, localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }, showToast: () => {} });
  const cards = ctx.StudyHubCatalog.subjects.map(data => {
    const button = element(), parts = { span: {}, i: {} };
    button.querySelector = key => parts[key];
    return { dataset: { ...data }, button, querySelector: () => button };
  });
  ids.subjectGrid = { dataset: { subjectGroup: 'uit-is-cttt' }, querySelectorAll: () => cards, appendChild: card => appended.push(card) };
  vm.runInContext(read('js/subjects.js'), ctx);
  const visible = () => cards.filter(card => !card.hidden);
  assert.equal(visible().length, 6);
  ids.subjectSearch.value = 'dai so'; ids.subjectSearch.listeners.input(); assert.equal(visible()[0].dataset.id, 'dai-so-tuyen-tinh');
  ids.subjectSearch.value = ''; ids.semesterFilter.value = '2'; ids.lecturerFilter.value = 'Nguyễn Văn Hùng'; ids.semesterFilter.listeners.change(); assert.equal(visible().length, 1);
  ids.subjectSearch.value = 'missing'; ids.subjectSearch.listeners.input(); assert.equal(ids.subjectsEmpty.hidden, false);
  cards[0].button.listeners.click(); assert.equal(cards[0].button.attrs['aria-pressed'], 'true');
  assert.match(storage.get('studyhub:uit-is-cttt:saved-subjects'), /giai-tich/);
  cards[0].button.listeners.click(); assert.equal(cards[0].button.attrs['aria-pressed'], 'false');
  ids.subjectSort.value = 'oldest'; appended = []; ids.subjectSort.listeners.change(); assert.equal(appended[0].dataset.id, 'nhap-mon-lap-trinh');
  ids.subjectFiltersToggle.listeners.click({ currentTarget: ids.subjectFiltersToggle }); assert.equal(ids.subjectFilters.hidden, true);
});

test('folder renderer uses configuration and preserves accent-insensitive search', () => {
  for (const key of ['faculties', 'majors']) {
    const input = element(''), empty = element(), page = { ...element(), dataset: { catalogPage: key } };
    const ctx = context();
    const cards = ctx.StudyHubCatalog[key].map(item => ({ dataset: { name: item.name } }));
    page.querySelectorAll = () => cards; page.querySelector = () => empty;
    ctx.document = { querySelector: selector => selector === '[data-catalog-page]' ? page : null, getElementById: () => input };
    vm.runInContext(read('js/catalog-pages.js'), ctx);
    assert.equal((page.innerHTML.match(/class="faculty-card /g) || []).length, cards.length);
    input.value = 'he thong'; input.listeners.input();
    assert.equal(cards.filter(card => !card.hidden).length, key === 'faculties' ? 1 : 2);
    input.value = 'missing'; input.listeners.input(); assert.equal(empty.hidden, false);
  }
});

test('home hierarchy stays active and legacy pages still use filename navigation', () => {
  for (const [file, activeNav, expected] of [['dsa.html', 'dashboard.html', 'dashboard.html'], ['uit-is-majors.html', 'dashboard.html', 'dashboard.html'], ['library.html', 'library.html', 'library.html'], ['planner.html', undefined, 'planner.html']]) {
    const items = ['dashboard.html','library.html','planner.html'].map(page => ({ ...element(), dataset: { page }, removeAttribute(key) { delete this.attrs[key]; } }));
    const ctx = vm.createContext({ window: { location: { pathname: '/' + file } }, document: { body: { dataset: { activeNav } }, querySelectorAll: () => items, addEventListener() {} } });
    vm.runInContext(read('js/main.js'), ctx); ctx.setActiveNav();
    assert.equal(items.filter(item => item.attrs['aria-current'] === 'page').length, 1);
    assert.equal(items.find(item => item.attrs['aria-current'] === 'page').dataset.page, expected);
  }
});

function apiContext(fetch) {
  const ctx = context({ URL, URLSearchParams, AbortController, FormData, setTimeout, clearTimeout, fetch,
    location: { href: 'https://studyhub.test/file.html', protocol: 'https:' } });
  vm.runInContext(read('js/api-config.js'), ctx);
  vm.runInContext(read('js/services/documents-api.js'), ctx);
  return ctx;
}

test('document API stays disabled until configured and validates returned URLs', async () => {
  let requests = 0;
  const ctx = apiContext(async () => { requests++; return { ok: true, json: async () => ({ id: 'doc', title: 'File', fileUrl: '/content/doc' }) }; });
  await assert.rejects(ctx.StudyHubDocumentsApi.get('doc'), /Chưa kết nối/);
  assert.equal(requests, 0);
  ctx.StudyHubApiConfig.enabled = true;
  const record = await ctx.StudyHubDocumentsApi.get('doc');
  assert.equal(record.fileUrl, 'https://studyhub.test/content/doc');
  assert.throws(() => ctx.StudyHubDocumentsApi.normalize({ id: 'doc', title: 'File', fileUrl: 'javascript:alert(1)' }), /không hợp lệ/);
  assert.throws(() => ctx.StudyHubDocumentsApi.normalize({ title: 'Missing ID' }), /không hợp lệ/);
  assert.equal(ctx.StudyHubDocumentsApi.upload, undefined);
});

test('document API exposes missing/forbidden responses and request timeout', async () => {
  for (const [status, message] of [[404, /Không tìm thấy/], [403, /không có quyền/]]) {
    const ctx = apiContext(async () => ({ ok: false, status })); ctx.StudyHubApiConfig.enabled = true;
    await assert.rejects(ctx.StudyHubDocumentsApi.get('doc'), message);
  }
  const ctx = apiContext((url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(Object.assign(new Error(), { name: 'AbortError' })))));
  ctx.StudyHubApiConfig.enabled = true; ctx.StudyHubApiConfig.timeoutMs = 5;
  await assert.rejects(ctx.StudyHubDocumentsApi.get('doc'), /quá thời gian/);
});

async function viewerContext(enabled) {
  const ids = Object.fromEntries(['filePage', 'fileTitle', 'fileDescription', 'fileType', 'fileMaster', 'fileMetadata', 'fileBreadcrumb', 'fileStatus', 'fileSource', 'fileEmpty', 'fileEmptyTitle', 'fileEmptyMessage', 'pdfViewer', 'chooseFile', 'retryDocument', 'uploadFile', 'openFile', 'fileInput'].map(id => [id, { ...element(), removeAttribute(key) { delete this[key]; } }]));
  const record = { id: 'ctdl-master', title: 'From backend', courseId: 'ctdl', courseTitle: 'DSA', type: 'PDF', mimeType: 'application/pdf', fileUrl: 'https://studyhub.test/content/doc', description: 'Backend metadata' };
  const ctx = context({ URL, URLSearchParams,
    document: { getElementById: id => ids[id] },
    location: { search: '?document=ctdl-master&course=ctdl', href: 'https://studyhub.test/file.html?document=ctdl-master&course=ctdl' },
    history: { replaceState() {} }, addEventListener() {},
    StudyHubApiConfig: { enabled },
    StudyHubDocumentsApi: {
      get: async () => { if (!enabled) throw new Error('Chưa kết nối nguồn tài liệu.'); return record; },

    }
  });
  await vm.runInContext(read('js/file-viewer.js'), ctx);
  return { ids };
}

test('file page has no upload controls and explains an unconfigured backend', async () => {
  const { ids } = await viewerContext(false);
  assert.match(ids.fileStatus.textContent, /Chưa kết nối/);
  assert.doesNotMatch(ids.filePage.innerHTML, /chooseFile|uploadFile|fileInput|type="file"/);
  assert.equal(ids.pdfViewer.src, undefined);
});

test('file page embeds the backend URL directly and exposes the original file', async () => {
  const { ids } = await viewerContext(true);
  assert.equal(ids.fileTitle.textContent, 'From backend');
  assert.match(ids.pdfViewer.src, /^https:\/\/studyhub.test\/content\/doc#/);
  assert.equal(ids.openFile.href, 'https://studyhub.test/content/doc');
  assert.equal(ids.pdfViewer.hidden, false);
  assert.equal(ids.openFile.hidden, false);
  assert.equal(ids.fileEmpty.hidden, true);
  assert.match(ids.fileStatus.textContent, /Đã tải tài liệu/);
  await ids.retryDocument.listeners.click();
  assert.equal(ids.retryDocument.disabled, false);
});
