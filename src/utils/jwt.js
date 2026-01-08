import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateToken = (payload) => {
  if (!env.jwt.jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload, env.jwt.jwtSecret, {
    expiresIn: env.jwt.jwtExpiresIn
  });
};
export const generateRefreshToken = (payload) =>{
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: '7d' });
}
  

export const verifyToken = (token) => {
  return jwt.verify(token, env.jwt.jwtSecret);
};
