import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;       // Optional — Google users have no password
  role: 'user' | 'admin';
  googleId?: string;       // Google OAuth subject ID
  authProvider: 'email' | 'google' | 'both';
  subscription: {
    status: 'none' | 'active' | 'cancelled' | 'past_due';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String }, // Not required — Google users have none
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    googleId: { type: String, sparse: true }, // sparse = unique but allows null
    authProvider: {
      type: String,
      enum: ['email', 'google', 'both'],
      default: 'email',
    },
    subscription: {
      status: {
        type: String,
        enum: ['none', 'active', 'cancelled', 'past_due'],
        default: 'none',
      },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
      currentPeriodEnd: { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema);