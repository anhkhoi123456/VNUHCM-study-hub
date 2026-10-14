const { sql, getPool } = require('../db');
const { EmailConflictError } = require('../auth');

const DOCUMENT_COLUMNS = `d.DOCUMENT_ID AS id, d.COURSE_ID AS courseId, c.NAME AS courseTitle, d.TITLE AS title,
  d.[DESCRIPTION] AS description, d.[TYPE] AS type, d.MIME_TYPE AS mimeType, d.LECTURER AS lecturer,
  CONVERT(char(10), d.UPDATED, 23) AS updated, d.SIZE_BYTES AS sizeBytes, d.[VIEWS] AS views,
  d.IS_MASTER AS isMaster, d.FILE_PATH AS filePath, d.PREVIEW_PATH AS previewPath`;

/** SQL Server data access. Every query is parameterized. */
function createSqlRepository(getDb = getPool) {
  // Parameters default to VarChar; pass `types` ({ name: sql.Int }) to override per name.
  const query = async (text, params = {}, types = {}) => {
    const request = (await getDb()).request();
    for (const [name, value] of Object.entries(params)) request.input(name, types[name] || sql.VarChar, value);
    return (await request.query(text)).recordset || [];
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

    /**
     * Finds or creates the USERS row for a Firebase identity. A legacy row with the same email and
     * no uid is adopted; an email owned by another uid is a conflict. Writes only when something
     * changed (LAST_LOGIN_AT is refreshed at most every 5 minutes).
     */
    async upsertUser({ uid, email, name }) {
      const tx = new sql.Transaction(await getDb());
      await tx.begin();
      // Types match the column types so the unique index on FIREBASE_UID stays usable.
      const types = { uid: sql.VarChar(128), email: sql.NVarChar(254), name: sql.NVarChar(100), id: sql.Int };
      const run = async (text, params) => {
        const request = tx.request();
        for (const [key, value] of Object.entries(params)) request.input(key, types[key], value);
        return (await request.query(text)).recordset || [];
      };
      const columns = 'USER_ID AS id, EMAIL AS email, DISPLAY_NAME AS displayName, [ROLE] AS role, FIREBASE_UID AS firebaseUid';
      const touch = `LAST_LOGIN_AT = CASE WHEN LAST_LOGIN_AT IS NULL OR LAST_LOGIN_AT < DATEADD(minute, -5, SYSUTCDATETIME())
                                          THEN SYSUTCDATETIME() ELSE LAST_LOGIN_AT END`;
      try {
        let [user] = await run(`SELECT ${columns} FROM dbo.USERS WITH (UPDLOCK, HOLDLOCK) WHERE FIREBASE_UID = @uid`, { uid });
        if (!user) {
          const [legacy] = await run(`SELECT ${columns} FROM dbo.USERS WITH (UPDLOCK, HOLDLOCK) WHERE EMAIL = @email`, { email });
          if (legacy && legacy.firebaseUid) throw new EmailConflictError();
          if (legacy) {
            [user] = await run(`UPDATE dbo.USERS SET FIREBASE_UID = @uid, DISPLAY_NAME = COALESCE(@name, DISPLAY_NAME), ${touch}
                                OUTPUT inserted.USER_ID AS id, inserted.EMAIL AS email, inserted.DISPLAY_NAME AS displayName,
                                       inserted.[ROLE] AS role, inserted.FIREBASE_UID AS firebaseUid WHERE USER_ID = @id`,
              { uid, name, id: legacy.id });
          } else {
            [user] = await run(`INSERT dbo.USERS (EMAIL, DISPLAY_NAME, FIREBASE_UID, LAST_LOGIN_AT)
                                OUTPUT inserted.USER_ID AS id, inserted.EMAIL AS email, inserted.DISPLAY_NAME AS displayName,
                                       inserted.[ROLE] AS role, inserted.FIREBASE_UID AS firebaseUid
                                VALUES (@email, @name, @uid, SYSUTCDATETIME())`, { uid, email, name });
          }
        } else {
          const [fresh] = await run(
            'SELECT CASE WHEN LAST_LOGIN_AT IS NULL OR LAST_LOGIN_AT < DATEADD(minute, -5, SYSUTCDATETIME()) THEN 1 ELSE 0 END AS stale FROM dbo.USERS WHERE USER_ID = @id',
            { id: user.id });
          const changed = user.email.toLowerCase() !== email || (name && name !== user.displayName) || fresh.stale === 1;
          if (changed) {
            [user] = await run(`UPDATE dbo.USERS SET EMAIL = @email, DISPLAY_NAME = COALESCE(@name, DISPLAY_NAME), ${touch}
                                OUTPUT inserted.USER_ID AS id, inserted.EMAIL AS email, inserted.DISPLAY_NAME AS displayName,
                                       inserted.[ROLE] AS role, inserted.FIREBASE_UID AS firebaseUid WHERE USER_ID = @id`,
              { email, name, id: user.id });
          }
        }
        await tx.commit();
        return user;
      } catch (error) {
        await tx.rollback().catch(() => {});
        if (error.number === 2601 || error.number === 2627) throw new EmailConflictError();
        throw error;
      }
    },

    listSavedDocuments(userId) {
      return query(
        `SELECT ${DOCUMENT_COLUMNS} FROM dbo.SAVED_DOCUMENT s
         JOIN dbo.DOCUMENT d ON d.DOCUMENT_ID = s.DOCUMENT_ID JOIN dbo.COURSE c ON c.COURSE_ID = d.COURSE_ID
         WHERE s.USER_ID = @userId ORDER BY s.SAVED_AT DESC`, { userId }, { userId: sql.Int });
    },

    /** Returns true if newly saved, false if it already was. */
    async saveDocument(userId, documentId) {
      const rows = await query(
        `IF NOT EXISTS (SELECT 1 FROM dbo.SAVED_DOCUMENT WHERE USER_ID = @userId AND DOCUMENT_ID = @documentId)
           INSERT dbo.SAVED_DOCUMENT (USER_ID, DOCUMENT_ID) OUTPUT inserted.DOCUMENT_ID AS id VALUES (@userId, @documentId)`,
        { userId, documentId }, { userId: sql.Int }).catch(error => {
        if (error.number === 2627) return []; // concurrent duplicate: already saved
        throw error;
      });
      return rows.length > 0;
    },

    async removeSavedDocument(userId, documentId) {
      await query('DELETE dbo.SAVED_DOCUMENT WHERE USER_ID = @userId AND DOCUMENT_ID = @documentId',
        { userId, documentId }, { userId: sql.Int });
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
