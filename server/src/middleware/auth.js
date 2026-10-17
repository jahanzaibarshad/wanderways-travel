import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { jwtSecret } from '../config/auth.js';

export async function authenticate(request, response, next) {
  const token =
    request.cookies?.wanderways_token || request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  try {
    if (!token) return response.status(401).json({ message: 'Please log in to continue' });
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'wanderways',
      audience: 'wanderways-client',
    });
    if (!mongoose.isValidObjectId(payload.sub)) throw new Error('Invalid user');
    const user = await User.findById(payload.sub);
    if (!user) return response.status(401).json({ message: 'Your session is no longer valid' });
    request.user = user;
    next();
  } catch (error) {
    if (
      ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name) ||
      error.message === 'Invalid user'
    ) {
      return response
        .status(401)
        .json({ message: 'Your session has expired. Please log in again' });
    }
    next(error);
  }
}

export function requireRole(role) {
  return (request, response, next) => {
    if (request.user.role !== role)
      return response.status(403).json({ message: 'You do not have access to this resource' });
    next();
  };
}
