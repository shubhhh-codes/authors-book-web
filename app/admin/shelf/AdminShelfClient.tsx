'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ShelfBook, Product } from '@/lib/types';

interface AdminShelfClientProps {
  initialBooks: ShelfBook[];
}

const MOTIF_OPTIONS = [
  'orbit',
  'network',
  'wave',
  'flight',
  'circuit',
  'boom',
  'efficiency',
  'organization',
  'schematic',
  'lattice',
  'corrosion',
  'branches',
  'runner',
  'gather',
  'maze',
  'fracture',
  'continuum',
  'windows',
  'steps',
];

export default function AdminShelfClient({ initialBooks }: AdminShelfClientProps) {
  const [books, setBooks] = useState<ShelfBook[]>(initialBooks);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMotif, setSelectedMotif] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'height' | 'newest'>('order');

  // Pagination State for scalability (500+ books)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<ShelfBook | null>(null);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<'all' | 'book' | 'bookmark'>('all');

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drag & Drop / Upload state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [manualCoverInput, setManualCoverInput] = useState(false);
  const [customUrlMode, setCustomUrlMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ShelfBook>>({
    id: '',
    title: '',
    shortTitle: '',
    author: '',
    description: '',
    quote: '',
    quoteBy: '',
    format: 'Hardcover',
    availability: 'Available now',
    url: '#',
    productId: null,
    cover: '#2b6192',
    accent: '#ffffff',
    ink: '#ffffff',
    motif: 'orbit',
    height: 2.1,
    thickness: 0.22,
    coverImage: '',
    linkLabel: '',
    living: false,
    order: 0,
    published: true,
  });

  // Fetch store products on load for product linking
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/admin/products');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setStoreProducts(data);
          }
        }
      } catch (err) {
        console.error('Failed to load store products:', err);
      }
    }
    void fetchProducts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered & Sorted Books
  const processedBooks = useMemo(() => {
    const list = books.filter((book) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesTitle = book.title?.toLowerCase().includes(q);
        const matchesAuthor = book.author?.toLowerCase().includes(q);
        const matchesId = book.id?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor && !matchesId) return false;
      }

      if (selectedMotif !== 'all' && book.motif !== selectedMotif) {
        return false;
      }

      if (selectedStatus === 'published' && book.published === false) return false;
      if (selectedStatus === 'draft' && book.published !== false) return false;

      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'height') return (b.height ?? 0) - (a.height ?? 0);
      if (sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
      return (a.order ?? 0) - (b.order ?? 0);
    });

    return list;
  }, [books, searchTerm, selectedMotif, selectedStatus, sortBy]);

  // Paginated books for fast rendering
  const totalPages = Math.ceil(processedBooks.length / pageSize) || 1;
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedBooks = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return processedBooks.slice(start, start + pageSize);
  }, [processedBooks, currentPageSafe, pageSize]);

  const stats = useMemo(() => {
    const total = books.length;
    const published = books.filter((b) => b.published !== false).length;
    const drafts = total - published;
    const customCovers = books.filter((b) => Boolean(b.coverImage)).length;
    const linkedProducts = books.filter((b) => Boolean(b.productId || (b.url && b.url.startsWith('/product/')))).length;
    return { total, published, drafts, customCovers, linkedProducts };
  }, [books]);

  // Filtered Products for Combobox Picker
  const filteredStoreProducts = useMemo(() => {
    return storeProducts.filter((prod) => {
      if (productCategoryFilter !== 'all') {
        const prodType = (prod.type || 'book').toLowerCase();
        if (prodType !== productCategoryFilter) return false;
      }
      if (productSearchQuery.trim()) {
        const q = productSearchQuery.toLowerCase().trim();
        const matchesTitle = prod.title?.toLowerCase().includes(q);
        const matchesSku = prod.sku?.toLowerCase().includes(q);
        const matchesVendor = prod.vendor?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSku && !matchesVendor) return false;
      }
      return true;
    });
  }, [storeProducts, productSearchQuery, productCategoryFilter]);

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setFormData({
      id: `volume-${books.length + 1}`,
      title: '',
      shortTitle: '',
      author: '',
      description: '',
      quote: '',
      quoteBy: '',
      format: 'Hardcover',
      availability: 'Available now',
      url: '#',
      productId: null,
      cover: '#2b6192',
      accent: '#ffffff',
      ink: '#ffffff',
      motif: 'orbit',
      height: 2.1,
      thickness: 0.22,
      coverImage: '',
      linkLabel: '',
      living: false,
      order: books.length,
      published: true,
    });
    setManualCoverInput(false);
    setCustomUrlMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: ShelfBook) => {
    setEditingBook(book);
    setFormData({ ...book });
    setManualCoverInput(Boolean(book.coverImage && !book.coverImage.startsWith('/uploads/')));

    const isStoreProduct = storeProducts.some(
      (p) => String(p._id) === book.productId || `/product/${p._id}` === book.url || `/product/${p.handle}` === book.url
    );
    setCustomUrlMode(!isStoreProduct && Boolean(book.url && book.url !== '#'));
    setIsModalOpen(true);
  };

  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setIsUploadingCover(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');

      setFormData((prev) => ({ ...prev, coverImage: json.url }));
      showToast('Cover image uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      alert(err instanceof Error ? err.message : 'Failed to upload cover image.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleLinkProduct = (prod: Product) => {
    const productSlug = prod.handle || (prod.title ? prod.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : String(prod._id));
    const targetUrl = `/product/${productSlug}`;
    const defaultLabel = prod.price ? `Checkout This Book` : 'View Store Product';
    setFormData((prev) => ({
      ...prev,
      productId: String(prod._id),
      url: targetUrl,
      linkLabel: prev.linkLabel || defaultLabel,
    }));
    setCustomUrlMode(false);
    setIsProductPickerOpen(false);
    showToast(`Linked to "${prod.title}"`);
  };

  const handleUnlinkProduct = () => {
    setFormData((prev) => ({
      ...prev,
      productId: null,
      url: '#',
      linkLabel: '',
    }));
    setCustomUrlMode(false);
    showToast('Unlinked store product');
  };

  const handleTogglePublish = async (book: ShelfBook) => {
    try {
      const updatedStatus = !book.published;
      const res = await fetch(`/api/admin/shelf-books/${book._id || book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: updatedStatus }),
      });
      if (res.ok) {
        setBooks((prev) =>
          prev.map((b) => (b.id === book.id ? { ...b, published: updatedStatus } : b))
        );
        showToast(`"${book.title}" set to ${updatedStatus ? 'Published' : 'Draft'}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteBook = async (book: ShelfBook) => {
    if (!confirm(`Are you sure you want to delete "${book.title}" from the 3D shelf?`)) return;

    try {
      const res = await fetch(`/api/admin/shelf-books/${book._id || book.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBooks((prev) => prev.filter((b) => b.id !== book.id));
        showToast(`Deleted "${book.title}" from shelf`);
      }
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingBook) {
        const res = await fetch(`/api/admin/shelf-books/${editingBook._id || editingBook.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update volume');
        setBooks((prev) => prev.map((b) => (b.id === editingBook.id ? data : b)));
        showToast(`Updated "${data.title}" successfully`);
      } else {
        const res = await fetch('/api/admin/shelf-books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create volume');
        setBooks((prev) => [...prev, data]);
        showToast(`Added "${data.title}" to 3D shelf`);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // Find linked product for current editing book
  const currentLinkedProduct = useMemo(() => {
    if (formData.productId) {
      return storeProducts.find((p) => String(p._id) === formData.productId) || null;
    }
    if (formData.url && formData.url.startsWith('/product/')) {
      const param = formData.url.replace('/product/', '');
      return storeProducts.find((p) => String(p._id) === param || p.handle === param) || null;
    }
    return null;
  }, [formData.productId, formData.url, storeProducts]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium border border-emerald-700 flex items-center gap-2 animate-bounce">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-widest">
            <span>3D Interactive Experience</span>
            <span>•</span>
            <span>WebGL Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">3D Shelf Volumes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage books rendered on the tactile 3D homepage bookshelf. Edit hardcover dimensions, procedural motifs, and custom artwork.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/#shelf"
            target="_blank"
            className="text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors border border-gray-300 flex items-center gap-1.5"
          >
            <span>Live 3D View</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
          <button
            onClick={handleOpenAddModal}
            className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add 3D Volume</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Total Volumes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Published on Shelf</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.published}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Draft / Hidden</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.drafts}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Custom Cover Art</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.customCovers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500 font-medium">Linked Store Products</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.linkedProducts}</p>
        </div>
      </div>

      {/* Controls Bar & Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search volumes by title, author, or slug..."
            className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-2.5 text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'order' | 'title' | 'height' | 'newest')}
            className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="order">Sort: Shelf Sequence</option>
            <option value="title">Sort: Title (A-Z)</option>
            <option value="height">Sort: Height (Tallest)</option>
            <option value="newest">Sort: Recently Created</option>
          </select>

          <select
            value={selectedMotif}
            onChange={(e) => {
              setSelectedMotif(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Motifs</option>
            {MOTIF_OPTIONS.map((m) => (
              <option key={m} value={m}>
                Motif: {m}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as 'all' | 'published' | 'draft');
              setCurrentPage(1);
            }}
            className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Book Volumes Scalable Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Book &amp; Author</th>
                <th className="px-4 py-3">3D Spine Swatch</th>
                <th className="px-4 py-3">Linked Store Product</th>
                <th className="px-4 py-3">Dimensions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No 3D shelf volumes match your search query or filters.
                  </td>
                </tr>
              ) : (
                paginatedBooks.map((book) => {
                  const linkedProd = storeProducts.find(
                    (p) => String(p._id) === book.productId || `/product/${p._id}` === book.url || `/product/${p.handle}` === book.url
                  );

                  return (
                    <tr key={book.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {book.coverImage ? (
                            <div className="w-8 h-12 relative rounded border border-black/10 overflow-hidden bg-gray-100 shrink-0">
                              <Image
                                src={book.coverImage}
                                alt={book.title}
                                fill
                                className="object-cover"
                                unoptimized={Boolean(book.coverImage?.startsWith('data:'))}
                              />
                            </div>
                          ) : (
                            <div
                              className="w-8 h-12 rounded border border-black/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs"
                              style={{ backgroundColor: book.cover }}
                            >
                              3D
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{book.title}</div>
                            <div className="text-[11px] text-gray-500">{book.author}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">slug: /book/{book.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-8 rounded-xs shadow-xs border border-black/10 flex flex-col justify-between p-0.5"
                            style={{ backgroundColor: book.cover }}
                            title={`Cover: ${book.cover}`}
                          >
                            <div className="w-full h-1 rounded-xs" style={{ backgroundColor: book.accent }} />
                            <div className="w-full h-0.5 rounded-xs" style={{ backgroundColor: book.ink }} />
                          </div>
                          <div className="text-[10px] font-mono text-gray-500">
                            <div><span className="text-gray-400">motif:</span> {book.motif || 'orbit'}</div>
                            <div><span className="text-gray-400">cover:</span> {book.cover}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {linkedProd ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200 w-max">
                              🛍️ {linkedProd.title}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">₹{linkedProd.price}</span>
                          </div>
                        ) : book.url && book.url !== '#' ? (
                          <span className="text-[11px] font-mono text-blue-600 hover:underline truncate max-w-[150px] inline-block">
                            {book.url}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No product link</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-600">
                        H: {book.height ?? 2.1} × T: {book.thickness ?? 0.22}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTogglePublish(book)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                            book.published !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${book.published !== false ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span>{book.published !== false ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(book)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Scalable Table Pagination Bar */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-900">{processedBooks.length === 0 ? 0 : (currentPageSafe - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-gray-900">{Math.min(currentPageSafe * pageSize, processedBooks.length)}</span> of{' '}
            <span className="font-semibold text-gray-900">{processedBooks.length}</span> 3D volumes
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPageSafe <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white font-medium hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              ← Previous
            </button>
            <span className="font-mono text-xs px-2">
              Page {currentPageSafe} of {totalPages}
            </span>
            <button
              disabled={currentPageSafe >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white font-medium hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Side Drawer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingBook ? `Edit Volume: ${editingBook.title}` : 'Add New 3D Shelf Volume'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure 3D book details, hardcover colors, cover artwork, and product link.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Live Spine & Artwork Preview */}
              <div className="p-6 bg-gray-50 border-b border-gray-200 flex items-center gap-6">
                {formData.coverImage ? (
                  <div className="w-16 h-24 rounded-md shadow-md border border-black/10 overflow-hidden relative shrink-0">
                    <Image
                      src={formData.coverImage}
                      alt={formData.title || 'Cover image'}
                      fill
                      className="object-cover"
                      unoptimized={Boolean(formData.coverImage?.startsWith('data:'))}
                    />
                  </div>
                ) : (
                  <div
                    className="w-16 h-24 rounded-md shadow-md border border-black/10 flex flex-col justify-between p-2 relative overflow-hidden transition-all duration-300 shrink-0"
                    style={{ backgroundColor: formData.cover || '#2b6192' }}
                  >
                    <div
                      className="w-full h-2 rounded-xs"
                      style={{ backgroundColor: formData.accent || '#ffffff' }}
                    />
                    <div className="text-[9px] font-bold tracking-tighter truncate" style={{ color: formData.ink || '#ffffff' }}>
                      {formData.shortTitle || formData.title || 'Volume Title'}
                    </div>
                    <div
                      className="w-full h-1 rounded-xs"
                      style={{ backgroundColor: formData.ink || '#ffffff' }}
                    />
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-gray-900">
                    {formData.coverImage ? 'Custom Artwork Preview' : '3D Hardcover Live Preview'}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Motif: <span className="font-mono text-purple-600 font-semibold">{formData.motif}</span> | Height:{' '}
                    <span className="font-mono text-gray-700">{formData.height}</span> | Thickness:{' '}
                    <span className="font-mono text-gray-700">{formData.thickness}</span>
                  </div>
                  {currentLinkedProduct ? (
                    <div className="text-[11px] text-purple-700 font-semibold mt-1 flex items-center gap-1.5">
                      <span>🛍️ Linked: {currentLinkedProduct.title} (₹{currentLinkedProduct.price})</span>
                    </div>
                  ) : formData.url && formData.url !== '#' ? (
                    <div className="text-[11px] text-blue-700 font-medium mt-1">
                      🔗 External Link: <span className="font-mono">{formData.url}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 italic mt-1">🚫 Standalone 3D Volume (No Store Link)</div>
                  )}
                </div>
              </div>

              {/* Form Body */}
              <form id="shelf-book-form" onSubmit={handleSubmitForm} className="p-6 space-y-6">
                {/* General Information */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">General Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Book Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Think Like a Monk"
                        className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Short Title (Spine) *</label>
                      <input
                        type="text"
                        required
                        value={formData.shortTitle || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, shortTitle: e.target.value }))}
                        placeholder="e.g. Think Like a Monk"
                        className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Author Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.author || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                        placeholder="e.g. Jay Shetty"
                        className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">ID Slug *</label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingBook)}
                        value={formData.id || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                          }))
                        }
                        placeholder="e.g. think-like-a-monk"
                        className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 disabled:opacity-60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Description & Quotes */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Content &amp; Quotes</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={formData.description || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Detailed book summary shown in inspection drawer..."
                        className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Featured Quote</label>
                        <input
                          type="text"
                          value={formData.quote || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, quote: e.target.value }))}
                          placeholder="e.g. When you observe your mind..."
                          className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Quote Attribution</label>
                        <input
                          type="text"
                          value={formData.quoteBy || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, quoteBy: e.target.value }))}
                          placeholder="e.g. Jay Shetty"
                          className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3D Visual Styling */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">3D Hardcover Styling</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Cover Base Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.cover || '#2b6192'}
                          onChange={(e) => setFormData((prev) => ({ ...prev, cover: e.target.value }))}
                          className="w-9 h-9 p-0 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.cover || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, cover: e.target.value }))}
                          className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Accent Line Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.accent || '#ffffff'}
                          onChange={(e) => setFormData((prev) => ({ ...prev, accent: e.target.value }))}
                          className="w-9 h-9 p-0 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.accent || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, accent: e.target.value }))}
                          className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Spine Ink Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.ink || '#ffffff'}
                          onChange={(e) => setFormData((prev) => ({ ...prev, ink: e.target.value }))}
                          className="w-9 h-9 p-0 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.ink || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, ink: e.target.value }))}
                          className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Procedural Motif</label>
                      <select
                        value={formData.motif || 'orbit'}
                        onChange={(e) => setFormData((prev) => ({ ...prev, motif: e.target.value }))}
                        className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 capitalize"
                      >
                        {MOTIF_OPTIONS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Book Height: <span className="font-mono text-emerald-600">{formData.height}</span>
                      </label>
                      <input
                        type="range"
                        min="1.8"
                        max="2.5"
                        step="0.02"
                        value={formData.height ?? 2.1}
                        onChange={(e) => setFormData((prev) => ({ ...prev, height: parseFloat(e.target.value) }))}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Spine Thickness: <span className="font-mono text-emerald-600">{formData.thickness}</span>
                      </label>
                      <input
                        type="range"
                        min="0.12"
                        max="0.38"
                        step="0.01"
                        value={formData.thickness ?? 0.22}
                        onChange={(e) => setFormData((prev) => ({ ...prev, thickness: parseFloat(e.target.value) }))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Media & Product Link Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Media &amp; Store Linking</h3>

                  {/* Drag & Drop Cover Image Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700">Cover Artwork Image</label>
                      <button
                        type="button"
                        onClick={() => setManualCoverInput((prev) => !prev)}
                        className="text-[11px] text-blue-600 hover:underline font-medium"
                      >
                        {manualCoverInput ? 'Switch to Drag & Drop Upload' : 'Enter URL Manually'}
                      </button>
                    </div>

                    {/* Dedicated Resolution Notice */}
                    <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-800 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span>
                          <strong>Recommended Resolution:</strong> <span className="font-mono font-bold">600 × 900 px</span> (2:3 Aspect Ratio). Formats: WEBP, JPG, PNG.
                        </span>
                      </div>
                    </div>

                    {manualCoverInput ? (
                      <input
                        type="text"
                        value={formData.coverImage || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
                        placeholder="e.g. /books/think-like-a-monk/cover.jpg"
                        className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors relative ${
                          isDraggingOver
                            ? 'border-emerald-500 bg-emerald-50/50'
                            : formData.coverImage
                            ? 'border-emerald-300 bg-emerald-50/20'
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100/80'
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              void handleUploadFile(e.target.files[0]);
                            }
                          }}
                        />

                        {isUploadingCover ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-semibold text-emerald-700">Uploading cover image...</span>
                          </div>
                        ) : formData.coverImage ? (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-16 relative rounded border border-black/10 overflow-hidden bg-white shrink-0">
                                <Image
                                  src={formData.coverImage}
                                  alt="Uploaded cover"
                                  fill
                                  className="object-cover"
                                  unoptimized={Boolean(formData.coverImage?.startsWith('data:'))}
                                />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-gray-900">Cover Artwork Uploaded</p>
                                <p className="text-[10px] text-gray-500 font-mono truncate max-w-[240px]">
                                  {formData.coverImage}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData((prev) => ({ ...prev, coverImage: '' }));
                              }}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 py-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            </div>
                            <p className="text-xs font-semibold text-gray-900">
                              <span className="text-emerald-600">Click to upload</span> or drag and drop cover image
                            </p>
                            <p className="text-[11px] text-gray-500">
                              Optimal: <strong>600 × 900 px</strong> • Up to 10MB (JPG, PNG, WebP)
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Scalable Product Link Picker Card */}
                  <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">Store Product Link</label>

                    {currentLinkedProduct ? (
                      <div className="bg-white border border-purple-200 rounded-xl p-3.5 flex items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-center gap-3">
                          {currentLinkedProduct.images && currentLinkedProduct.images.length > 0 ? (
                            <div className="w-10 h-14 relative rounded border border-gray-200 overflow-hidden bg-gray-100 shrink-0">
                              <Image
                                src={currentLinkedProduct.images[0].url}
                                alt={currentLinkedProduct.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-14 rounded border border-gray-200 bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                              🛍️
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-gray-900">{currentLinkedProduct.title}</div>
                            <div className="text-[11px] text-gray-500">
                              Price: <span className="font-bold text-emerald-700">₹{currentLinkedProduct.price}</span> | SKU:{' '}
                              <span className="font-mono">{currentLinkedProduct.sku || 'N/A'}</span>
                            </div>
                            <div className="text-[10px] text-purple-600 font-mono mt-0.5">
                              URL: /product/{currentLinkedProduct._id}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsProductPickerOpen(true)}
                            className="text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={handleUnlinkProduct}
                            className="text-[11px] text-rose-600 hover:underline font-medium"
                          >
                            Unlink
                          </button>
                        </div>
                      </div>
                    ) : customUrlMode ? (
                      <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">✏️ Custom External Link</span>
                          <button
                            type="button"
                            onClick={handleUnlinkProduct}
                            className="text-xs font-semibold text-gray-600 hover:text-gray-900 text-[11px] hover:underline"
                          >
                            Cancel Custom Link
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Custom External URL</label>
                            <input
                              type="text"
                              value={formData.url || ''}
                              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                              placeholder="e.g. https://jayshetty.me/book/"
                              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2 text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Button Action Label</label>
                            <input
                              type="text"
                              value={formData.linkLabel || ''}
                              onChange={(e) => setFormData((prev) => ({ ...prev, linkLabel: e.target.value }))}
                              placeholder="e.g. Checkout This Book"
                              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg p-2 text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-4 text-center space-y-3">
                        <div className="text-xs font-medium text-gray-500">
                          🚫 Standalone 3D Volume (No Store Link Attached)
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsProductPickerOpen(true)}
                            className="text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 px-3.5 py-2 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                          >
                            <span>🛍️ Link Store Product</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomUrlMode(true)}
                            className="text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-2 rounded-lg transition-colors"
                          >
                            ✏️ Custom External Link
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Button Label Configuration */}
                    {formData.url && formData.url !== '#' && (
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Button Action Label</label>
                        <input
                          type="text"
                          value={formData.linkLabel || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, linkLabel: e.target.value }))}
                          placeholder="e.g. Checkout This Book"
                          className="w-full text-xs bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="living-check"
                        checked={Boolean(formData.living)}
                        onChange={(e) => setFormData((prev) => ({ ...prev, living: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="living-check" className="text-xs font-medium text-gray-700">
                        Living Edition Badge
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="published-check"
                        checked={Boolean(formData.published !== false)}
                        onChange={(e) => setFormData((prev) => ({ ...prev, published: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      />
                      <label htmlFor="published-check" className="text-xs font-medium text-gray-700">
                        Visible on 3D Shelf
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-300 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="shelf-book-form"
                disabled={loading || isUploadingCover}
                className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-5 py-2 rounded-lg transition-colors shadow-xs"
              >
                {loading ? 'Saving...' : editingBook ? 'Save Volume Changes' : 'Create 3D Volume'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Scalable Searchable Product Combobox Picker Modal */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900">Select Store Product to Link</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Search through your store catalog ({storeProducts.length} products available).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Filter & Search Input */}
            <div className="p-4 border-b border-gray-200 bg-white space-y-3">
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search by title, SKU, author, or keyword..."
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-3 top-3 text-gray-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProductCategoryFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    productCategoryFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({storeProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProductCategoryFilter('book')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    productCategoryFilter === 'book' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Books 📖
                </button>
                <button
                  type="button"
                  onClick={() => setProductCategoryFilter('bookmark')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    productCategoryFilter === 'bookmark' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Bookmarks 🔖
                </button>
              </div>
            </div>

            {/* Product List */}
            <div className="overflow-y-auto divide-y divide-gray-100 p-2 flex-1 min-h-[300px]">
              {filteredStoreProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No store products found matching &quot;{productSearchQuery}&quot;
                </div>
              ) : (
                filteredStoreProducts.map((prod) => {
                  const isSelected = formData.productId === String(prod._id);
                  const image = prod.images && prod.images.length > 0 ? prod.images[0].url : null;

                  return (
                    <button
                      key={String(prod._id)}
                      type="button"
                      onClick={() => handleLinkProduct(prod)}
                      className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                        isSelected
                          ? 'bg-purple-50 border border-purple-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {image ? (
                          <div className="w-10 h-14 relative rounded border border-black/10 overflow-hidden bg-gray-100 shrink-0">
                            <Image src={image} alt={prod.title} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-14 rounded border border-gray-200 bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-400 shrink-0">
                            NO IMG
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-gray-900">{prod.title}</div>
                          <div className="text-[11px] text-gray-500">
                            Vendor: {prod.vendor || 'Authors Book'} {prod.sku ? `| SKU: ${prod.sku}` : ''}
                          </div>
                          <div className="text-xs font-bold text-emerald-700 mt-0.5">₹{prod.price}</div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
                        }`}
                      >
                        {isSelected ? '✓ Linked' : 'Select'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>Showing {filteredStoreProducts.length} items</span>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="text-xs font-semibold text-gray-700 bg-white border border-gray-300 px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
