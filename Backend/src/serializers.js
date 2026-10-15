/** Maps repository rows to the JSON shapes documented in Frontend/README.md. */

function formatSize(bytes) {
  if (bytes == null) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = Number(bytes);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

function toDocument(row) {
  return {
    id: row.id,
    courseId: row.courseId,
    courseTitle: row.courseTitle || '',
    title: row.title,
    description: row.description || '',
    type: row.type,
    mimeType: row.mimeType || '',
    lecturer: row.lecturer || '',
    updated: row.updated || '',
    size: formatSize(row.sizeBytes),
    views: row.views,
    master: Boolean(row.isMaster),
    fileUrl: row.filePath ? `/api/documents/${encodeURIComponent(row.id)}/content` : null,
    previewUrl: row.previewPath ? `/api/documents/${encodeURIComponent(row.id)}/preview` : null
  };
}

/** Nests flat catalog rows into university > faculties > majors > courses. */
function toCatalog({ universities, faculties, majors, courses, formats }) {
  const group = (rows, key) => rows.reduce((map, row) => {
    (map[row[key]] ||= []).push(row);
    return map;
  }, {});
  const facultiesBy = group(faculties, 'parentId');
  const majorsBy = group(majors, 'parentId');
  const coursesBy = group(courses, 'parentId');
  const formatsBy = group(formats, 'courseId');
  const strip = ({ parentId, ...rest }) => rest;

  return {
    universities: universities.map(u => ({
      id: u.id,
      name: u.name || u.id,
      logoUrl: u.logoPath ? `/${u.logoPath}` : null,
      faculties: (facultiesBy[u.id] || []).map(f => ({
        ...strip(f),
        majors: (majorsBy[f.id] || []).map(m => ({
          ...strip(m),
          courses: (coursesBy[m.id] || []).map(c => ({
            ...strip(c),
            formats: (formatsBy[c.id] || []).map(x => x.type)
          }))
        }))
      }))
    }))
  };
}

module.exports = { formatSize, toDocument, toCatalog };
