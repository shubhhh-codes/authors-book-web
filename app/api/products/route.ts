import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const type = searchParams.get('type');
    const genre = searchParams.get('genre');
    const tag = searchParams.get('tag');
    const vendor = searchParams.get('vendor');
    const search = searchParams.get('search');

    const query: Record<string, any> = { published: true };

    if (type) {
      query.type = { $regex: new RegExp(`^${type}`, 'i') };
    }

    if (genre) {
      const genreRegex = genre.replace(/-/g, '[-\\s]?');
      query.genre = { $regex: new RegExp(genreRegex, 'i') };
    }

    if (vendor) {
      const vendorClean = vendor.replace(/\+/g, ' ');
      query.vendor = { $regex: new RegExp(vendorClean, 'i') };
    }

    if (tag) {
      const tagPattern = tag.replace(/-/g, '[-\\s]?');
      const tagRegex = new RegExp(tagPattern, 'i');
      query.$or = [
        { tags: { $elemMatch: { $regex: tagRegex } } },
        { tags: tagRegex },
        { genre: tagRegex },
        { category: tagRegex },
      ];
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
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
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    return Response.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Products API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
