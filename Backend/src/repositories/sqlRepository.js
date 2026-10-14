const { sql, getPool } = require('../db');

const DOCUMENT_COLUMNS = `d.DOCUMENT_ID AS id, d.COURSE_ID AS courseId, c.NAME AS courseTitle, d.TITLE AS title,
  d.[DESCRIPTION] AS description, d.[TYPE] AS type, d.MIME_TYPE AS mimeType, d.LECTURER AS lecturer,
  CONVERT(char(10), d.UPDATED, 23) AS updated, d.SIZE_BYTES AS sizeBytes, d.[VIEWS] AS views,
  d.IS_MASTER AS isMaster, d.FILE_PATH AS filePath, d.PREVIEW_PATH AS previewPath`;

/** SQL Server data access. Every query is parameterized. */
function createSqlRepository(getDb = getPool) {
  const query = async (text, params = {}) => {
    const request = (await getDb()).request();
    for (const [name, value] of Object.entries(params)) request.input(name, sql.VarChar, value);
    return (await request.query(text)).recordset;
  };

  return {
    async getDocument(id) {
      const [row] = await query(
        `SELECT ${DOCUMENT_COLUMNS} FROM dbo.DOCUMENT d JOIN dbo.COURSE c ON c.COURSE_ID = d.COURSE_ID
         WHERE d.DOCUMENT_ID = @id`, { id });
      return row || null;
    },

    /** Atomically increments the counter and returns the new value (null if the document is gone). */
    async recordView(id) {
      const [row] = await query(
        'UPDATE dbo.DOCUMENT SET [VIEWS] = [VIEWS] + 1 OUTPUT inserted.[VIEWS] AS views WHERE DOCUMENT_ID = @id', { id });
      return row ? row.views : null;
    },

    async getCourse(id) {
      const [row] = await query(
        `SELECT COURSE_ID AS id, NAME AS title, LECTURER AS lecturer, CONVERT(char(10), UPDATED, 23) AS updated
         FROM dbo.COURSE WHERE COURSE_ID = @id`, { id });
      return row || null;
    },

    listCourseDocuments(courseId) {
      return query(
        `SELECT ${DOCUMENT_COLUMNS} FROM dbo.DOCUMENT d JOIN dbo.COURSE c ON c.COURSE_ID = d.COURSE_ID
         WHERE d.COURSE_ID = @courseId ORDER BY d.IS_MASTER DESC, d.UPDATED DESC, d.TITLE`, { courseId });
    },

    /** Flat rows for the university > faculty > major > course tree; nested by the route layer. */
    async getCatalogRows() {
      const [universities, faculties, majors, courses, formats] = await Promise.all([
        query('SELECT UNIVERSITY_ID AS id, NAME AS name, LOGO_PATH AS logoPath FROM dbo.UNIVERSITIES ORDER BY NAME'),
        query(`SELECT fc.UNIVERSITY_ID AS parentId, f.FACULTY_ID AS id, f.NAME AS name, f.THEME AS theme, f.ICON AS icon
               FROM dbo.FACULTY f JOIN dbo.FACULTY_CONTAINER fc ON fc.FACULTY_ID = f.FACULTY_ID ORDER BY f.NAME`),
        query(`SELECT mc.FACULTY_ID AS parentId, m.MAJOR_ID AS id, m.NAME AS name, m.THEME AS theme, m.ICON AS icon
               FROM dbo.MAJOR m JOIN dbo.MAJOR_CONTAINER mc ON mc.MAJOR_ID = m.MAJOR_ID ORDER BY m.NAME`),
        query(`SELECT cc.MAJOR_ID AS parentId, c.COURSE_ID AS id, c.NAME AS name, c.SEMESTER AS semester,
                      c.COURSE_TYPE AS type, c.LECTURER AS lecturer, CONVERT(char(10), c.UPDATED, 23) AS updated,
                      c.COLOR AS color, (SELECT COUNT(*) FROM dbo.DOCUMENT d WHERE d.COURSE_ID = c.COURSE_ID) AS documentCount
               FROM dbo.COURSE c JOIN dbo.COURSE_CONTAINER cc ON cc.COURSE_ID = c.COURSE_ID ORDER BY c.SEMESTER, c.NAME`),
        query('SELECT DISTINCT COURSE_ID AS courseId, [TYPE] AS type FROM dbo.DOCUMENT ORDER BY [TYPE]')
      ]);
      return { universities, faculties, majors, courses, formats };
    }
  };
}

module.exports = { createSqlRepository };
