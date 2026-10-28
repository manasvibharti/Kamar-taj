import request from 'supertest';
import app from '../backend/server.js';
import { resolveRoleAndUser } from '../backend/src/routes/auth.routes.js';

describe('Step 3: Auth & Role Resolution', () => {
  it('Rejects non-MNNIT domains with INVALID_EMAIL_DOMAIN', async () => {
    await expect(
      resolveRoleAndUser('stranger@gmail.com', 'Stranger')
    ).rejects.toMatchObject({
      code: 'INVALID_EMAIL_DOMAIN',
      statusCode: 403,
    });
  });

  it('Resolves admin email to ADMIN role', async () => {
    const user = await resolveRoleAndUser('admin@mnnit.ac.in', 'Admin Master');
    expect(user.role).toBe('ADMIN');
    expect(user.email).toBe('admin@mnnit.ac.in');
  });

  it('Resolves staff email to STAFF role', async () => {
    const user = await resolveRoleAndUser('staff@mnnit.ac.in', 'Mess Incharge');
    expect(user.role).toBe('STAFF');
  });

  it('Resolves student email with roll number to STUDENT role', async () => {
    const user = await resolveRoleAndUser('aarav.20214001@mnnit.ac.in', 'Aarav Sharma');
    expect(user.role).toBe('STUDENT');
    expect(user.roll_no).toBe('20214001');
  });

  it('Rejects unauthorized email format that is neither admin, staff nor student pattern', async () => {
    await expect(
      resolveRoleAndUser('random_no_roll_or_dot@mnnit.ac.in', 'Unknown')
    ).rejects.toMatchObject({
      code: 'EMAIL_NOT_AUTHORIZED',
      statusCode: 403,
    });
  });

  it('POST /api/v1/auth/google in dev mock mode logs in student and sets cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({
        mockEmail: 'priya.20214002@mnnit.ac.in',
        mockName: 'Priya Patel',
        portal: 'student',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('STUDENT');
    expect(res.body.user.rollNo).toBe('20214002');
    expect(res.headers['set-cookie']).toBeDefined();
    const cookies = res.headers['set-cookie'].join('; ');
    expect(cookies).toContain('rf_student=');
  });

  it('POST /api/v1/auth/logout successfully clears cookies', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('signed out');
  });
});

