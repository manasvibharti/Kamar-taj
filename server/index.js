import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import mealRoutes from './routes/meals.js';
import qrRoutes from './routes/qr.js';
import scanRoutes from './routes/scan.js';
import studentRoutes from './routes/student.js';
import { initDb } from './db/index.js';
import { seed } from './db/seed.js';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-mock-time', 'x-mock-date']
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/student', studentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Mess Management System API'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

// Initialize database and start server
export async function startServer(port = PORT) {
  try {
    await initDb();
    await seed();

    return new Promise((resolve) => {
      const server = app.listen(port, () => {
        console.log(`===============================================`);
        console.log(` 🍽️  Mess Management Backend Server running on:`);
        console.log(`    http://localhost:${port}`);
        console.log(`===============================================`);
        resolve(server);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

// Only auto-start if invoked directly as node index.js
if (process.argv[1]?.replace(/\\/g, '/').endsWith('server/index.js') || process.argv[1]?.replace(/\\/g, '/').endsWith('index.js')) {
  startServer();
}
