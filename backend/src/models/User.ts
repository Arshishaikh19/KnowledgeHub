import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export type UserRole = 'admin' | 'manager' | 'member';

export interface IUser extends MongoDocument {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String },
    role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
    department: { type: String, required: true, index: true },
    avatar: { type: String },
  },
  {
    timestamps: true,
  }
);

// Compound index for department and role lookups
UserSchema.index({ department: 1, role: 1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
