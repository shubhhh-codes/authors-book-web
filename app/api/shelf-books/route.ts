import { connectDB } from '@/lib/db';
import ShelfBook from '@/lib/schemas/ShelfBook';
import Product from '@/lib/schemas/Product'; // Ensures model is registered for populate
import { catalog } from '@/app/catalog';

export async function GET() {
  try {
    await connectDB();
    if (!Product) {
      console.log('Product model loaded');
    }

    const count = await ShelfBook.countDocuments();
    if (count === 0) {
      // Auto-seed default catalog into MongoDB on first request
      const seedData = catalog.map((book, index) => ({
        id: book.id,
        title: book.title,
        shortTitle: book.shortTitle,
        author: book.author,
        description: book.description || '',
        quote: book.quote || '',
        quoteBy: book.quoteBy || '',
        format: book.format || 'Hardcover',
        availability: book.availability || 'Available now',
        url: book.url || '#',
        cover: book.cover || '#2b6192',
        accent: book.accent || '#ffffff',
        ink: book.ink || '#ffffff',
        motif: book.motif || 'orbit',
        height: book.height || 2.1,
        thickness: book.thickness || 0.22,
        coverImage: book.coverImage || '',
        linkLabel: book.linkLabel || '',
        living: Boolean(book.living),
        order: index,
        published: true,
      }));

      await ShelfBook.insertMany(seedData);
    }

    const rawBooks = await ShelfBook.find({ published: true })
      .populate('productId', '_id title price handle images sku')
      .sort({ order: 1, height: -1 })
      .lean();

    // Map and normalize product URLs to SEO handles
    const books = rawBooks.map((book: any) => {
      let finalUrl = book.url || '#';
      if (book.productId && typeof book.productId === 'object') {
        const handle = book.productId.handle || String(book.productId._id);
        finalUrl = `/product/${handle}`;
      }
      return {
        ...book,
        url: finalUrl,
      };
    });

    return Response.json(books, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching shelf books, falling back to static catalog:', error);
    return Response.json(catalog, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  }
}
