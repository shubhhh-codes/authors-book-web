import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';
import { errorResponse, successResponse, escapeRegex, getSafeErrorMessage } from '@/lib/validations';
import mongoose from 'mongoose';

export async function GET(request: Request): Promise<Response> {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 100);
    const skip = (page - 1) * limit;

    const type = searchParams.get('type');
    const genre = searchParams.get('genre');
    const tag = searchParams.get('tag');
    const vendor = searchParams.get('vendor');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = { published: true };

    if (type) {
      query.type = { $regex: new RegExp(`^${escapeRegex(type)}`, 'i') };
    }

    if (genre) {
      const genrePattern = escapeRegex(genre).replace(/-/g, '[-\\s]?');
      query.genre = { $regex: new RegExp(genrePattern, 'i') };
    }

    if (vendor) {
      const vendorClean = vendor.replace(/\+/g, ' ');
      query.vendor = { $regex: new RegExp(escapeRegex(vendorClean), 'i') };
    }

    if (tag) {
      const tagPattern = escapeRegex(tag).replace(/-/g, '[-\\s]?');
      const tagRegex = new RegExp(tagPattern, 'i');
      query.$or = [
        { tags: { $elemMatch: { $regex: tagRegex } } },
        { tags: tagRegex },
        { genre: tagRegex },
        { category: tagRegex },
      ];
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      const searchOr = [
        { title: searchRegex },
        { description: searchRegex },
        { vendor: searchRegex },
        { genre: searchRegex },
        { tags: searchRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Product.countDocuments(query);

    return successResponse({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Products API error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}
