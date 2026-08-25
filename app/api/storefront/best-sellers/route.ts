import { NextResponse } from 'next/server';
import { ProductQueries } from '@/lib/products/queries';
import { BEST_SELLERS_LIMIT } from '@/lib/products/best-sellers';

export async function GET() {
  const products = await ProductQueries.getBestSellers(BEST_SELLERS_LIMIT);
  return NextResponse.json({ products });
}
