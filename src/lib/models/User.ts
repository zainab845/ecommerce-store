import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  subscription: {
    status: 'none' | 'active' | 'cancelled' | 'past_due';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
  };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
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