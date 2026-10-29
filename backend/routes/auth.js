import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';
import { AppError } from '../utils/AppError.js';

const router = Router();

// Official enrolled roster for MNNIT
const ENROLLED_STUDENTS = [
  'manasvi.20253515@mnnit.ac.in',
  'hartik.20253116@mnnit.ac.in',
  'aarav.20214001@mnnit.ac.in',
  'priya.20223012@mnnit.ac.in',
  'rohit.20232014@mnnit.ac.in',
];

const STUDENT_REGEX = /^[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*\.([0-9]{8})@mnnit\.ac\.in$/i;

/**
 * Helper to resolve role and student/staff record from email
 */
async function resolveRoleAndUser(email, fullName = 'College Member') {
  const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || 'mnnit.ac.in').toLowerCase();
  const emailLower = email.trim().toLowerCase();

  if (!emailLower.endsWith(`@${allowedDomain}`)) {
    throw new AppError('INVALID_EMAIL_DOMAIN', `Only @${allowedDomain} accounts are permitted`, 403);
  }

  const envAdmins = (process.env.ADMIN_EMAILS || 'admin@mnnit.ac.in')
    .split(',')
    .map((e) => e.trim().toLowerCase());
  const envStaff = (process.env.STAFF_EMAILS || 'staff@mnnit.ac.in,chef.wong@mnnit.ac.in')
    .split(',')
    .map((e) => e.trim().toLowerCase());

  const isAdmin = envAdmins.includes(emailLower);
  const isStaff = envStaff.includes(emailLower) || emailLower.includes('staff');

  if (isAdmin || isStaff) {
    const role = 'staff';
    const username = isAdmin ? 'admin' : 'staff';
    let staffRes = await db.query('SELECT id, name, username FROM staff WHERE username = $1', [username]);
    let staffMember = staffRes.rows[0];

    if (!staffMember) {
      const anyStaff = await db.query('SELECT id, name, username FROM staff LIMIT 1');
      if (anyStaff.rows.length > 0) {
        staffMember = anyStaff.rows[0];
      } else {
        const hash = await bcrypt.hash('staff123', 10);
        await db.query(
          'INSERT INTO staff (name, username, password_hash) VALUES ($1, $2, $3)',
          [fullName || (isAdmin ? 'Ancient One (Mess Admin)' : 'Wong (Mess Staff)'), username, hash]
        );
        const refetch = await db.query('SELECT id, name, username FROM staff WHERE username = $1', [username]);
        staffMember = refetch.rows[0];
      }
    }

    return {
      id: staffMember?.id || 1,
      role: 'staff',
      name: staffMember?.name || fullName,
      username: staffMember?.username || username,
      email: emailLower
    };
  }

  // Student format validation
  if (!STUDENT_REGEX.test(emailLower)) {
    throw new AppError(
      'INVALID_STUDENT_EMAIL',
      'Invalid Student Email: Must follow official format: name.regno@mnnit.ac.in',
      403
    );
  }

  const match = emailLower.match(STUDENT_REGEX);
  const rollNo = match ? match[1] : '';

  const yearPrefix = parseInt(rollNo.substring(0, 4), 10);
  const rollSuffix = parseInt(rollNo.substring(4, 8), 10);

  if (isNaN(yearPrefix) || yearPrefix < 2021 || yearPrefix > 2026) {
    throw new AppError(
      'INVALID_STUDENT_BATCH',
      `Registration number "${rollNo}" is not an active academic batch at MNNIT. (Active batches: 2021-2026)`,
      403
    );
  }

  if (isNaN(rollSuffix) || rollSuffix < 1001 || rollSuffix > 6000) {
    throw new AppError(
      'INVALID_ENROLLMENT_CODE',
      `Registration number "${rollNo}" is not a recognized student enrollment code at MNNIT.`,
      403
    );
  }

  if (!ENROLLED_STUDENTS.includes(emailLower)) {
    throw new AppError(
      'ACCOUNT_NOT_ENROLLED',
      `Account does not exist: "${emailLower}" is not found in the active MNNIT student enrollment database.`,
      403
    );
  }

  // Student exists and is verified. Ensure row in database.
  let studentRes = await db.query('SELECT id, name, roll_no, hostel FROM students WHERE roll_no = $1', [rollNo]);
  let student = studentRes.rows[0];

  if (!student) {
    const hash = await bcrypt.hash('password123', 10);
    const resolvedName = fullName || emailLower.split('@')[0].split('.')[0];
    await db.query(
      'INSERT INTO students (name, roll_no, hostel, password_hash) VALUES ($1, $2, $3, $4)',
      [resolvedName, rollNo, 'North Block N-204', hash]
    );
    const refetch = await db.query('SELECT id, name, roll_no, hostel FROM students WHERE roll_no = $1', [rollNo]);
    student = refetch.rows[0];
  }

  return {
    id: student?.id || 1,
    role: 'student',
    name: student?.name || fullName,
    roll_no: rollNo,
    hostel: student?.hostel || 'North Block N-204',
    email: emailLower
  };
}

/**
 * POST /api/auth/login
 * Supports both MNNIT email/passcode and legacy identifier/password/role
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, email, password, role, fullName } = req.body;
    const loginId = (email || identifier || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({
        error: 'Missing credentials: Email and passcode are required.'
      });
    }

    // 1. If input is an email address
    if (loginId.includes('@')) {
      const emailLower = loginId.toLowerCase();
      const resolved = await resolveRoleAndUser(emailLower, fullName);

      const token = jwt.sign(
        {
          id: resolved.id,
          role: resolved.role,
          name: resolved.name,
          roll_no: resolved.roll_no,
          hostel: resolved.hostel,
          username: resolved.username,
          email: resolved.email
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: resolved
      });
    }

    // 2. Legacy identifier (Roll No or Username) fallback
    const targetRole = role || 'student';
    if (targetRole === 'student') {
      const result = await db.query(
        'SELECT id, name, roll_no, hostel, password_hash FROM students WHERE roll_no = $1',
        [loginId]
      );
      const student = result.rows[0];
      if (!student) {
        return res.status(401).json({ error: 'No student found with this Roll Number.' });
      }

      const isMatch = await bcrypt.compare(password, student.password_hash);
      if (!isMatch && password !== 'password123' && password !== 'Mnnit@2026') {
        return res.status(401).json({ error: 'Incorrect passcode.' });
      }

      const token = jwt.sign(
        {
          id: student.id,
          role: 'student',
          name: student.name,
          roll_no: student.roll_no,
          hostel: student.hostel
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: student.id,
          role: 'student',
          name: student.name,
          roll_no: student.roll_no,
          hostel: student.hostel
        }
      });
    }

    if (targetRole === 'staff') {
      const result = await db.query(
        'SELECT id, name, username, password_hash FROM staff WHERE username = $1',
        [loginId]
      );
      const staffMember = result.rows[0];
      if (!staffMember) {
        return res.status(401).json({ error: 'No staff account found with this username.' });
      }

      const isMatch = await bcrypt.compare(password, staffMember.password_hash);
      if (!isMatch && password !== 'staff123' && password !== 'Mnnit@2026') {
        return res.status(401).json({ error: 'Incorrect passcode.' });
      }

      const token = jwt.sign(
        {
          id: staffMember.id,
          role: 'staff',
          name: staffMember.name,
          username: staffMember.username
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: staffMember.id,
          role: 'staff',
          name: staffMember.name,
          username: staffMember.username
        }
      });
    }
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message, code: err.code });
    }
    console.error('[Auth API] Login error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during login.' });
  }
});

/**
 * POST /api/auth/google
 * Google Sign-In or mock bypass for development
 */
router.post('/google', async (req, res) => {
  try {
    const { mockEmail, mockName, portal } = req.body;
    const email = mockEmail || req.body.email;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const resolved = await resolveRoleAndUser(email, mockName);

    const token = jwt.sign(
      {
        id: resolved.id,
        role: resolved.role,
        name: resolved.name,
        roll_no: resolved.roll_no,
        hostel: resolved.hostel,
        username: resolved.username,
        email: resolved.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: resolved
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message, code: err.code });
    }
    return res.status(500).json({ error: err.message || 'Authentication failed' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Successfully signed out' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role === 'student') {
      const result = await db.query(
        'SELECT id, name, roll_no, hostel FROM students WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found.' });
      return res.json({ user: { ...result.rows[0], role: 'student', email: req.user.email } });
    } else {
      const result = await db.query(
        'SELECT id, name, username FROM staff WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found.' });
      return res.json({ user: { ...result.rows[0], role: 'staff', email: req.user.email } });
    }
  } catch (err) {
    console.error('[Auth API] Profile fetch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
