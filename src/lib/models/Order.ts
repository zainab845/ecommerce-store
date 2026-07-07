import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    price: Number,
    quantity: Number,
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Paid', 'Cancelled'],
    default: 'Pending'
  },
  shippingAddress: {
    fullName: String,
    address: String,
    city: String,
    phone: String,
    location: { lat: Number, lng: Number }
  },
  paymentIntentId: String,
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'succeeded', 'failed'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);