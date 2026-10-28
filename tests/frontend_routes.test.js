import request from 'supertest';
import app from '../backend/server.js';

describe('Frontend Multi-Page Entry Serving', () => {
  it('GET / serves the authentic MessMate landing and login page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('MessMate · The Kamar-Taj Refectory');
  });

  it('GET /student serves the student portal entry', async () => {
    const res = await request(app).get('/student');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Student Portal · MessMate');
  });

  it('GET /staff serves the staff scanner entry', async () => {
    const res = await request(app).get('/staff');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Mess Staff Scanner · MessMate');
  });

  it('GET /admin serves the admin portal entry', async () => {
    const res = await request(app).get('/admin');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Admin Portal · MessMate');
  });
});

