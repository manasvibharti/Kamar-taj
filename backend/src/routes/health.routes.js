import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/health', async (req, res) => {
  let dbStatus = 'CONNECTED';
  let serverNow = new Date().toISOString();

  try {
    const result = await pool.query('SELECT NOW() as db_time');
    if (result.rows && result.rows.length > 0) {
      serverNow = result.rows[0].db_time;
    }
  } catch (err) {
    dbStatus = `DISCONNECTED (${err.message})`;
  }

  const isHealthy = dbStatus === 'CONNECTED';
  res.status(isHealthy ? 200 : 200).json({
    status: isHealthy ? 'UP' : 'DEGRADED',
    uptime: process.uptime(),
    serverNow,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;

