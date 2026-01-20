// Database types matching Supabase schema

export type UserRole = 'admin' | 'ops' | 'sales' | 'retailer';
export type RetailerStatus = 'pending' | 'approved' | 'rejected';
export type BusinessType = 'Trader' | 'Fabricator' | 'Builder' | 'Architect' | 'Other';
export type OrderStatus = 'placed' | 'partially_shipped' | 'shipped' | 'cancelled';
export type ItemStatus = 'active' | 'inactive' | 'draft';
export type CategoryStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Retailer {
  id: string;
  user_id: string;
  retailer_code: string; // Auto-generated: RTL-XXXXX
  business_name: string;
  business_type: BusinessType;
  gst_number?: string;
  pan_number: string;
  business_address: string;
  pincode: string;
  city: string;
  state: string;
  owner_name: string;
  owner_dob?: string;
  owner_phone: string;
  alternate_phone?: string;
  status: RetailerStatus;
  credit_limit?: number;
  outstanding_dues: number;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_by?: string; // sales person who registered
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  discount_percent: number;
  status: CategoryStatus;
  created_at: string;
  updated_at: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  discount_percent: number;
  status: CategoryStatus;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  description?: string;
  mrp: number;
  unit: string;
  category_id: string;
  subcategory_id?: string;
  min_stock_level: number;
  current_stock: number;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
  subcategory?: Subcategory;
  images?: ItemImage[];
  pincodes?: string[];
}

export interface ItemImage {
  id: string;
  item_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  retailer_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  // Joined
  item?: Item;
}

export interface Order {
  id: string;
  order_number: string; // Auto: ORD-YYYYMMDD-XXXXX
  retailer_id: string;
  status: OrderStatus;
  subtotal: number;
  total_freight: number;
  grand_total: number;
  delivery_address: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  retailer?: Retailer;
  items?: OrderItem[];
  shipments?: Shipment[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_name: string;
  item_sku: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
  shipped_quantity: number;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  shipment_number: string;
  freight_charge: number;
  notes?: string;
  invoice_number?: string;
  invoice_url?: string;
  created_by: string;
  created_at: string;
  items?: ShipmentItem[];
}

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  order_item_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PaymentTransaction {
  id: string;
  retailer_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  order_id?: string;
  reference?: string;
  balance_after: number;
  created_by: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  retailer_id: string;
  item_id: string;
  created_at: string;
  item?: Item;
}

// Auth context types
export interface AuthState {
  user: User | null;
  retailer: Retailer | null;
  role: UserRole | null;
  status: RetailerStatus | null;
  isLoading: boolean;
  isPhoneVerified: boolean;
}
