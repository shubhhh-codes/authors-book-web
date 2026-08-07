import { connectDB } from '@/lib/db';
import ShelfBook from '@/lib/schemas/ShelfBook';
import { catalog } from '@/app/catalog';
import {
  AdminShelfBookCreateSchema,
  parseRequestBody,
  errorResponse,
  successResponse,
  getSafeErrorMessage,
} from '@/lib/validations';

export async function GET() {
  try {
    await connectDB();

    const count = await ShelfBook.countDocuments();
    if (count === 0) {
      // Auto-seed default catalog if empty
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

    const books = await ShelfBook.find({}).sort({ order: 1, height: -1 }).lean();
    return successResponse(books);
  } catch (error) {
    console.error('Admin GET shelf-books error:', error);
    return errorResponse(getSafeErrorMessage(error), 500);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await parseRequestBody(request, AdminShelfBookCreateSchema);

    // Check if ID slug already exists
    const existing = await ShelfBook.findOne({ id: data.id });
    if (existing) {
      return errorResponse(`A shelf book with ID slug "${data.id}" already exists.`, 400);
    }

    const newBook = await ShelfBook.create(data);
    return successResponse(newBook, 201);
  } catch (error) {
    console.error('Admin POST shelf-book error:', error);
    return errorResponse(getSafeErrorMessage(error), 400);
  }
}
