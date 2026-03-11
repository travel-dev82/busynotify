// =====================================================
// SHARED TYPES - Core Domain Models
// These types are shared across all versions
// =====================================================

// ==================== USER & AUTH ====================

export type Role = 'admin' | 'customer' | 'salesman';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

// ==================== CUSTOMER ====================

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  creditLimit?: number;
  outstandingBalance?: number;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  city: string;
}

// ==================== PRODUCT ====================

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  unit: string;
  category: string;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

// ==================== CART ====================

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  customerId?: string; // For salesman mode
  customerName?: string; // For salesman mode
}

// ==================== ORDER ====================

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User ID who created the order
  createdByRole: Role; // Role of the user who created
  notes?: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  itemCount: number;
}

// ==================== NAVIGATION ====================

export interface NavigationItem {
  id: string;
  labelKey: string; // Translation key
  href: string;
  icon?: string;
  roles: Role[];
  children?: NavigationItem[];
  badge?: string | number;
}

// ==================== TRANSLATION ====================

export type TranslationKey = string; // Will be typed by translation schema

export interface TranslationSchema {
  common: {
    appName: string;
    loading: string;
    error: string;
    success: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    clear: string;
    submit: string;
    back: string;
    next: string;
    confirm: string;
    close: string;
    logout: string;
    login: string;
    dashboard: string;
    orders: string;
    orderList: string;
    placeOrder: string;
    cart: string;
    profile: string;
    settings: string;
    language: string;
    english: string;
    hindi: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    username: string;
    password: string;
    rememberMe: string;
    forgotPassword: string;
    loginButton: string;
    invalidCredentials: string;
    welcomeBack: string;
  };
  dashboard: {
    customerTitle: string;
    salesmanTitle: string;
    adminTitle: string;
    welcomeMessage: string;
    quickActions: string;
    recentOrders: string;
    totalOrders: string;
    pendingOrders: string;
    completedOrders: string;
    placeNewOrder: string;
    viewAllOrders: string;
  };
  order: {
    title: string;
    selectCustomer: string;
    searchCustomer: string;
    noCustomerSelected: string;
    products: string;
    addToCart: string;
    addedToCart: string;
    outOfStock: string;
    inStock: string;
    quantity: string;
    price: string;
    total: string;
    category: string;
    allCategories: string;
  };
  cart: {
    title: string;
    empty: string;
    items: string;
    removeItem: string;
    clearCart: string;
    subtotal: string;
    tax: string;
    grandTotal: string;
    placeOrder: string;
    orderFor: string;
    yourOrder: string;
    confirmOrder: string;
    orderSuccess: string;
    orderSuccessMessage: string;
  };
  orderList: {
    title: string;
    noOrders: string;
    orderNumber: string;
    customer: string;
    date: string;
    status: string;
    total: string;
    actions: string;
    viewDetails: string;
  };
  navigation: {
    home: string;
    dashboard: string;
    newOrder: string;
    orders: string;
    customers: string;
    products: string;
    reports: string;
    settings: string;
  };
}

// ==================== WHITE LABEL / BRAND ====================

export interface BrandConfig {
  name: string;
  tagline?: string;
  logo: string;
  logoDark?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  companyName: string;
  supportEmail?: string;
  supportPhone?: string;
  defaultLanguage: 'en' | 'hi';
  currency: string;
  currencySymbol: string;
}

export interface FeatureFlags {
  enableCart: boolean;
  enableOrderHistory: boolean;
  enableCustomerSearch: boolean;
  enableProductCategories: boolean;
  enableTaxCalculation: boolean;
  enableOrderNotes: boolean;
  maxCartItems?: number;
}

export interface WhiteLabelConfig {
  brand: BrandConfig;
  features: FeatureFlags;
  version: string;
  tenantId?: string; // For future multi-tenant support
}

// ==================== API RESPONSE ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== FILTER TYPES ====================

export interface ProductFilter {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface OrderFilter {
  status?: OrderStatus;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ==================== STATE TYPES ====================

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  language: 'en' | 'hi';
  brandConfig: WhiteLabelConfig | null;
}
