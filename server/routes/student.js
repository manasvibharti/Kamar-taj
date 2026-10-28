import { Router } from 'express';
import db from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

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
             COALESCE(st.name, 'North Block Counter') AS scanned_by_name
      FROM mess_entries e
      JOIN meals m ON e.meal_id = m.id
      LEFT JOIN staff st ON e.scanned_by = st.id
      WHERE e.student_id = $1
      ORDER BY e.scanned_at DESC
      LIMIT 20
    `, [studentId]);

    return res.json({ history: result.rows });
  } catch (err) {
    console.error('[Student API] History error:', err);
    return res.status(500).json({ error: 'Failed to fetch student attendance history.' });
  }
});

export default router;

