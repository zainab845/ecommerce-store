import dbConnect from '@/lib/db';
import Product from '@/lib/models/Product';

interface StockItem {
  product: string; // product ObjectId as string
  quantity: number;
}

/**
 * Check if all items have sufficient stock before checkout.
 * Returns null if all good, or an error message describing what's out of stock.
 */
export async function checkStock(items: StockItem[]): Promise<string | null> {
  await dbConnect();

  for (const item of items) {
    const product = await Product.findById(item.product)
      .select('name stock')
      .lean() as any;

    if (!product) {
      return `Product not found: ${item.product}`;
    }

    if (product.stock < item.quantity) {
      if (product.stock === 0) {
        return `"${product.name}" is out of stock.`;
      }
      return `Only ${product.stock} unit${product.stock !== 1 ? 's' : ''} of "${product.name}" available.`;
    }
  }

  return null; // all items are in stock
}

/**
 * Reduce stock for each item after a successful payment.
 * Uses $inc to safely decrement even under concurrent requests.
 */
export async function reduceStock(items: StockItem[]): Promise<void> {
  await dbConnect();

  const operations = items.map(item => ({
    updateOne: {
      filter: { _id: item.product, stock: { $gte: item.quantity } },
      update: { $inc: { stock: -item.quantity } },
    },
  }));

  await Product.bulkWrite(operations);
}

/**
 * Restore stock when an order is refunded or cancelled.
 */
export async function restoreStock(items: StockItem[]): Promise<void> {
  await dbConnect();

  const operations = items.map(item => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock: item.quantity } },
    },
  }));

  await Product.bulkWrite(operations);
}