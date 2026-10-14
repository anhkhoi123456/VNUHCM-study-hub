/** Applies database/structure.sql (baseline) then database/migrations/*.sql in order. */
const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const config = require('../config');
const { splitBatches } = require('../db');

const dbDir = path.join(__dirname, '..', '..', 'database');

async function run() {
  // Use a single connection: structure.sql switches database with USE.
  const master = new sql.ConnectionPool({ ...config.db, database: 'master', pool: { max: 1 } });
  await master.connect();
  try {
    const exec = text => master.request().batch(text);
    await exec(`IF DB_ID(N'${config.db.database.replace(/'/g, "''")}') IS NULL EXEC(N'CREATE DATABASE [${config.db.database.replace(/]/g, ']]')}]')`);
    await exec(`USE [${config.db.database.replace(/]/g, ']]')}]`);
    await exec(`IF OBJECT_ID(N'dbo.SCHEMA_MIGRATIONS') IS NULL
      CREATE TABLE dbo.SCHEMA_MIGRATIONS (NAME VARCHAR(200) NOT NULL PRIMARY KEY, APPLIED_AT DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME())`);

    const applied = new Set((await master.request().query('SELECT NAME FROM dbo.SCHEMA_MIGRATIONS')).recordset.map(r => r.NAME));
    const files = [
      { name: '000_structure.sql', file: path.join(dbDir, 'structure.sql'), baseline: true },
      ...fs.readdirSync(path.join(dbDir, 'migrations')).filter(f => f.endsWith('.sql')).sort()
        .map(f => ({ name: f, file: path.join(dbDir, 'migrations', f) }))
    ];

    for (const { name, file, baseline } of files) {
      if (applied.has(name)) { console.log(`skip   ${name}`); continue; }
      // A database created from structure.sql before this runner existed already has the tables.
      const legacy = baseline && (await master.request().query("SELECT OBJECT_ID(N'dbo.UNIVERSITIES') AS id")).recordset[0].id;
      if (!legacy) for (const batch of splitBatches(fs.readFileSync(file, 'utf8'))) await exec(batch);
      await exec(`USE [${config.db.database.replace(/]/g, ']]')}]`);
      await master.request().input('n', sql.VarChar, name).query('INSERT dbo.SCHEMA_MIGRATIONS (NAME) VALUES (@n)');
      console.log(`apply  ${name}`);
    }
  } finally {
    await master.close();
  }
}

run().catch(error => { console.error('Migration failed:', error.message); process.exit(1); });
