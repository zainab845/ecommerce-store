import mongoose, { Schema, Document } from 'mongoose';
import { isPageStatic } from 'next/dist/build/utils';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: mongoose.Types.ObjectId;
  stock: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  createdAt: Date;
  isPremiumOnly: boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number },
    images: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isPremiumOnly: { type: Boolean, default: false },
  },
  { timestamps: true }
);
// Add compound index for the most common query pattern
ProductSchema.index({ category: 1, createdAt: -1 });
ProductSchema.index({ isFeatured: 1, createdAt: -1 });
ProductSchema.index({ name: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ isPremiumOnly: 1 });
export default mongoose.models.Product ||
  mongoose.model<IProduct>('Product', ProductSchema);