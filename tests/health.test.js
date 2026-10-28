import request from 'supertest';
import app from '../backend/server.js';
import { AppError } from '../backend/src/utils/AppError.js';
import { validate } from '../backend/src/middleware/validate.js';
import { z } from 'zod';
import express from 'express';
import { errorHandler } from '../backend/src/middleware/errorHandler.js';

describe('Step 1: Scaffold & Health Checks', () => {
  it('GET /health returns 200 and health object', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('serverNow');
    expect(res.body).toHaveProperty('uptime');
  });

  it('GET /api/v1/ping returns 200', async () => {
    const res = await request(app).get('/api/v1/ping');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Kamar-Taj');
  });

  it('AppError serializes correctly into {error: {code, message, details}} envelope', async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.get('/test-error', (req, res, next) => {
      next(new AppError('TEST_CODE', 'Custom error occurred', 400, { sample: 'detail' }));
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get('/test-error');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'TEST_CODE',
        message: 'Custom error occurred',
        details: { sample: 'detail' },
      },
    });
  });

  it('Zod validation middleware rejects invalid schemas with VALIDATION_ERROR', async () => {
    const testApp = express();
    testApp.use(express.json());

    const testSchema = z.object({
      body: z.object({
        mealSlotId: z.string().uuid(),
      }),
    });

    testApp.post('/test-validate', validate(testSchema), (req, res) => {
      res.json({ ok: true });
    });
    testApp.use(errorHandler);

    const res = await request(testApp).post('/test-validate').send({ mealSlotId: 'not-a-uuid' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });
});

