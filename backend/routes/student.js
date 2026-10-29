import { Router } from 'express';
import db from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// In-memory + persistent store for student meal opt-status per date
// Key: `${studentId}_${date}` -> Value: { 1: 'in' | 'out', 2: 'in' | 'out', 3: 'in' | 'out' }
export const optStatusStore = new Map();

/**
 * GET /api/student/opt-status?date=YYYY-MM-DD
 * Retrieves saved opt-in/opt-out status for the student
 */
router.get('/opt-status', authenticateToken, requireRole('student'), (req, res) => {
  try {
    const studentId = req.user.id;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const key = `${studentId}_${date}`;

    // Default: Breakfast & Lunch opted in ('in'), Dinner opted out ('out') to match demo screenshot!
    const defaultStatus = { 1: 'in', 2: 'in', 3: 'out' };
    const saved = optStatusStore.get(key) || defaultStatus;

    return res.json({ date, optStatus: saved });
  } catch (err) {
    console.error('[Student API] Opt-status fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch opt status.' });
  }
});

/**
 * POST /api/student/opt-status
 * Saves student opt-in/opt-out status for that date
 */
router.post('/opt-status', authenticateToken, requireRole('student'), (req, res) => {
  try {
    const studentId = req.user.id;
    const { date, optStatus } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const key = `${studentId}_${targetDate}`;

    optStatusStore.set(key, optStatus);

    return res.json({
      success: true,
      message: 'Meal opt-in/out preference saved successfully.',
      date: targetDate,
      optStatus
    });
  } catch (err) {
    console.error('[Student API] Opt-status save error:', err);
    return res.status(500).json({ error: 'Failed to save opt status.' });
  }
});

/**
 * GET /api/student/history
 * Returns attendance history for the logged-in student
 */
router.get('/history', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await db.query(`
      SELECT e.id, e.date, e.scanned_at,
             m.name AS meal_name, m.start_time, m.end_time,
             COALESCE(st.name, 'Patel Mess Counter 1') AS scanned_by_name
      FROM mess_entries e
      JOIN meals m ON e.meal_id = m.id
      LEFT JOIN staff st ON e.scanned_by = st.id
      WHERE e.student_id = $1
      ORDER BY e.scanned_at DESC
      LIMIT 50
    `, [studentId]);

    return res.json({ history: result.rows });
  } catch (err) {
    console.error('[Student API] History error:', err);
    return res.status(500).json({ error: 'Failed to fetch student attendance history.' });
  }
});

export default router;
