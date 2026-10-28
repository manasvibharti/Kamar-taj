import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 * Body: { identifier, password, role: 'student' | 'staff' }
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password || !role) {
      return res.status(400).json({
        error: 'Missing required fields: identifier (roll_no or username), password, and role are required.'
      });
    }

    if (role !== 'student' && role !== 'staff') {
      return res.status(400).json({ error: 'Invalid role. Must be "student" or "staff".' });
    }

    if (role === 'student') {
      // Find student by roll_no
      const result = await db.query(
        'SELECT id, name, roll_no, hostel, password_hash FROM students WHERE roll_no = $1',
        [identifier.trim()]
      );

      const student = result.rows[0];
      if (!student) {
        return res.status(401).json({ error: 'No student found with this Roll Number.' });
      }

      const isMatch = await bcrypt.compare(password, student.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password.' });
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

    if (role === 'staff') {
      // Find staff by username
      const result = await db.query(
        'SELECT id, name, username, password_hash FROM staff WHERE username = $1',
        [identifier.trim()]
      );

      const staffMember = result.rows[0];
      if (!staffMember) {
        return res.status(401).json({ error: 'No staff account found with this username.' });
      }

      const isMatch = await bcrypt.compare(password, staffMember.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password.' });
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
    console.error('[Auth API] Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
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
      return res.json({ user: { ...result.rows[0], role: 'student' } });
    } else {
      const result = await db.query(
        'SELECT id, name, username FROM staff WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found.' });
      return res.json({ user: { ...result.rows[0], role: 'staff' } });
    }
  } catch (err) {
    console.error('[Auth API] Profile fetch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

