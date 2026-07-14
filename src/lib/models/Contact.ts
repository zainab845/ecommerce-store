import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email: string;
  subject?: string;
  message: string;
  replied: boolean;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true },
    replied: { type: Boolean, default: false },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Contact ||
  mongoose.model<IContact>('Contact', ContactSchema);