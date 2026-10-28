import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Step 2: Migrations & Seed Verification', () => {
  it('001_initial_schema.sql exists and contains required tables and triggers', () => {
    const sqlPath = path.join(__dirname, '../backend/src/migrations/001_initial_schema.sql');
    expect(fs.existsSync(sqlPath)).toBe(true);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Required tables
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS admin_emails');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS staff_emails');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS meal_slots');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS bookings');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS check_ins');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS ledger_entries');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS audit_log');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS grocery_expenses');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS daily_fee_config');

    // Append-only trigger check
    expect(sql).toContain('trg_ledger_append_only');
    expect(sql).toContain('trg_audit_append_only');
    expect(sql).toContain('prevent_modification_trigger');

    // Constraints check
    expect(sql).toContain('ck_slot_times');
    expect(sql).toContain('uq_meal_slot_date_type');
    expect(sql).toContain('uq_user_meal_slot');
  });

  it('Migration runner exports runMigrations function', async () => {
    const runnerModule = await import('../backend/src/migrations/runner.js');
    expect(typeof runnerModule.runMigrations).toBe('function');
  });

  it('Seed script exports seedDatabase function', async () => {
    const seedModule = await import('../backend/src/migrations/seed.js');
    expect(typeof seedModule.seedDatabase).toBe('function');
  });
});

