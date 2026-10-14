const fs = require('fs');
const os = require('os');
const path = require('path');
const { EmailConflictError, AuthConfigError } = require('../src/auth');

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
  const users = [];
  const saved = []; // { userId, documentId }
  return {
    docs, users, saved,
    upsertUser: async ({ uid, email, name }) => {
      let user = users.find(u => u.firebaseUid === uid);
      if (!user) {
        if (users.some(u => u.email === email)) throw new EmailConflictError();
        user = { id: users.length + 1, email, displayName: name, role: 'student', firebaseUid: uid };
        users.push(user);
      } else if (name) user.displayName = name;
      return { ...user };
    },
    listSavedDocuments: async userId => saved.filter(s => s.userId === userId).reverse().map(s => docs[s.documentId]),
    saveDocument: async (userId, documentId) => {
      if (saved.some(s => s.userId === userId && s.documentId === documentId)) return false;
      saved.push({ userId, documentId });
      return true;
    },
    removeSavedDocument: async (userId, documentId) => {
      const i = saved.findIndex(s => s.userId === userId && s.documentId === documentId);
      if (i >= 0) saved.splice(i, 1);
    },
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

/**
 * Fake Firebase verifier. A token is the key of `identities`; unknown tokens are rejected like an
 * invalid/expired JWT. Never contacts Firebase.
 */
function fakeVerifier(extra = {}) {
  const identities = {
    alice: { uid: 'uid-alice', email: 'Alice@gm.uit.edu.vn', email_verified: true, name: 'Alice', firebase: { sign_in_provider: 'password' } },
    bob: { uid: 'uid-bob', email: 'bob@hcmut.edu.vn', email_verified: true, firebase: { sign_in_provider: 'google.com' } },
    unverified: { uid: 'uid-u', email: 'u@gm.uit.edu.vn', email_verified: false, firebase: { sign_in_provider: 'password' } },
    'unverified-google': { uid: 'uid-ug', email: 'ug@gm.uit.edu.vn', email_verified: false, firebase: { sign_in_provider: 'google.com' } },
    outsider: { uid: 'uid-o', email: 'o@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } },
    'no-email': { uid: 'uid-n', email_verified: true, firebase: { sign_in_provider: 'phone' } },
    'alice-clone': { uid: 'uid-clone', email: 'alice@gm.uit.edu.vn', email_verified: true, firebase: { sign_in_provider: 'google.com' } },
    ...extra
  };
  return { calls: [], async verify(token) {
    this.calls.push(token);
    if (token === 'unconfigured') throw new AuthConfigError('no service account');
    if (!identities[token]) throw new Error('Firebase ID token has expired');
    return structuredClone(identities[token]);
  } };
}

module.exports = { fakeRepo, fakeVerifier, makeStorage };
