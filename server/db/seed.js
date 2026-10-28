import bcrypt from 'bcryptjs';
import db, { initDb } from './index.js';

export async function seed() {
  await initDb();
  console.log('[Seed] Seeding initial database data...');

  // Hash passwords
  const studentPasswordHash = await bcrypt.hash('password123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);

  // 1. Seed Meals
  const mealsData = [
    { name: 'Breakfast', start_time: '07:30:00', end_time: '09:30:00' },
    { name: 'Lunch', start_time: '12:30:00', end_time: '14:30:00' },
    { name: 'Dinner', start_time: '19:30:00', end_time: '21:30:00' }
  ];

  for (const meal of mealsData) {
    if (db.isPostgres()) {
      await db.query(
        `INSERT INTO meals (name, start_time, end_time) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (name) DO UPDATE SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time`,
        [meal.name, meal.start_time, meal.end_time]
      );
    } else {
      const store = db.getEmbeddedStore();
      const existing = store.meals.find(m => m.name === meal.name);
      if (!existing) {
        await db.query('INSERT INTO meals (name, start_time, end_time) VALUES ($1, $2, $3)', [meal.name, meal.start_time, meal.end_time]);
      }
    }
  }

  // 2. Seed Students
  const studentsData = [
    { name: 'Aarav Sharma', roll_no: 'CS21B042', hostel: 'North Block N-204', password_hash: studentPasswordHash },
    { name: 'Priya Patel', roll_no: 'CS21B018', hostel: 'North Block N-108', password_hash: studentPasswordHash },
    { name: 'Rohan Verma', roll_no: 'ME21B005', hostel: 'South Block S-301', password_hash: studentPasswordHash },
    { name: 'Ananya Iyer', roll_no: 'EE21B012', hostel: 'East Block E-204', password_hash: studentPasswordHash }
  ];

  for (const student of studentsData) {
    if (db.isPostgres()) {
      await db.query(
        `INSERT INTO students (name, roll_no, hostel, password_hash)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (roll_no) DO UPDATE SET name = EXCLUDED.name, hostel = EXCLUDED.hostel, password_hash = EXCLUDED.password_hash`,
        [student.name, student.roll_no, student.hostel, student.password_hash]
      );
    } else {
      const store = db.getEmbeddedStore();
      const existing = store.students.find(s => s.roll_no === student.roll_no);
      if (!existing) {
        await db.query('INSERT INTO students (name, roll_no, hostel, password_hash) VALUES ($1, $2, $3, $4)', [student.name, student.roll_no, student.hostel, student.password_hash]);
      }
    }
  }

  // 3. Seed Staff
  const staffData = [
    { name: 'Priya Mehta (Mess Secretary)', username: 'admin', password_hash: staffPasswordHash },
    { name: 'Rajesh Kumar (Counter 1)', username: 'counter1', password_hash: staffPasswordHash },
    { name: 'Vikram Singh (Counter 2)', username: 'staff', password_hash: staffPasswordHash }
  ];

  for (const s of staffData) {
    if (db.isPostgres()) {
      await db.query(
        `INSERT INTO staff (name, username, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`,
        [s.name, s.username, s.password_hash]
      );
    } else {
      const store = db.getEmbeddedStore();
      const existing = store.staff.find(st => st.username === s.username);
      if (!existing) {
        await db.query('INSERT INTO staff (name, username, password_hash) VALUES ($1, $2, $3)', [s.name, s.username, s.password_hash]);
      }
    }
  }

  // 4. Seed past attendance history for Aarav Sharma to populate the table
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const dayBefore = new Date(Date.now() - 172800000).toISOString().split('T')[0];

  const pastEntries = [
    { student_id: 1, meal_id: 1, date: yesterday, scanned_by: 1, scanned_at: `${yesterday}T08:12:00.000Z` },
    { student_id: 1, meal_id: 2, date: yesterday, scanned_by: 2, scanned_at: `${yesterday}T12:45:00.000Z` },
    { student_id: 1, meal_id: 3, date: yesterday, scanned_by: 1, scanned_at: `${yesterday}T19:42:00.000Z` },
    { student_id: 1, meal_id: 1, date: dayBefore, scanned_by: 2, scanned_at: `${dayBefore}T08:05:00.000Z` }
  ];

  for (const entry of pastEntries) {
    try {
      if (db.isPostgres()) {
        await db.query(
          `INSERT INTO mess_entries (student_id, meal_id, date, scanned_by, scanned_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [entry.student_id, entry.meal_id, entry.date, entry.scanned_by, entry.scanned_at]
        );
      } else {
        await db.query(
          'INSERT INTO mess_entries (student_id, meal_id, date, scanned_by, scanned_at) VALUES ($1, $2, $3, $4, $5)',
          [entry.student_id, entry.meal_id, entry.date, entry.scanned_by, entry.scanned_at]
        );
      }
    } catch {
      // Ignore conflict
    }
  }

  console.log('[Seed] Database successfully seeded!');
}

// Run if called directly
if (process.argv[1]?.endsWith('seed.js')) {
  seed().then(() => {
    console.log('[Seed] Completed.');
    process.exit(0);
  }).catch(err => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  });
}

