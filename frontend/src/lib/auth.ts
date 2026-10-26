import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { AppUser, UserRole } from '@/types/auth';

export const DEMO_USERS: Record<string, AppUser> = {
  'admin@knowledgehub.ai': {
    id: 'usr_admin_01',
    name: 'Sarah Connor',
    email: 'admin@knowledgehub.ai',
    role: 'admin',
    department: 'Legal & Executive',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  'eng@knowledgehub.ai': {
    id: 'usr_eng_02',
    name: 'David Chen',
    email: 'eng@knowledgehub.ai',
    role: 'manager',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  'hr@knowledgehub.ai': {
    id: 'usr_hr_03',
    name: 'Elena Rostova',
    email: 'hr@knowledgehub.ai',
    role: 'member',
    department: 'People Operations',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'KnowledgeHub Account',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@company.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const emailLower = credentials.email.toLowerCase().trim();
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

        // 1. Authenticate against Backend Express API / MongoDB
        try {
          const res = await fetch(`${apiBase}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: emailLower,
              password: credentials.password,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              return {
                id: data.user.id || data.user._id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role as UserRole,
                department: data.user.department,
                avatar: data.user.avatar,
              };
            }
          }

          // If backend returns 401 or user not found, reject login strictly
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as AppUser).role;
        token.department = (user as AppUser).department;
        token.avatar = (user as AppUser).avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.department = token.department as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'knowledgehub_ultra_secure_development_secret_2026',
};
