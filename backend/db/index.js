import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mess_db';

let pool = null;
let isPostgres = false;

// Embedded fallback store for immediate out-of-the-box testing if Postgres is not running
class EmbeddedStore {
  constructor() {
    this.students = [];
    this.staff = [];
    this.meals = [];
    this.mess_entries = [];
    this.nextStudentId = 1;
    this.nextStaffId = 1;
    this.nextMealId = 1;
    this.nextEntryId = 1;
  }

  async query(text, params = []) {
    const sql = text.trim();
    const upper = sql.toUpperCase();

    // 1. SELECT * FROM staff WHERE username = $1
    if (upper.startsWith('SELECT') && upper.includes('FROM STAFF') && upper.includes('USERNAME = $1')) {
      const username = params[0];
      const row = this.staff.find(s => s.username.toLowerCase() === username.toLowerCase());
      return { rows: row ? [{ ...row }] : [] };
    }

    // 2. SELECT * FROM students WHERE roll_no = $1
    if (upper.startsWith('SELECT') && upper.includes('FROM STUDENTS') && upper.includes('ROLL_NO = $1')) {
      const roll_no = params[0];
      const row = this.students.find(s => s.roll_no.toLowerCase() === roll_no.toLowerCase());
      return { rows: row ? [{ ...row }] : [] };
    }

    // 3. SELECT * FROM students WHERE id = $1
    if (upper.startsWith('SELECT') && upper.includes('FROM STUDENTS') && upper.includes('ID = $1')) {
      const id = Number(params[0]);
      const row = this.students.find(s => s.id === id);
      return { rows: row ? [{ ...row }] : [] };
    }

    // 4. SELECT * FROM staff WHERE id = $1
    if (upper.startsWith('SELECT') && upper.includes('FROM STAFF') && upper.includes('ID = $1')) {
      const id = Number(params[0]);
      const row = this.staff.find(s => s.id === id);
      return { rows: row ? [{ ...row }] : [] };
    }

    // 4b. Today's stats per meal with COUNT(e.id)
    if (upper.startsWith('SELECT') && upper.includes('COUNT(E.ID)')) {
      const date = String(params[0]);
      const stats = this.meals.map(m => {
        const count = this.mess_entries.filter(e => e.meal_id === m.id && e.date === date).length;
        return {
          meal_id: m.id,
          meal_name: m.name,
          start_time: m.start_time,
          end_time: m.end_time,
          total_scans: count
        };
      });
      return { rows: stats };
    }

    // 5. SELECT * FROM meals ORDER BY start_time ASC
    if (upper.startsWith('SELECT') && upper.includes('FROM MEALS')) {
      if (upper.includes('WHERE ID = $1')) {
        const id = Number(params[0]);
        const row = this.meals.find(m => m.id === id);
        return { rows: row ? [{ ...row }] : [] };
      }
      return { rows: this.meals.map(m => ({ ...m })) };
    }

    // 6. Check existing mess_entries for student, meal, date
    if (upper.startsWith('SELECT') && upper.includes('FROM MESS_ENTRIES') && upper.includes('STUDENT_ID = $1') && upper.includes('MEAL_ID = $2') && upper.includes('DATE = $3')) {
      const studentId = Number(params[0]);
      const mealId = Number(params[1]);
      const date = String(params[2]);
      const rows = this.mess_entries.filter(e => e.student_id === studentId && e.meal_id === mealId && e.date === date);
      return { rows: rows.map(r => ({ ...r })) };
    }

    // 7. Check if student already eaten today (all meals for student on date)
    if (upper.startsWith('SELECT') && upper.includes('FROM MESS_ENTRIES') && upper.includes('STUDENT_ID = $1') && upper.includes('DATE = $2')) {
      const studentId = Number(params[0]);
      const date = String(params[1]);
      const rows = this.mess_entries.filter(e => e.student_id === studentId && e.date === date);
      return { rows: rows.map(r => ({ ...r })) };
    }

    // 8. INSERT INTO mess_entries (student_id, meal_id, date, scanned_by, scanned_at)
    if (upper.startsWith('INSERT INTO MESS_ENTRIES')) {
      const studentId = Number(params[0]);
      const mealId = Number(params[1]);
      const date = String(params[2]);
      const scannedBy = params[3] ? Number(params[3]) : null;
      const scannedAt = params[4] || new Date().toISOString();

      // Enforce UNIQUE(student_id, meal_id, date) constraint!
      const existing = this.mess_entries.find(e => e.student_id === studentId && e.meal_id === mealId && e.date === date);
      if (existing) {
        const err = new Error('duplicate key value violates unique constraint "unique_student_meal_date"');
        err.code = '23505';
        err.constraint = 'unique_student_meal_date';
        throw err;
      }

      const newEntry = {
        id: this.nextEntryId++,
        student_id: studentId,
        meal_id: mealId,
        date: date,
        scanned_by: scannedBy,
        scanned_at: scannedAt
      };
      this.mess_entries.unshift(newEntry);
      return { rows: [{ ...newEntry }] };
    }

    // 9. INSERT INTO students
    if (upper.startsWith('INSERT INTO STUDENTS')) {
      const name = params[0];
      const roll_no = params[1];
      const hostel = params[2];
      const password_hash = params[3];
      const newStudent = {
        id: this.nextStudentId++,
        name,
        roll_no,
        hostel,
        password_hash,
        created_at: new Date().toISOString()
      };
      this.students.push(newStudent);
      return { rows: [newStudent] };
    }

    // 10. INSERT INTO staff
    if (upper.startsWith('INSERT INTO STAFF')) {
      const name = params[0];
      const username = params[1];
      const password_hash = params[2];
      const newStaff = {
        id: this.nextStaffId++,
        name,
        username,
        password_hash,
        created_at: new Date().toISOString()
      };
      this.staff.push(newStaff);
      return { rows: [newStaff] };
    }

    // 11. INSERT INTO meals
    if (upper.startsWith('INSERT INTO MEALS')) {
      const name = params[0];
      const start_time = params[1];
      const end_time = params[2];
      const newMeal = {
        id: this.nextMealId++,
        name,
        start_time,
        end_time
      };
      this.meals.push(newMeal);
      return { rows: [newMeal] };
    }

    // 12. Student history
    if (upper.startsWith('SELECT') && upper.includes('JOIN MEALS') && upper.includes('WHERE E.STUDENT_ID = $1')) {
      const studentId = Number(params[0]);
      const entries = this.mess_entries
        .filter(e => e.student_id === studentId)
        .map(e => {
          const meal = this.meals.find(m => m.id === e.meal_id) || {};
          const staffMember = this.staff.find(s => s.id === e.scanned_by) || {};
          return {
            id: e.id,
            date: e.date,
            scanned_at: e.scanned_at,
            meal_id: e.meal_id,
            meal_name: meal.name || 'Meal',
            start_time: meal.start_time,
            end_time: meal.end_time,
            scanned_by_name: staffMember.name || 'Counter Staff'
          };
        });
      return { rows: entries.slice(0, 30) };
    }

    // 13. Recent staff scans (last 10 scans)
    if (upper.startsWith('SELECT') && upper.includes('JOIN STUDENTS') && upper.includes('ORDER BY E.SCANNED_AT DESC LIMIT 10')) {
      const entries = this.mess_entries.slice(0, 10).map(e => {
        const student = this.students.find(s => s.id === e.student_id) || {};
        const meal = this.meals.find(m => m.id === e.meal_id) || {};
        const staffMember = this.staff.find(s => s.id === e.scanned_by) || {};
        return {
          id: e.id,
          student_id: e.student_id,
          student_name: student.name || 'Unknown',
          roll_no: student.roll_no || 'Unknown',
          hostel: student.hostel || 'Hostel',
          meal_id: e.meal_id,
          meal_name: meal.name || 'Meal',
          date: e.date,
          scanned_at: e.scanned_at,
          scanned_by_name: staffMember.name || 'Staff'
        };
      });
      return { rows: entries };
    }

    return { rows: [] };
  }
}

const embeddedDb = new EmbeddedStore();

// Try to initialize Postgres or fallback gracefully
export async function initDb() {
  try {
    const testPool = new Pool({
      connectionString,
      connectionTimeoutMillis: 3000
    });

    // Quick test query
    await testPool.query('SELECT NOW()');
    pool = testPool;
    isPostgres = true;
    console.log(`[Database] Successfully connected to PostgreSQL (${connectionString.replace(/:[^:@]+@/, ':****@')})`);

    // Execute schema migrations if PostgreSQL
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('[Database] PostgreSQL schema verified/initialized.');
    return true;
  } catch (err) {
    console.warn(`[Database] PostgreSQL connection failed (${err.message}). Using built-in persistent storage adapter.`);
    isPostgres = false;
    return false;
  }
}

export const db = {
  isPostgres: () => isPostgres,
  getEmbeddedStore: () => embeddedDb,
  query: async (text, params) => {
    if (isPostgres && pool) {
      return pool.query(text, params);
    }
    return embeddedDb.query(text, params);
  }
};

export default db;
