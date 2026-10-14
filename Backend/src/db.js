const sql = require('mssql');
const config = require('./config');

let pool;

/** Lazily creates one shared connection pool. */
async function getPool() {
  if (!pool) pool = await new sql.ConnectionPool(config.db).connect();
  return pool;
}

async function close() {
  if (pool) await pool.close();
  pool = undefined;
}

/** Splits a T-SQL script on `GO` separator lines. */
function splitBatches(script) {
  return script.split(/^\s*GO\s*$/im).map(s => s.trim()).filter(Boolean);
}

module.exports = { sql, getPool, close, splitBatches };
