import { connectDB } from '@/lib/db';
import ShelfBook from '@/lib/schemas/ShelfBook';
import { catalog } from '@/app/catalog';
import type { ShelfBook as ShelfBookType } from '@/lib/types';
import AdminShelfClient from './AdminShelfClient';

export const dynamic = 'force-dynamic';

async function getAdminShelfBooks(): Promise<ShelfBookType[]> {
  try {
    await connectDB();
    const count = await ShelfBook.countDocuments();
    if (count === 0) {
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
    const docs = await ShelfBook.find({}).sort({ order: 1, height: -1 }).lean();
    return JSON.parse(JSON.stringify(docs));
  } catch (err) {
    console.error('getAdminShelfBooks error:', err);
    return JSON.parse(JSON.stringify(catalog));
  }
}

export default async function AdminShelfPage() {
  const shelfBooks = await getAdminShelfBooks();
  return <AdminShelfClient initialBooks={shelfBooks} />;
}
