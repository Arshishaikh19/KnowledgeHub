import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  department: string;
  avatar?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for Authorization Header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const secret = process.env.JWT_SECRET || 'knowledgehub_secret_key_2026';
      const decoded = jwt.verify(token, secret) as AuthUser;
      req.user = decoded;
      return next();
    } catch {
      // Invalid token, fall through to default/demo user
    }
  }

  // Check custom user headers from frontend session
  const userEmail = (req.headers['x-user-email'] as string) || '';
  const userName = (req.headers['x-user-name'] as string) || (userEmail ? userEmail.split('@')[0] : 'Workspace User');
  const userRole = (req.headers['x-user-role'] as AuthUser['role']) || 'member';
  const userDept = (req.headers['x-user-department'] as string) || 'General';

  req.user = {
    id: `usr_${userEmail ? userEmail.split('@')[0] : Date.now()}`,
    name: userName,
    email: userEmail.toLowerCase(),
    role: userRole,
    department: userDept,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName || 'User')}`,
  };

  next();
}
