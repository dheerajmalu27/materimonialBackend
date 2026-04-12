import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const authGuard = (req, res, next) => {
  try {
    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.jwt.jwtSecret);
    req.user = decoded; // { id, email, gender }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
