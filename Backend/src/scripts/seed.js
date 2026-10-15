/** Applies database/seeds/*.sql in order. Seeds are idempotent (MERGE), so re-running is safe. */
const fs = require('fs');
const path = require('path');
const { getPool, close, splitBatches } = require('../db');

const seedDir = path.join(__dirname, '..', '..', 'database', 'seeds');

async function run() {
  const pool = await getPool();
  for (const file of fs.readdirSync(seedDir).filter(f => f.endsWith('.sql')).sort()) {
    for (const batch of splitBatches(fs.readFileSync(path.join(seedDir, file), 'utf8'))) {
      await pool.request().batch(batch);
    }
    console.log(`seeded ${file}`);
  }
}

run().catch(error => { console.error('Seed failed:', error.message); process.exitCode = 1; }).finally(close);
