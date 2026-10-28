import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { query } from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const portal = (req.headers['x-portal'] || '').toLowerCase();
    // Support per-portal cookie rf_<portal> as well as rf_session / token fallback
    const token =
      (portal && req.cookies?.[`rf_${portal}`]) ||
      req.cookies?.rf_student ||
      req.cookies?.rf_admin ||
      req.cookies?.rf_staff ||
      req.cookies?.rf_session ||
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      throw new AppError('UNAUTHENTICATED', 'No active session found', 401);
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key');
    } catch {
      throw new AppError('UNAUTHENTICATED', 'Invalid or expired session token', 401);
    }

    const { rows } = await query(
      'SELECT id, email, full_name, role, is_active, token_version FROM users WHERE id = $1',
      [payload.userId]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      throw new AppError('UNAUTHENTICATED', 'User account not found or inactive', 401);
    }

    const user = rows[0];

    // Check tokenVersion for revocation
    if (user.token_version !== payload.tokenVersion) {
      throw new AppError('UNAUTHENTICATED', 'Session has been invalidated', 401);
    }

    // If portal header is explicitly provided, verify role matches portal
    if (portal) {
      const portalRole = portal.toUpperCase();
      if (user.role !== portalRole) {
        throw new AppError('FORBIDDEN', `Access forbidden: user role is ${user.role}, not ${portalRole}`, 403);
      }
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('UNAUTHENTICATED', 'Authentication required', 401));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('FORBIDDEN', `Role ${req.user.role} is not permitted to access this resource`, 403));
  }
  next();
};

