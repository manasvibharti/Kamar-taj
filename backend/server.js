import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import healthRoutes from './src/routes/health.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security and utility middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(express.json());
app.use(cookieParser());

// Base health route at /health and /api/v1/health
app.use('/', healthRoutes);
app.use('/api/v1', healthRoutes);

// Auth routes
app.use('/api/v1/auth', authRoutes);

// API router placeholder for future modules
const apiRouter = express.Router();
apiRouter.get('/ping', (req, res) => {
  res.json({ message: 'The Kamar-Taj Refectory API v1 operational' });
});
app.use('/api/v1', apiRouter);

// Serve built frontend assets
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// Multi-page entry routes
app.get('/student*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'student.html'));
});

app.get('/admin*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'admin.html'));
});

app.get('/staff*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'staff.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Single central error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Kamar-Taj Refectory] Server active on port ${PORT}`);
    console.log(`[Health check available at http://localhost:${PORT}/health]`);
  });
}

export default app;

