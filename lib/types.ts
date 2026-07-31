// Shared TypeScript interfaces for the Authors Book React app

export interface ProductImage {
  url: string;
  alt: string;
  position: number;
}

export interface Product {
  _id: string;
  handle: string;
  title: string;
  description?: string;
  vendor?: string;
  category?: string;
  type?: string;
  tags?: string[];
  published?: boolean;
  sku?: string;
  weight?: number;
  price: number;
  compareAtPrice?: number;
  inventory?: {
    quantity: number;
    policy: string;
  };
  images: ProductImage[];
  seoTitle?: string;
  seoDescription?: string;
  bookmarkShape?: string;
  color?: string;
  material?: string;
  targetAudience?: string;
  genre?: string;
  language?: string;
  createdAt?: string;
}

export interface CollectionPreview {
  name: string;
  handle: string;
  href: string;
  image?: string;
  productCount?: number;
  bgColor?: string;
}

export interface CategoryCard {
  heading: string;
  textColor: string;
  buttonLabel: string;
  buttonBgColor: string;
  buttonTextColor: string;
  link: string;
  bgColor: string;
  borderColor: string;
}

export interface AccordionRow {
  heading: string;
  content: string;
}
