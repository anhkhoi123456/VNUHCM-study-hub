const fs = require('fs');
const os = require('os');
const path = require('path');

const pdf = Buffer.from('%PDF-1.4\n% test\n');
const documents = {
  'ctdl-master': { id: 'ctdl-master', courseId: 'ctdl', courseTitle: 'CTDL', title: 'Master', description: 'd', type: 'PDF',
    mimeType: 'application/pdf', lecturer: 'L', updated: '2024-06-20', sizeBytes: 12.4 * 1024 * 1024, views: 1200, isMaster: true,
    filePath: 'samples/master.pdf', previewPath: null },
  'ctdl-slides': { id: 'ctdl-slides', courseId: 'ctdl', courseTitle: 'CTDL', title: 'Slides', description: '', type: 'PPTX',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', lecturer: 'L', updated: '2024-06-18',
    sizeBytes: 2048, views: 5, isMaster: false, filePath: 'samples/slides.pptx', previewPath: 'samples/slides.pdf' },
  'no-file': { id: 'no-file', courseId: 'ctdl', courseTitle: 'CTDL', title: 'No file', type: 'FILE', views: 0, isMaster: false,
    filePath: null, previewPath: null },
  'missing-on-disk': { id: 'missing-on-disk', courseId: 'ctdl', courseTitle: 'CTDL', title: 'Gone', type: 'PDF', views: 0,
    isMaster: false, filePath: 'samples/does-not-exist.pdf', previewPath: null },
  'escape': { id: 'escape', courseId: 'ctdl', courseTitle: 'CTDL', title: 'Escape', type: 'PDF', views: 0, isMaster: false,
    filePath: '../secret.txt', previewPath: null }
};

/** In-memory stand-in for the SQL repository. */
function fakeRepo() {
  const docs = structuredClone(documents);
  return {
    docs,
    getDocument: async id => docs[id] || null,
    recordView: async id => (docs[id] ? ++docs[id].views : null),
    getCourse: async id => (id === 'ctdl' ? { id: 'ctdl', title: 'CTDL', lecturer: 'L', updated: '2024-06-20' } : null),
    listCourseDocuments: async id => Object.values(docs).filter(d => d.courseId === id),
    getCatalogRows: async () => ({
      universities: [{ id: 'UIT', name: 'UIT', logoPath: 'resources/Logo/UIT.webp' }, { id: 'AGU', name: 'AGU', logoPath: null }],
      faculties: [{ parentId: 'UIT', id: 'httt', name: 'HTTT', theme: 'theme-purple', icon: 'i' }],
      majors: [{ parentId: 'httt', id: 'httt-cttt', name: 'CTTT', theme: 'theme-purple', icon: 'i' }],
      courses: [{ parentId: 'httt-cttt', id: 'ctdl', name: 'CTDL', semester: '2', type: 'co-so', lecturer: 'L', updated: '2024-06-20', color: 'pink', documentCount: 2 }],
      formats: [{ courseId: 'ctdl', type: 'PDF' }, { courseId: 'ctdl', type: 'PPTX' }]
    })
  };
}

/** Temp storage dir with the sample files, plus a file outside it that must never be served. */
function makeStorage() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'studyhub-'));
  const storage = path.join(root, 'storage');
  fs.mkdirSync(path.join(storage, 'samples'), { recursive: true });
  fs.writeFileSync(path.join(storage, 'samples', 'master.pdf'), pdf);
  fs.writeFileSync(path.join(storage, 'samples', 'slides.pdf'), pdf);
  fs.writeFileSync(path.join(storage, 'samples', 'slides.pptx'), 'PK-fake');
  fs.writeFileSync(path.join(root, 'secret.txt'), 'top secret');
  return storage;
}

module.exports = { fakeRepo, makeStorage };
