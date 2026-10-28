import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'mess_management_super_secret_jwt_key_2026';

/**
 * Authentication middleware to verify user login JWT
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Login session expired. Please log in again.' });
      }
      return res.status(403).json({ error: 'Invalid authentication token.' });
    }
    req.user = user;
    next();
  });
}

/**
 * Role authorization middleware
 * @param {'student'|'staff'} role 
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({
        error: `Forbidden. This action requires ${role} privileges.`
      });
    }
    next();
  };
}

