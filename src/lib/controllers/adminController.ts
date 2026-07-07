import connectToDatabase from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import Category from '@/lib/models/Category';
import NotificationModel from '@/lib/models/Notification';

// === Orders ===
export async function getAllOrders() {
  await connectToDatabase();
  return await Order.find()
    .populate('user', 'name email')
    .populate('items.product', 'name price')
    .sort({ createdAt: -1 });
}

export async function getOrderById(id: string) {
  await connectToDatabase();
  
  try {
    // Try as full ObjectId
    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product');
    
    if (order) return order;
  } catch (e) {
    // Ignore cast error and try fallback
  }

  // Fallback for shortened ID
  const orders = await Order.find()
    .populate('user', 'name email')
    .populate('items.product');

  return orders.find(o => o._id.toString().includes(id)) || null;
}

export async function updateOrderStatus(id: string, status: 'Pending' | 'Accepted' | 'Paid' | 'Cancelled') {
  await connectToDatabase();
  return await Order.findByIdAndUpdate(
    id, 
    { status, updatedAt: new Date() },
    { new: true }
  );
}

// === Dashboard Stats ===
export async function getDashboardStats() {
  await connectToDatabase();

  const [totalOrders, totalRevenue, totalUsers, totalProducts] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    User.countDocuments(),
    Product.countDocuments(),
  ]);

  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    totalUsers,
    totalProducts,
    recentOrders
  };
}


function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// --- Products ---
export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  stock: number;
  isFeatured: boolean;
}) {
  await connectToDatabase();
  const slug = toSlug(data.name);
  return await Product.create({ ...data, slug });
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    images: string[];
    category: string;
    stock: number;
    isFeatured: boolean;
  }>
) {
  await connectToDatabase();
  const update: typeof data & { slug?: string } = { ...data };
  if (data.name) update.slug = toSlug(data.name);
  return await Product.findByIdAndUpdate(id, update, { new: true });
}

export async function deleteProduct(id: string) {
  await connectToDatabase();
  await Product.findByIdAndDelete(id);
}

// --- Categories ---
export async function createCategory(data: {
  name: string;
  description?: string;
  image?: string;
}) {
  await connectToDatabase();
  const slug = toSlug(data.name);
  return await Category.create({ ...data, slug });
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; description: string; image: string }>
) {
  await connectToDatabase();
  const update: typeof data & { slug?: string } = { ...data };
  if (data.name) update.slug = toSlug(data.name);
  return await Category.findByIdAndUpdate(id, update, { new: true });
}

export async function deleteCategory(id: string) {
  await connectToDatabase();
  await Category.findByIdAndDelete(id);
}
// === Notifications ===
export async function createNotification(data: {
  type: 'new_order' | 'order_status_change' | 'contact_form';
  title: string;
  message: string;
  orderId?: string;
}) {
  await connectToDatabase();
  return await NotificationModel.create(data);
}

export async function getNotifications() {
  await connectToDatabase();
  return await NotificationModel.find()
    .sort({ createdAt: -1 })
    .limit(20);
}

export async function markNotificationAsRead(id: string) {
  await connectToDatabase();
  return await NotificationModel.findByIdAndUpdate(id, { read: true }, { new: true });
}