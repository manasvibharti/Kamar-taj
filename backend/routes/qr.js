import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { JWT_SECRET, authenticateToken, requireRole } from '../middleware/auth.js';
import { getTodayDateString, isCurrentTimeInWindow } from '../utils/timeUtils.js';

const router = Router();

/**
 * GET /api/qr/:mealId
 * Generates a signed, single-use, 60-second time-rotating JWT for student mess attendance
 */
router.get('/:mealId', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const mealId = parseInt(req.params.mealId, 10);
    const studentId = req.user.id;
    const mockTime = req.headers['x-mock-time'] || null;
    const mockDate = req.headers['x-mock-date'] || null;
    const today = getTodayDateString(mockDate);

    if (isNaN(mealId)) {
      return res.status(400).json({ error: 'Invalid meal ID parameter.' });
    }

    // 1. Check meal exists
    const mealResult = await db.query('SELECT id, name, start_time, end_time FROM meals WHERE id = $1', [mealId]);
    if (mealResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found.' });
    }
    const meal = mealResult.rows[0];

    // 2. Check if student already ate that meal today
    const entryResult = await db.query(
      'SELECT id, scanned_at FROM mess_entries WHERE student_id = $1 AND meal_id = $2 AND date = $3',
      [studentId, mealId, today]
    );

    if (entryResult.rows.length > 0) {
      return res.status(400).json({
        error: 'Already eaten',
        message: `You have already recorded attendance for ${meal.name} today.`,
        scanned_at: entryResult.rows[0].scanned_at
      });
    }

    // 3. Check if meal is currently active (inside its time window)
    const active = isCurrentTimeInWindow(meal.start_time, meal.end_time, mockTime);
    if (!active) {
      return res.status(400).json({
        error: 'Wrong meal time',
        message: `${meal.name} is not currently active (${meal.start_time.slice(0, 5)} - ${meal.end_time.slice(0, 5)}).`,
        timing: `${meal.start_time.slice(0, 5)} - ${meal.end_time.slice(0, 5)}`
      });
    }

    // 4. Generate random nonce
    const nonce = crypto.randomBytes(16).toString('hex');

    // 5. Create signed JWT (Never plain text student credentials)
    // Payload: { student_id, meal_id, date, nonce }
    const qrPayload = {
      student_id: studentId,
      meal_id: meal.id,
      date: today,
      nonce: nonce
    };

    const token = jwt.sign(qrPayload, JWT_SECRET, { expiresIn: '60s' });

    return res.json({
      token,
      expiresIn: 60,
      refreshInterval: 30,
      meal: {
        id: meal.id,
        name: meal.name,
        start_time: meal.start_time,
        end_time: meal.end_time
      },
      date: today,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[QR API] Error generating QR token:', err);
    return res.status(500).json({ error: 'Failed to generate QR attendance token.' });
  }
});

export default router;

