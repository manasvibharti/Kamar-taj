import { Router } from 'express';
import db from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { getTodayDateString, getCurrentTimeString, isCurrentTimeInWindow } from '../utils/timeUtils.js';

const router = Router();

/**
 * GET /api/meals
 * Returns list of meals with active status and whether student has already eaten
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const mockTime = req.headers['x-mock-time'] || null;
    const mockDate = req.headers['x-mock-date'] || null;
    const today = getTodayDateString(mockDate);
    const currentTime = getCurrentTimeString(mockTime);

    // Fetch all meals
    const mealsResult = await db.query('SELECT id, name, start_time, end_time FROM meals ORDER BY start_time ASC');
    const meals = mealsResult.rows;

    let eatenMealIds = new Set();
    if (req.user && req.user.role === 'student') {
      const entriesResult = await db.query(
        'SELECT meal_id FROM mess_entries WHERE student_id = $1 AND date = $2',
        [req.user.id, today]
      );
      eatenMealIds = new Set(entriesResult.rows.map(r => r.meal_id));
    }

    const enhancedMeals = meals.map(m => {
      const isActive = isCurrentTimeInWindow(m.start_time, m.end_time, mockTime);
      const hasEaten = eatenMealIds.has(m.id);
      return {
        id: m.id,
        name: m.name,
        start_time: m.start_time,
        end_time: m.end_time,
        is_active: isActive,
        has_eaten: hasEaten
      };
    });

    return res.json({
      date: today,
      current_time: currentTime,
      meals: enhancedMeals
    });
  } catch (err) {
    console.error('[Meals API] Error fetching meals:', err);
    return res.status(500).json({ error: 'Failed to fetch meals.' });
  }
});

/**
 * GET /api/meals/today-stats
 * For staff portal: returns total entries scanned for each meal today
 */
router.get('/today-stats', authenticateToken, async (req, res) => {
  try {
    const mockDate = req.headers['x-mock-date'] || null;
    const today = getTodayDateString(mockDate);

    // Count per meal
    const result = await db.query(
      `SELECT m.id AS meal_id, m.name AS meal_name, m.start_time, m.end_time,
              COUNT(e.id) AS total_scans
       FROM meals m
       LEFT JOIN mess_entries e ON m.id = e.meal_id AND e.date = $1
       GROUP BY m.id, m.name, m.start_time, m.end_time
       ORDER BY m.start_time ASC`,
      [today]
    );

    return res.json({
      date: today,
      stats: result.rows
    });
  } catch (err) {
    console.error('[Meals API] Error fetching stats:', err);
    return res.status(500).json({ error: 'Failed to fetch meal stats.' });
  }
});

export default router;
