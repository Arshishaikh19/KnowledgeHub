import { DefaultSession, DefaultUser } from 'next-auth';

export type UserRole = 'admin' | 'manager' | 'member';

export interface AppUser extends DefaultUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      department: string;
      avatar?: string;
    } & DefaultSession['user'];
  }

  interface User extends AppUser {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    department: string;
    avatar?: string;
  }
}
