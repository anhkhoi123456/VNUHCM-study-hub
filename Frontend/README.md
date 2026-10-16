# StudyHub frontend templates

Buildless HTML/CSS/JavaScript. Open `dashboard.html` directly or serve the repository root with a static HTTP server. Serving the repository root keeps `../resources/` image paths available. No package installation or build is required.

## Navigation

`dashboard.html` → `uit-faculties.html` → `uit-is-majors.html` → `uit-is-cttt-subjects.html` → `dsa.html` → `file.html?document=ctdl-master&course=ctdl`.

The entire hierarchy highlights **Trang chủ**. `library.html` remains the separate **Kho tài liệu** tab. Existing routes are preserved.

## Shared code

| File | Responsibility |
| --- | --- |
| `js/app-shell.js` | Sidebar, profile, notification/avatar controls |
| `js/templates.js` | Escaping, search normalization, date formatting, breadcrumbs, school/folder/subject card templates |
| `js/data/catalog.js` | School/faculty/major/subject records, folder-page configuration and subject groups |
| `js/catalog-pages.js` | Render catalog templates and initialize folder search |
| `js/subjects.js` | Subject filtering, sorting and browser-local saved subjects |
| `js/data/courses.js` | Course metadata and document records |
| `js/course-detail.js` | Reusable course banner, document table, type/search filters and file-page links |

Page shells load scripts synchronously at the end of the body: `main.js`, `templates.js`, `app-shell.js`, data, renderer, page interactions. `dev-banner.js` can be loaded after these. Classic scripts deliberately support `file://` without fetch requests or ES module restrictions.

Add `data-app-sidebar` to the sidebar and `data-app-actions` to the header actions container. Set `data-active-nav="dashboard.html"` on the body for pages inside the home hierarchy; use `library.html` for the library.

## Add or change content

- Add schools or folder cards in `js/data/catalog.js`. A folder record contains `name`, `theme`, `href`, `icon`, and `count`. Schools without an `href` retain the development notification.
- To create a folder-list page, copy `uit-faculties.html`, add a new collection and `pages` entry to the catalog data, and set `data-catalog-page` on its main element. The same folder-card and search code handles it. A page definition supplies its title, subtitle, heading image/icon, breadcrumbs and collection key.
- Add a subject record to `subjects`, then include its ID in the appropriate `subjectGroups` array. Subject cards, lecturer choices and library subject names come from the same records. The subject record's `href` selects its destination. Semester/type filter choices currently live in the subject-page HTML; add choices there for additional classifications.
- To add another course detail page, copy `dsa.html`, set the main element's `data-course-id`, and add that ID to `js/data/courses.js`. Point the subject's `href` at the new page. The table and format counts are generated from its `documents`. `StudyHub.path` supplies the current UIT hierarchy's breadcrumb links.
- **Xem** opens the reusable `file.html` page with document and course IDs. File bytes/URLs and authoritative metadata come from the documents API described below. Course list metadata remains sample data until a course-list API is supplied.

Saved subjects use `localStorage`, scoped by subject group. They persist on the same browser/origin; this is not account storage or backend synchronization.

## Checks

Run from the repository root:

```sh
node Frontend/tests/frontend.test.cjs
```

The tests use Node's built-in test runner and VM DOM stubs: route/asset integrity, template escaping, active navigation, catalog rendering/search, course type/text filters and details, subject filters/sort/save behavior. They do not replace visual browser testing.

## File viewer and documents API

`file.html?document=<id>&course=<course-id>` displays an existing backend document. **Xem** on the DSA page opens this route. This page only reads documents: it has no file chooser, upload, creation, or replacement flow.

`js/api-config.js` controls the backend URL, credentials, metadata endpoint, and timeout. API access is **disabled by default**, since this repository has no document server yet. Set `enabled: true` when the endpoint exists, and serve the site over HTTP. To adapt another backend response, edit `js/services/documents-api.js`.

`GET /api/documents/:id` returns metadata and the actual backend file URL:

```json
{
  "id": "ctdl-master",
  "courseId": "ctdl",
  "courseTitle": "Cấu trúc dữ liệu và giải thuật",
  "title": "Tài liệu tổng hợp - Cấu trúc dữ liệu và giải thuật",
  "description": "Tổng hợp lý thuyết và bài tập.",
  "type": "PDF",
  "mimeType": "application/pdf",
  "lecturer": "Nguyễn Văn Hùng",
  "updated": "2024-06-20",
  "size": "12.4 MB",
  "views": 1200,
  "master": true,
  "fileUrl": "/api/documents/ctdl-master/content",
  "previewUrl": null
}
```

The DSA list currently uses sample IDs (`ctdl-master`, `ctdl-slides`); map those IDs to existing backend records or replace them with real IDs. `id` and `title` are required; other fields are optional. URLs can be HTTP(S), root-relative, or relative to the API base. `fileUrl` is the original backend file. An optional `previewUrl` must point to a PDF representation, including for Word/PowerPoint/Excel.

The iframe loads the backend PDF URL directly. The browser's native PDF viewer supplies thumbnails, search, page navigation, zoom and print where supported; appearance depends on the browser. Office files require a PDF preview for inline viewing; otherwise users can open the original backend file.

Serve PDFs inline with `Content-Type: application/pdf` and permit embedding in the file server's frame policy. Cookie/signed URL authentication works for embedded content; an iframe cannot add custom bearer headers. Cross-origin APIs need CORS and appropriate credential configuration. Missing records, unavailable files and connection errors have explicit states and retry behavior. No file content is fabricated or stored locally.


### Local admin preview

On the login page, choose **Sign in as Admin**, enter an email and a password of at least eight characters, then submit. These fields are validated for format only; this is a demo, not authentication. Admin sign-in opens `dsa.html` with Upload documents and Delete controls. Student sign-in opens the dashboard without those controls. Logout clears the role from session storage.

Uploads (PDF, PPTX, DOCX and XLSX, up to 20 MB) and deletion markers persist in IndexedDB in the current browser/origin. Uploaded PDFs can be viewed on the file page; Office files can be opened through the original-file link. Deleted sample documents are hidden locally; no server records or files are changed. Use HTTP localhost for reliable storage. Production admin access requires authenticated server sessions and authorization on write endpoints; the current backend remains read-only.
