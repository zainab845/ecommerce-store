import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: {
    product: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  status: 'Pending' | 'Paid' | 'Accepted' | 'Refunded' | 'Cancelled';
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    phone: string;
  };
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Accepted', 'Refunded', 'Cancelled'],
      default: 'Pending',
    },
    shippingAddress: {
      fullName: String,
      address: String,
      city: String,
      phone: String,
    },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    refundReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Order ||
  mongoose.model<IOrder>('Order', OrderSchema);