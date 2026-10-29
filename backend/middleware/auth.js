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
 * Supports single or multiple roles; Admin role is also granted staff scanning privileges
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;
    const userRole = req.user.role;
    const hasRole = roles.includes(userRole) || (roles.includes('staff') && userRole === 'admin');

    if (!hasRole) {
      return res.status(403).json({
        error: `Forbidden. This action requires ${roles.join(' or ')} privileges.`
      });
    }
    next();
  };
}
