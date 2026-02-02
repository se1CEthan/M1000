// Custom types for the Seltech marketplace

export type UserRole = 'buyer' | 'seller' | 'admin';
export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
export type OrderStatus = 'pending' | 'paid' | 'completed' | 'refunded' | 'disputed';
export type PricingType = 'one_time' | 'subscription_monthly' | 'subscription_yearly' | 'custom';
export type ProductCategory = 'bots' | 'software' | 'templates' | 'assets' | 'apis' | 'plugins';
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  is_verified_seller: boolean;
  website_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  wallet_address: string | null;
  total_earnings: number;
  total_sales: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string | null;
  category: ProductCategory;
  tags: string[];
  price: number;
  pricing_type: PricingType;
  subscription_price_monthly: number | null;
  subscription_price_yearly: number | null;
  status: ProductStatus;
  version: string;
  changelog: string | null;
  documentation_url: string | null;
  demo_url: string | null;
  thumbnail_url: string | null;
  preview_images: string[];
  video_url: string | null;
  file_url: string | null;
  file_size: number | null;
  download_count: number;
  view_count: number;
  average_rating: number;
  review_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  seller?: Profile;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  order_number: string;
  status: OrderStatus;
  price: number;
  platform_fee: number;
  seller_earnings: number;
  payment_id: string | null;
  payment_method: string;
  currency: string;
  crypto_currency: string | null;
  crypto_amount: number | null;
  download_url: string | null;
  download_expires_at: string | null;
  license_key: string | null;
  created_at: string;
  completed_at: string | null;
  product?: Product;
  buyer?: Profile;
  seller?: Profile;
}

export interface Review {
  id: string;
  product_id: string;
  buyer_id: string;
  order_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  seller_response: string | null;
  is_verified_purchase: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  buyer?: Profile;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Dispute {
  id: string;
  order_id: string;
  initiated_by: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  admin_notes: string | null;
  resolution: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
  order?: Order;
  initiator?: Profile;
}

export interface Payout {
  id: string;
  seller_id: string;
  amount: number;
  wallet_address: string;
  status: string;
  transaction_hash: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface PlatformSettings {
  id: string;
  key: string;
  value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Category display info
export const CATEGORY_INFO: Record<ProductCategory, { label: string; icon: string; color: string }> = {
  bots: { label: 'Bots', icon: 'Bot', color: 'category-bots' },
  software: { label: 'Software', icon: 'Package', color: 'category-software' },
  templates: { label: 'Templates', icon: 'Layout', color: 'category-templates' },
  assets: { label: 'Assets', icon: 'Image', color: 'category-assets' },
  apis: { label: 'APIs', icon: 'Plug', color: 'category-apis' },
  plugins: { label: 'Plugins', icon: 'Puzzle', color: 'category-plugins' },
};

// Pricing type display info
export const PRICING_TYPE_INFO: Record<PricingType, { label: string; description: string }> = {
  one_time: { label: 'One-time', description: 'Pay once, own forever' },
  subscription_monthly: { label: 'Monthly', description: 'Billed monthly' },
  subscription_yearly: { label: 'Yearly', description: 'Billed annually' },
  custom: { label: 'Custom', description: 'Contact seller for pricing' },
};
