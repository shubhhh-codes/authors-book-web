import Link from 'next/link';
import Image from 'next/image';
import type { CollectionPreview } from '@/lib/types';

interface CollectionListProps {
  title: string;
  collections: CollectionPreview[];
  /** Desktop columns: 4 for Books, 6 for Bookmarks/Authors */
  columns?: 3 | 4 | 5 | 6;
}

// Grid column class map (Tailwind v4 safe-list via explicit class names)
const GRID_COL_MAP: Record<number, string> = {
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-3 lg:grid-cols-5',
  6: 'sm:grid-cols-3 lg:grid-cols-6',
};

// Muted-colour placeholders for collections that have no image
const COLLECTION_COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#2d6a4f', '#1b4332', '#6b4226', '#3d2b1f',
];

function CollectionCard({ collection, index }: { collection: CollectionPreview; index: number }) {
  const bg = collection.bgColor ?? COLLECTION_COLORS[index % COLLECTION_COLORS.length];

  return (
    <Link
      href={collection.href}
      className="collection-card group block rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
      aria-label={`Browse ${collection.name} collection`}
    >
      {/* Image / Colour swatch */}
      <div
        className="relative w-full aspect-square overflow-hidden"
        style={{ backgroundColor: bg }}
      >
        {collection.image ? (
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            className="object-cover collection-card-img"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          /* Stylised letter placeholder */
          <div className="absolute inset-0 flex items-end p-4">
            <span
              className="text-white font-black text-6xl leading-none opacity-20 select-none uppercase"
              aria-hidden="true"
            >
              {collection.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="pt-3 pb-1 px-1">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-black leading-tight">
          {collection.name}
        </p>
        {collection.productCount != null && (
          <p className="text-xs text-gray-500 mt-0.5">
            {collection.productCount} {collection.productCount === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function CollectionList({
  title,
  collections,
  columns = 4,
}: CollectionListProps) {
  if (!collections.length) return null;

  const gridClass = GRID_COL_MAP[columns] ?? GRID_COL_MAP[4];

  return (
    <section
      className="py-9 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto"
      aria-labelledby={`collection-list-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {/* Section heading + View All (mirrors collection-list.liquid title-wrapper) */}
      <div className="flex items-baseline justify-between mb-8">
        <h2
          id={`collection-list-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className="text-xl sm:text-2xl font-bold tracking-tight uppercase text-gray-900"
        >
          {title}
        </h2>
        <Link
          href="/shop"
          className="text-sm font-medium text-gray-600 hover:text-black transition-colors underline underline-offset-4 decoration-gray-300 hover:decoration-black"
        >
          View all
        </Link>
      </div>

      {/* Collection grid */}
      <ul
        className={`grid grid-cols-2 ${gridClass} gap-4 sm:gap-6 list-none`}
        role="list"
      >
        {collections.map((col, i) => (
          <li key={col.handle}>
            <CollectionCard collection={col} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
