import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { JWT_SECRET, authenticateToken, requireRole } from '../middleware/auth.js';
import { getTodayDateString, isCurrentTimeInWindow } from '../utils/timeUtils.js';

const router = Router();

/**
 * POST /api/scan
 * Validates scanned QR token in strict order specified:
 * 1. Only staff role can call it
 * 2. Verify JWT signature and expiry (60 seconds)
 * 3. Check token date equals today's date
 * 4. Check current time is inside the token meal's time window
 * 5. Insert into mess_entries; if UNIQUE constraint fails, return "Already eaten"
 * 6. Return student name, roll no, meal and status "Entry allowed"
 */
router.post('/', authenticateToken, requireRole('staff'), async (req, res) => {
  const mockTime = req.headers['x-mock-time'] || null;
  const mockDate = req.headers['x-mock-date'] || null;
  const today = getTodayDateString(mockDate);

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'Invalid QR',
        error: 'No QR token provided in request body.'
      });
    }

    // CHECK 2: Verify the JWT signature and expiry (60 seconds)
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(400).json({
          status: 'Expired QR',
          error: 'QR code has expired (>60s). Please ask the student to display the refreshed code.'
        });
      }
      return res.status(400).json({
        status: 'Invalid QR',
        error: 'Invalid QR code signature or corrupted QR data.'
      });
    }

    const { student_id, meal_id, date: tokenDate } = decoded;

    if (!student_id || !meal_id || !tokenDate) {
      return res.status(400).json({
        status: 'Invalid QR',
        error: 'QR code payload is missing required student or meal parameters.'
      });
    }

    // CHECK 3: Check token date equals today's date
    if (tokenDate !== today) {
      return res.status(400).json({
        status: 'Invalid QR',
        error: `QR code date (${tokenDate}) does not match current mess date (${today}). Old screenshots are invalid.`
      });
    }

    // Fetch meal details
    const mealResult = await db.query('SELECT id, name, start_time, end_time FROM meals WHERE id = $1', [meal_id]);
    if (mealResult.rows.length === 0) {
      return res.status(400).json({
        status: 'Invalid QR',
        error: 'Designated meal does not exist.'
      });
    }
    const meal = mealResult.rows[0];

    // CHECK 4: Check current time is inside the token meal's time window
    const insideTimeWindow = isCurrentTimeInWindow(meal.start_time, meal.end_time, mockTime);
    if (!insideTimeWindow) {
      return res.status(400).json({
        status: 'Wrong meal time',
        error: `Current time is outside the ${meal.name} window (${meal.start_time.slice(0, 5)} - ${meal.end_time.slice(0, 5)}).`,
        meal: meal.name,
        window: `${meal.start_time.slice(0, 5)} - ${meal.end_time.slice(0, 5)}`
      });
    }

    // Fetch student info for response and validation
    const studentResult = await db.query(
      'SELECT id, name, roll_no, hostel FROM students WHERE id = $1',
      [student_id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        status: 'Invalid QR',
        error: 'Student record could not be found.'
      });
    }
    const student = studentResult.rows[0];

    // CHECK 5: Insert into mess_entries; if UNIQUE constraint fails, return "Already eaten"
    try {
      const nowIso = new Date().toISOString();
      const insertResult = await db.query(
        `INSERT INTO mess_entries (student_id, meal_id, date, scanned_by, scanned_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, scanned_at`,
        [student_id, meal_id, today, req.user.id, nowIso]
      );

      const entry = insertResult.rows[0];

      // CHECK 6: Return student name, roll no, meal and status
      return res.status(200).json({
        status: 'Entry allowed',
        message: 'Attendance successfully verified and recorded.',
        student: {
          id: student.id,
          name: student.name,
          roll_no: student.roll_no,
          hostel: student.hostel
        },
        meal: {
          id: meal.id,
          name: meal.name
        },
        entry: {
          id: entry.id,
          scanned_at: entry.scanned_at,
          scanned_by_staff_id: req.user.id
        }
      });
    } catch (insertErr) {
      // Postgres error code 23505 = unique_violation
      if (insertErr.code === '23505' || insertErr.message?.includes('unique') || insertErr.message?.includes('duplicate')) {
        return res.status(409).json({
          status: 'Already eaten',
          error: `${student.name} (${student.roll_no}) has already taken ${meal.name} today.`,
          student: {
            name: student.name,
            roll_no: student.roll_no
          },
          meal: meal.name
        });
      }
      throw insertErr;
    }
  } catch (err) {
    console.error('[Scan API] Verification error:', err);
    return res.status(500).json({
      status: 'Server error',
      error: 'An unexpected internal error occurred during scan verification.'
    });
  }
});

/**
 * GET /api/scan/recent
 * Returns live list of last 10 scans for the staff dashboard
 */
router.get('/recent', authenticateToken, requireRole('staff'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.id, e.date, e.scanned_at,
             s.name AS student_name, s.roll_no, s.hostel,
             m.name AS meal_name,
             st.name AS scanned_by_name
      FROM mess_entries e
      JOIN students s ON e.student_id = s.id
      JOIN meals m ON e.meal_id = m.id
      LEFT JOIN staff st ON e.scanned_by = st.id
      ORDER BY e.scanned_at DESC
      LIMIT 10
    `);

    return res.json({ scans: result.rows });
  } catch (err) {
    console.error('[Scan API] Recent scans error:', err);
    return res.status(500).json({ error: 'Failed to fetch recent scans.' });
  }
});

export default router;

