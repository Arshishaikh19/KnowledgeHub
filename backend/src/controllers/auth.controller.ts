import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, IUser, UserRole } from '../models/User';
import { getDbConnectionStatus } from '../config/db';
import { env } from '../config/env';

// In-memory fallback users if Mongo is running offline
let inMemoryUsers: any[] = [
  {
    id: 'usr_admin_01',
    _id: 'usr_admin_01',
    name: 'Sarah Connor',
    email: 'admin@knowledgehub.ai',
    password: 'password123',
    role: 'admin',
    department: 'Legal',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
];

function generateToken(user: { id: string; email: string; role: string; department: string; name: string }) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
      name: user.name,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/register
 * Create a new user account with custom name, email, department, and role
 */
export async function registerUserController(req: Request, res: Response) {
  try {
    const { name, email, password, department, role } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Full Name is required and must be at least 2 characters long.' });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid Work Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailLower = email.toLowerCase().trim();
    if (!emailRegex.test(emailLower)) {
      return res.status(400).json({ error: 'Please provide a valid corporate email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const userRole: UserRole = ['admin', 'manager', 'member'].includes(role) ? role : 'member';
    const userDept = department || 'General';
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`;

    if (getDbConnectionStatus()) {
      // Check if user already exists
      const existing = await UserModel.findOne({ email: emailLower });
      if (existing) {
        return res.status(409).json({
          error: `An account with the email "${emailLower}" already exists. Please sign in or use another work email.`,
          code: 'USER_EXISTS',
        });
      }

      try {
        const newUser = await UserModel.create({
          name: name.trim(),
          email: emailLower,
          password: password,
          role: userRole,
          department: userDept,
          avatar,
        });

        const token = generateToken({
          id: String(newUser._id),
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          name: newUser.name,
        });

        return res.status(201).json({
          message: 'Account created successfully.',
          user: {
            id: String(newUser._id),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            department: newUser.department,
            avatar: newUser.avatar,
          },
          token,
        });
      } catch (dbErr: any) {
        if (dbErr.code === 11000) {
          return res.status(409).json({
            error: `An account with the email "${emailLower}" already exists. Please sign in or use another work email.`,
            code: 'USER_EXISTS',
          });
        }
        throw dbErr;
      }
    }

    // In-memory fallback
    const exists = inMemoryUsers.some((u) => u.email === emailLower);
    if (exists) {
      return res.status(409).json({
        error: `An account with the email "${emailLower}" already exists. Please sign in or use another work email.`,
        code: 'USER_EXISTS',
      });
    }

    const mockUser = {
      id: `usr_${Date.now()}`,
      _id: `usr_${Date.now()}`,
      name: name.trim(),
      email: emailLower,
      password,
      role: userRole,
      department: userDept,
      avatar,
      createdAt: new Date(),
    };
    inMemoryUsers.push(mockUser);

    const token = generateToken(mockUser);
    return res.status(201).json({
      message: 'Account created successfully.',
      user: mockUser,
      token,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Registration failed: ${errorMsg}` });
  }
}

/**
 * POST /api/auth/login
 * Verify user credentials and return JWT session
 */
export async function loginUserController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailLower = String(email).toLowerCase().trim();

    if (getDbConnectionStatus()) {
      const user = await UserModel.findOne({ email: emailLower });

      if (!user) {
        return res.status(401).json({
          error: `No account found for "${emailLower}". Please create an account first.`,
          code: 'USER_NOT_FOUND',
        });
      }

      // Check password
      if (user.password && user.password !== password) {
        return res.status(401).json({
          error: 'Invalid password. Please check your credentials.',
          code: 'INVALID_CREDENTIALS',
        });
      }

      const token = generateToken({
        id: String(user._id),
        email: user.email,
        role: user.role,
        department: user.department,
        name: user.name,
      });

      return res.json({
        message: 'Signed in successfully.',
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatar: user.avatar,
        },
        token,
      });
    }

    // In-memory fallback (only when MongoDB is offline)
    const user = inMemoryUsers.find((u) => u.email === emailLower);
    if (!user) {
      return res.status(401).json({
        error: `No account found for "${emailLower}". Please create an account first.`,
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.password && user.password !== password) {
      return res.status(401).json({
        error: 'Invalid password. Please check your credentials.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const token = generateToken(user);
    return res.json({
      message: 'Signed in successfully.',
      user,
      token,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Login failed: ${errorMsg}` });
  }
}

/**
 * GET /api/auth/users
 * Retrieve all registered users in the organization for permissions assignment
 */
export async function getUsersController(req: Request, res: Response) {
  try {
    if (getDbConnectionStatus()) {
      const users = await UserModel.find({}, { password: 0 }).sort({ name: 1 });
      return res.json({ users });
    }
    return res.json({ users: inMemoryUsers });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Failed to fetch users: ${errorMsg}` });
  }
}
