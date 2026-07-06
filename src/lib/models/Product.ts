import mongoose, { Schema, Document } from 'mongoose';

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
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text' });              // enables $regex search on name
ProductSchema.index({ category: 1 });               // filtering by category
ProductSchema.index({ isFeatured: 1 });             // home page featured query
ProductSchema.index({ price: 1 });                  // price sort
ProductSchema.index({ createdAt: -1 });             // default newest sort


export default mongoose.models.Product ||
  mongoose.model<IProduct>('Product', ProductSchema);