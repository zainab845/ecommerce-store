import Review from '@/lib/models/Review';
import Product from '@/lib/models/Product';

/**
 * Recalculate and persist averageRating + reviewCount on a product.
 * Called after any review create/update/delete.
 */
export async function recalculateRating(productId: string): Promise<void> {
  const stats = await Review.aggregate([
    { $match: { product: new (require('mongoose').Types.ObjectId)(productId), isHidden: false } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avg = stats[0]?.avg ?? 0;
  const count = stats[0]?.count ?? 0;

  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(avg * 10) / 10, // round to 1 decimal
    reviewCount: count,
  });
}