# authorsbook.store Migration Plan
## Shopify Liquid → Next.js React Migration
**Project Location:** `C:\Users\SHUBHHH\Downloads\authors-book\authorsbook-web\`

---

## **PROJECT OVERVIEW**

**Goal:** Migrate authorsbook.store from Shopify (dead subscription) to custom Next.js + MongoDB + Razorpay setup

**Status:** Project folder created, folders structure ready, CSV data available at `../products_export_1.csv`

**Timeline:** 6-8 hours of coding work → Live by end of this week

---

## **PART 1: DATABASE SETUP & SCHEMAS**

### **Task 1.1: Create MongoDB Connection File**
**File:** `lib/db.ts`

```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

let cached = global.mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

**Instructions for AGY:**
- Create file at `lib/db.ts`
- Copy exact code above
- Save file

---

### **Task 1.2: Create Product Schema**
**File:** `lib/schemas/Product.ts`

```typescript
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  handle: String,
  title: String,
  description: String,
  vendor: String,
  category: String,
  type: String,
  tags: [String],
  published: Boolean,
  sku: String,
  weight: Number,
  price: Number,
  compareAtPrice: Number,
  inventory: {
    quantity: Number,
    policy: String,
  },
  images: [
    {
      url: String,
      alt: String,
      position: Number,
    },
  ],
  seoTitle: String,
  seoDescription: String,
  bookmarkShape: String,
  color: String,
  material: String,
  targetAudience: String,
  genre: String,
  language: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
```

**Instructions for AGY:**
- Create file at `lib/schemas/Product.ts`
- Copy exact code above
- Save file

---

### **Task 1.3: Create Order Schema**
**File:** `lib/schemas/Order.ts`

```typescript
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  customerEmail: String,
  customerName: String,
  customerPhone: String,
  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      handle: String,
      title: String,
      sku: String,
      price: Number,
      quantity: Number,
    },
  ],
  subtotal: Number,
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: Number,
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'failed'],
    default: 'pending',
  },
  paymentId: String,
  razorpayOrderId: String,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zip: String,
  },
  shiprocketOrderId: String,
  shipmentId: String,
  trackingUrl: String,
  timestamps: {
    created: { type: Date, default: Date.now },
    paid: Date,
    shipped: Date,
    delivered: Date,
  },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
```

**Instructions for AGY:**
- Create file at `lib/schemas/Order.ts`
- Copy exact code above
- Save file

---

## **PART 2: SEED SCRIPT & DATA IMPORT**

### **Task 2.1: Create Seed Script**
**File:** `scripts/seed.js`

```javascript
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

mongoose.connect(MONGODB_URI);

const ProductSchema = new mongoose.Schema({
  handle: String,
  title: String,
  description: String,
  vendor: String,
  category: String,
  type: String,
  tags: [String],
  published: Boolean,
  sku: String,
  weight: Number,
  price: Number,
  compareAtPrice: Number,
  inventory: {
    quantity: Number,
    policy: String,
  },
  images: [
    {
      url: String,
      alt: String,
      position: Number,
    },
  ],
  seoTitle: String,
  seoDescription: String,
  bookmarkShape: String,
  color: String,
  material: String,
  targetAudience: String,
  genre: String,
  language: String,
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', ProductSchema);

const productMap = {};

fs.createReadStream(path.join(__dirname, '../products_export_1.csv'))
  .pipe(csv())
  .on('data', (row) => {
    const handle = row.Handle;

    if (!handle) return;

    if (!productMap[handle]) {
      productMap[handle] = {
        handle,
        title: row.Title || '',
        description: row['Body (HTML)'] || '',
        vendor: row.Vendor || '',
        category: row['Product Category'] || '',
        type: row.Type || '',
        tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : [],
        published: row.Published === 'true',
        sku: row['Variant SKU'] || '',
        weight: parseFloat(row['Variant Grams']) || 0,
        price: parseFloat(row['Variant Price']) || 0,
        compareAtPrice: parseFloat(row['Variant Compare At Price']) || null,
        inventory: {
          quantity: parseInt(row['Variant Inventory Qty']) || 0,
          policy: row['Variant Inventory Policy'] || 'deny',
        },
        images: [],
        seoTitle: row['SEO Title'] || '',
        seoDescription: row['SEO Description'] || '',
        bookmarkShape: row['Bookmark shape'] || '',
        color: row['Color'] || '',
        material: row['Material'] || '',
        targetAudience: row['Target audience'] || '',
        genre: row['Genre'] || '',
        language: row['Language version'] || '',
      };
    }

    if (row['Image Src']) {
      productMap[handle].images.push({
        url: row['Image Src'],
        alt: row['Image Alt Text'] || row.Title,
        position: parseInt(row['Image Position']) || 0,
      });
    }
  })
  .on('end', async () => {
    try {
      await Product.deleteMany({});
      console.log('✅ Cleared existing products');

      const products = Object.values(productMap).map(p => ({
        ...p,
        images: p.images.sort((a, b) => a.position - b.position),
      }));

      await Product.insertMany(products);
      console.log(`✅ Seeded ${products.length} products`);

      process.exit(0);
    } catch (error) {
      console.error('❌ Seeding error:', error);
      process.exit(1);
    }
  });
```

**Instructions for AGY:**
- Create file at `scripts/seed.js`
- Copy exact code above
- Save file
- This script will import all products from CSV into MongoDB

---

## **PART 3: API ROUTES**

### **Task 3.1: Get All Products Route**
**File:** `app/api/products/route.ts`

```typescript
import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;
    const skip = (page - 1) * limit;
    
    const products = await Product.find({ published: true })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Product.countDocuments({ published: true });
    
    return Response.json({
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
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

**Instructions for AGY:**
- Create file at `app/api/products/route.ts`
- Copy exact code above
- Save file

---

### **Task 3.2: Get Single Product Route**
**File:** `app/api/products/[id]/route.ts`

```typescript
import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const product = await Product.findById(params.id);
    
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return Response.json(product);
  } catch (error) {
    console.error('Product detail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

**Instructions for AGY:**
- Create file at `app/api/products/[id]/route.ts`
- Copy exact code above
- Save file

---

### **Task 3.3: Checkout Route (Create Order)**
**File:** `app/api/checkout/route.ts`

```typescript
import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    await connectDB();
    
    const {
      items,
      subtotal,
      shippingCost,
      total,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
    } = await request.json();

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    // Create order in DB with pending status
    const bookingId = `AB-${Date.now().toString().slice(-8)}`;
    
    const order = new Order({
      bookingId,
      customerEmail,
      customerName,
      customerPhone,
      items,
      subtotal,
      shippingCost,
      total,
      shippingAddress,
      status: 'pending',
      razorpayOrderId: razorpayOrder.id,
    });

    await order.save();

    return Response.json({
      orderId: order._id,
      bookingId,
      razorpayOrderId: razorpayOrder.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

**Instructions for AGY:**
- Create file at `app/api/checkout/route.ts`
- Copy exact code above
- Save file

---

### **Task 3.4: Payment Verification Route**
**File:** `app/api/verify-payment/route.ts`

```typescript
import { connectDB } from '@/lib/db';
import Order from '@/lib/schemas/Order';
import crypto from 'crypto';

export async function POST(request) {
  try {
    await connectDB();
    
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
    } = await request.json();

    // Verify signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'paid',
        paymentId: razorpayPaymentId,
        'timestamps.paid': new Date(),
      },
      { new: true }
    );

    return Response.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

**Instructions for AGY:**
- Create file at `app/api/verify-payment/route.ts`
- Copy exact code above
- Save file

---

## **PART 4: REACT COMPONENTS**

### **Task 4.1: ProductCard Component**
**File:** `components/ProductCard.tsx`

```typescript
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  _id: string;
  handle: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  images: Array<{ url: string; alt: string }>;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product._id}`}>
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-64 bg-gray-100">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
            {product.title}
          </h3>
          
          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ₹{product.price}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-500 line-through">
                ₹{product.compareAtPrice}
              </span>
            )}
          </div>
          
          <button className="mt-4 w-full bg-black text-white py-2 rounded text-sm hover:bg-gray-800 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
}
```

**Instructions for AGY:**
- Create file at `components/ProductCard.tsx`
- Copy exact code above
- Save file

---

### **Task 4.2: Navigation Component**
**File:** `components/Navigation.tsx`

```typescript
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-black">
          authorsbook
        </Link>
        
        <div className="flex gap-8 items-center">
          <Link href="/shop" className="text-gray-600 hover:text-black">
            Shop
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-black">
            About
          </Link>
          <Link href="/cart" className="text-gray-600 hover:text-black">
            Cart
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

**Instructions for AGY:**
- Create file at `components/Navigation.tsx`
- Copy exact code above
- Save file

---

### **Task 4.3: Hero Component**
**File:** `components/Hero.tsx`

```typescript
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          authorsbook
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Hand-designed bookmarks & literary treasures. 
          Discover curated books and premium bookmarks for readers who love stories.
        </p>
        
        <Link
          href="/shop"
          className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          Start Shopping
        </Link>
      </div>
    </section>
  );
}
```

**Instructions for AGY:**
- Create file at `components/Hero.tsx`
- Copy exact code above
- Save file

---

## **PART 5: PAGES**

### **Task 5.1: Home Page**
**File:** `app/page.tsx`

```typescript
import Hero from '@/components/Hero';
import Navigation from '@/components/Navigation';
import ProductCard from '@/components/ProductCard';
import { connectDB } from '@/lib/db';
import Product from '@/lib/schemas/Product';

export default async function Home() {
  await connectDB();
  
  const products = await Product.find({ published: true })
    .limit(6)
    .sort({ createdAt: -1 });

  return (
    <>
      <Navigation />
      <main>
        <Hero />
        
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-12">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id.toString()} product={product} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
```

**Instructions for AGY:**
- Replace content of `app/page.tsx` with code above
- Save file

---

### **Task 5.2: Shop Page**
**File:** `app/shop/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import ProductCard from '@/components/ProductCard';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const res = await fetch(`/api/products?page=${page}&limit=12`);
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.pagination.total);
      setLoading(false);
    };
    
    fetchProducts();
  }, [page]);

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-12">All Products</h1>
        
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex gap-4 justify-center">
              {Array.from({ length: Math.ceil(total / 12) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 rounded ${
                    page === i + 1
                      ? 'bg-black text-white'
                      : 'border border-gray-300 hover:border-black'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
```

**Instructions for AGY:**
- Create file at `app/shop/page.tsx`
- Copy exact code above
- Save file

---

### **Task 5.3: Product Detail Page**
**File:** `app/product/[id]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { useParams } from 'next/navigation';

export default function ProductPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`/api/products/${params.id}`);
      const data = await res.json();
      setProduct(data);
    };
    
    fetchProduct();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item._id === product._id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('✅ Added to cart!');
  };

  if (!product) {
    return (
      <>
        <Navigation />
        <div className="text-center py-12">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
              {product.images[selectedImage] ? (
                <Image
                  src={product.images[selectedImage].url}
                  alt={product.images[selectedImage].alt || product.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            
            {/* Image thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 rounded border-2 overflow-hidden ${
                      selectedImage === idx ? 'border-black' : 'border-gray-300'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Details */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-gray-900">
                ₹{product.price}
              </span>
              {product.compareAtPrice && (
                <span className="text-lg text-gray-500 line-through">
                  ₹{product.compareAtPrice}
                </span>
              )}
            </div>
            
            {/* Description */}
            {product.description && (
              <div
                className="prose prose-sm mb-8"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
            
            {/* Quantity + Add to Cart */}
            <div className="flex gap-4 mb-8">
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border-x border-gray-300 py-2"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 font-medium"
              >
                Add to Cart
              </button>
            </div>
            
            {/* Meta info */}
            {(product.sku || product.material || product.color) && (
              <div className="border-t pt-6 space-y-2 text-sm">
                {product.sku && (
                  <p><span className="font-semibold">SKU:</span> {product.sku}</p>
                )}
                {product.material && (
                  <p><span className="font-semibold">Material:</span> {product.material}</p>
                )}
                {product.color && (
                  <p><span className="font-semibold">Color:</span> {product.color}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
```

**Instructions for AGY:**
- Create file at `app/product/[id]/page.tsx`
- Copy exact code above
- Save file

---

### **Task 5.4: Cart Page**
**File:** `app/cart/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Cart() {
  const [cart, setCart] = useState([]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal > 500 ? 0 : 100;
  const total = subtotal + shippingCost;

  const removeItem = (productId) => {
    const updated = cart.filter(item => item._id !== productId);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updated = cart.map(item =>
      item._id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const handleCheckout = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.street) {
      alert('Please fill all required fields');
      return;
    }

    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          subtotal,
          shippingCost,
          total,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
        }),
      });

      const data = await response.json();

      if (!data.razorpayOrderId) {
        throw new Error('Failed to create order');
      }

      // Load Razorpay
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: data.razorpayKey,
          amount: data.amount,
          currency: 'INR',
          order_id: data.razorpayOrderId,
          customer_notification: 1,
          handler: async (response) => {
            // Verify payment
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpayOrderId: data.razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              localStorage.removeItem('cart');
              router.push(`/order-success/${data.bookingId}`);
            } else {
              alert('Payment verification failed');
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
      document.body.appendChild(script);
    } catch (error) {
      alert('Checkout error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      {cart.length === 0 ? (
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <Link href="/shop" className="text-blue-600 hover:underline">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-lg p-4 flex gap-4">
                    {item.images[0] && (
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={item.images[0].url}
                          alt={item.title}
                          fill
                          className="object-cover rounded"
                          unoptimized
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-gray-600">₹{item.price}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="px-2 py-1 border rounded hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="px-3">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="px-2 py-1 border rounded hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">₹{item.price * item.quantity}</p>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="text-red-600 text-sm hover:underline mt-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Checkout Form + Summary */}
            <div className="lg:col-span-1">
              <div className="border border-gray-200 rounded-lg p-6 sticky top-20">
                {/* Order Summary */}
                <div className="mb-6 pb-6 border-b">
                  <h2 className="font-bold text-lg mb-4">Order Summary</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>Total:</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                </div>
                
                {/* Shipping Form */}
                <div className="space-y-3 mb-6">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Zip Code"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

**Instructions for AGY:**
- Create file at `app/cart/page.tsx`
- Copy exact code above
- Save file

---

## **PART 6: ENV SETUP & TESTING**

### **Task 6.1: Setup .env.local**
**File:** `.env.local` (at project root)

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/authorsbook
RAZORPAY_KEY_ID=your_key_here
RAZORPAY_KEY_SECRET=your_secret_here
NEXTAUTH_SECRET=a_random_secret_can_be_anything
NEXTAUTH_URL=http://localhost:3000
```

**Instructions for AGY:**
- Create `.env.local` file at project root
- Add placeholder values (will be updated after MongoDB setup)
- DO NOT commit this file to git

---

### **Task 6.2: Copy CSV File**
**File:** `products_export_1.csv` (at project root)

**Instructions for AGY:**
- Copy `products_export_1.csv` from parent directory to project root
- Verify file exists: `ls -la products_export_1.csv`

---

## **PART 7: FINAL SETUP & LAUNCH**

### **Step 1: Get MongoDB Connection String**
1. Go to https://mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Create database user + password
5. Get connection string
6. Replace in `.env.local`: `MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/authorsbook`

### **Step 2: Get Razorpay Keys**
1. Go to https://dashboard.razorpay.com
2. Get API Key ID and Secret
3. Update `.env.local` with keys

### **Step 3: Run Development Server**

```bash
npm run dev
```

Expected output:
```
▲ Next.js 16.2.12
- Local:        http://localhost:3000
```

### **Step 4: Test API**

Open browser: `http://localhost:3000/api/products`

Should return:
```json
{
  "products": [...],
  "pagination": { "total": 1234, "page": 1, "limit": 12, "pages": 103 }
}
```

### **Step 5: Seed Database**

```bash
node scripts/seed.js
```

Expected output:
```
✅ Cleared existing products
✅ Seeded 1234 products
```

### **Step 6: Test Frontend**

- Open `http://localhost:3000` → Home page with hero + featured products
- Open `http://localhost:3000/shop` → All products with pagination
- Click product → Product detail page
- Add to cart → Cart page with checkout

### **Step 7: Test Checkout (Optional)**

1. Add items to cart
2. Go to cart
3. Fill shipping details
4. Click "Proceed to Payment"
5. Use Razorpay test card: `4111 1111 1111 1111` (any future date, any CVV)

---

## **CHECKLIST FOR AGY**

- [ ] Part 1: Created 3 schema files (Product, Order, db.ts)
- [ ] Part 2: Created seed script
- [ ] Part 3: Created 4 API routes (products, products/[id], checkout, verify-payment)
- [ ] Part 4: Created 4 components (ProductCard, Navigation, Hero)
- [ ] Part 5: Created 4 pages (home, shop, product detail, cart)
- [ ] Part 6: Set .env.local with placeholders
- [ ] Part 6: Copied CSV file to project root
- [ ] Part 7: Setup MongoDB connection
- [ ] Part 7: Setup Razorpay keys
- [ ] Part 7: Test dev server
- [ ] Part 7: Seed database
- [ ] Part 7: Test frontend pages

---

## **NEXT STEPS AFTER LIVE**

Once basic site is working:
- [ ] Add order success page
- [ ] Add admin panel for orders
- [ ] Add Shiprocket integration
- [ ] Add email notifications
- [ ] Add customer login system
- [ ] Deploy to Vercel
- [ ] Setup domain + SSL
- [ ] Add Google Analytics
- [ ] SEO optimization

---

**Status:** Ready for AGY to execute 🚀
