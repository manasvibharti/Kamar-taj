import { pool, withTransaction } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

export async function seedDatabase() {
  console.log('[SEED] Seeding Kamar-Taj Refectory database...');

  await withTransaction(async (client) => {
    // 1. Seed Admin Emails
    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@mnnit.ac.in,mess.secretary@mnnit.ac.in')
      .split(',')
      .map((e) => e.trim());

    for (const email of adminEmails) {
      await client.query(
        `INSERT INTO admin_emails (email, added_by) VALUES ($1, 'SYSTEM') ON CONFLICT (email) DO NOTHING`,
        [email]
      );
    }

    // 2. Seed Staff Emails
    const staffEmails = ['staff@mnnit.ac.in', 'chef.wong@mnnit.ac.in'];
    for (const email of staffEmails) {
      await client.query(
        `INSERT INTO staff_emails (email, added_by) VALUES ($1, 'SYSTEM') ON CONFLICT (email) DO NOTHING`,
        [email]
      );
    }

    // 3. Seed Core Users
    // Admin
    const { rows: adminUserRows } = await client.query(
      `INSERT INTO users (email, full_name, role, dietary_pref)
       VALUES ($1, 'Master Sorcerer (Admin)', 'ADMIN', 'VEG')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [adminEmails[0]]
    );
    const adminId = adminUserRows[0].id;

    // Staff
    const { rows: staffUserRows } = await client.query(
      `INSERT INTO users (email, full_name, role, dietary_pref)
       VALUES ('staff@mnnit.ac.in', 'Wong (Mess Staff)', 'STAFF', 'VEG')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`
    );
    const staffId = staffUserRows[0].id;

    // Students (name.regno@mnnit.ac.in)
    const { rows: studentRows } = await client.query(
      `INSERT INTO users (email, full_name, role, roll_no, dietary_pref)
       VALUES 
        ('aarav.20214001@mnnit.ac.in', 'Aarav Sharma', 'STUDENT', '20214001', 'VEG'),
        ('priya.20214002@mnnit.ac.in', 'Priya Patel', 'STUDENT', '20214002', 'NON_VEG'),
        ('rohit.20214003@mnnit.ac.in', 'Rohit Verma', 'STUDENT', '20214003', 'VEG')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id, email`
    );
    const aaravId = studentRows.find((s) => s.email === 'aarav.20214001@mnnit.ac.in')?.id;

    // 4. Daily Fee Config
    await client.query(
      `INSERT INTO daily_fee_config (effective_from, fee_per_day, set_by)
       VALUES (CURRENT_DATE, 150.00, $1)`,
      [adminId]
    );

    // 5. Seed Meal Slots for Today and Tomorrow
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Slots: Breakfast (₹30), Lunch (₹60), Dinner (₹60)
    const slots = [
      {
        date: todayStr,
        type: 'BREAKFAST',
        fee: 30.0,
        cutoff: `${todayStr}T07:00:00Z`,
        start: `${todayStr}T07:30:00Z`,
        end: `${todayStr}T09:30:00Z`,
        menu: ['Poha', 'Banana', 'Masala Chai', 'Boiled Eggs / Sprouts'],
      },
      {
        date: todayStr,
        type: 'LUNCH',
        fee: 60.0,
        cutoff: `${todayStr}T11:00:00Z`,
        start: `${todayStr}T12:00:00Z`,
        end: `${todayStr}T14:30:00Z`,
        menu: ['Rajma', 'Steamed Rice', 'Roti', 'Fresh Green Salad', 'Boondi Raita'],
      },
      {
        date: todayStr,
        type: 'DINNER',
        fee: 60.0,
        cutoff: `${todayStr}T18:00:00Z`,
        start: `${todayStr}T19:30:00Z`,
        end: `${todayStr}T21:30:00Z`,
        menu: ['Paneer Butter Masala / Chicken Curry', 'Dal Tadka', 'Jeera Rice', 'Gulab Jamun'],
      },
      {
        date: tomorrowStr,
        type: 'BREAKFAST',
        fee: 30.0,
        cutoff: `${tomorrowStr}T07:00:00Z`,
        start: `${tomorrowStr}T07:30:00Z`,
        end: `${tomorrowStr}T09:30:00Z`,
        menu: ['Aloo Paratha', 'Curd', 'Pickle', 'Tea'],
      },
      {
        date: tomorrowStr,
        type: 'LUNCH',
        fee: 60.0,
        cutoff: `${tomorrowStr}T11:00:00Z`,
        start: `${tomorrowStr}T12:00:00Z`,
        end: `${tomorrowStr}T14:30:00Z`,
        menu: ['Chole', 'Bhature / Rice', 'Cucumber Salad'],
      },
      {
        date: tomorrowStr,
        type: 'DINNER',
        fee: 60.0,
        cutoff: `${tomorrowStr}T18:00:00Z`,
        start: `${tomorrowStr}T19:30:00Z`,
        end: `${tomorrowStr}T21:30:00Z`,
        menu: ['Mix Veg', 'Dal Makhani', 'Naan', 'Kheer'],
      },
    ];

    for (const slot of slots) {
      await client.query(
        `INSERT INTO meal_slots 
          (meal_date, meal_type, cancel_cutoff_at, service_start_at, service_end_at, capacity, menu, meal_fee, is_published)
         VALUES ($1, $2, $3, $4, $5, 250, $6::jsonb, $7, TRUE)
         ON CONFLICT (meal_date, meal_type) DO UPDATE SET
          menu = EXCLUDED.menu,
          meal_fee = EXCLUDED.meal_fee,
          is_published = TRUE`,
        [
          slot.date,
          slot.type,
          slot.cutoff,
          slot.start,
          slot.end,
          JSON.stringify(slot.menu),
          slot.fee,
        ]
      );
    }

    // 6. Seed Demo Grocery Expenses
    const groceries = [
      { item: 'Sona Masoori Rice', cat: 'Grains', qty: 100, unit: 'kg', amount: 6000.0, note: 'Campus Grains' },
      { item: 'Seasonal Vegetables', cat: 'Produce', qty: 80, unit: 'kg', amount: 2400.0, note: 'Daily Fresh Market' },
      { item: 'Paneer (Dairy)', cat: 'Dairy', qty: 12, unit: 'kg', amount: 3600.0, note: 'Mother Dairy Bulk' },
      { item: 'Toor Dal', cat: 'Pulses', qty: 20, unit: 'kg', amount: 2100.0, note: 'Standard Provisions' },
      { item: 'Bananas', cat: 'Fruits', qty: 20, unit: 'kg', amount: 1000.0, note: 'Local Mandi' },
    ];

    for (const g of groceries) {
      await client.query(
        `INSERT INTO grocery_expenses (item_name, category, quantity, unit, amount, note, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [g.item, g.cat, g.qty, g.unit, g.amount, g.note, adminId]
      );
    }

    // 7. Seed Initial Booking for Demo Student Aarav
    const { rows: lunchSlotRows } = await client.query(
      `SELECT id FROM meal_slots WHERE meal_date = $1 AND meal_type = 'LUNCH'`,
      [todayStr]
    );

    if (lunchSlotRows.length > 0 && aaravId) {
      const slotId = lunchSlotRows[0].id;
      const { rows: bookingRows } = await client.query(
        `INSERT INTO bookings (user_id, meal_slot_id, status)
         VALUES ($1, $2, 'BOOKED')
         ON CONFLICT (user_id, meal_slot_id) DO NOTHING
         RETURNING id`,
        [aaravId, slotId]
      );

      if (bookingRows.length > 0) {
        await client.query(
          `INSERT INTO ledger_entries (user_id, booking_id, entry_type, amount)
           VALUES ($1, $2, 'BOOKED', 60.00)`,
          [aaravId, bookingRows[0].id]
        );
      }
    }
  });

  console.log('[SEED] Seeding completed successfully.');
}

if (process.argv[1] === import.meta.url || process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('[SEED] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SEED_ERROR]', err);
      process.exit(1);
    });
}

