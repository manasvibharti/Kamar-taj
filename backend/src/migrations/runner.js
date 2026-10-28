import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, withTransaction } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('[MIGRATIONS] Initializing PostgreSQL schema migrations...');

  // Ensure migrations table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const { rows: appliedRows } = await pool.query('SELECT name FROM migrations');
  const appliedSet = new Set(appliedRows.map((r) => r.name));

  const files = fs
    .readdirSync(__dirname)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (!appliedSet.has(file)) {
      console.log(`[MIGRATIONS] Applying ${file}...`);
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');

      await withTransaction(async (client) => {
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      });

      console.log(`[MIGRATIONS] Applied ${file} successfully.`);
      count++;
    }
  }

  if (count === 0) {
    console.log('[MIGRATIONS] Schema up to date. No pending migrations.');
  } else {
    console.log(`[MIGRATIONS] Applied ${count} migration(s).`);
  }
}

// Allow direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('[MIGRATIONS] Finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[MIGRATIONS_ERROR]', err);
      process.exit(1);
    });
}

