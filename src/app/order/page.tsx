// =====================================================
// ORDER PAGE - Product Listing with Pagination and Cart
// =====================================================

'use client';

import React, { useEffect, useState, Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  ChevronsUpDown,
  Package,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useAuthStore, 
  useCartStore, 
  useHasHydrated,
  useCompanyStore,
  useProductStore,
  usePaginationStore,
  fetchProducts,
} from '@/shared/lib/stores';
import { useTranslation } from '@/shared/lib/language-context';
import { AppShell } from '@/shared/components/app-shell';
import { formatCurrency } from '@/shared/components/format-currency';
import { useSetHeaderActions } from '@/shared/lib/header-action-context';
import { customerService, orderService } from '@/versions/v1/services';
import type { ProductDisplay, Customer, ProductCategory } from '@/shared/types';

// Constants
const DEFAULT_PAGE_SIZE = 25;
const MAX_PRODUCTS = 25000;

// Header Actions Component - Renders in AppShell header
function OrderHeaderActions({ 
  totalItems, 
  total, 
  onOpenCart, 
  onClearCart 
}: { 
  totalItems: number; 
  total: number;
  onOpenCart: () => void;
  onClearCart: () => void;
}) {
  const t = useTranslation();
  
  return (
    <div className="flex items-center gap-2">
      {totalItems > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-destructive hover:text-destructive hidden sm:flex"
          onClick={onClearCart}
        >
          Clear
        </Button>
      )}
      <Button onClick={onOpenCart} className="relative" size="sm">
        <ShoppingCart className="mr-2 h-4 w-4" />
        {t.common.cart}
        {totalItems > 0 && (
          <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
            {totalItems}
          </Badge>
        )}
      </Button>
    </div>
  );
}

// Inner content component that sets header actions (must be inside AppShell)
function OrderPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCart = searchParams.get('cart') === 'true';
  
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const { selectedCompany } = useCompanyStore();
  const { 
    products, 
    isLoading: productsLoading, 
    error: productsError,
    setProducts,
    setLoading: setProductsLoading,
    setError: setProductsError,
    lastCompanyId,
    lastFinancialYear,
  } = useProductStore();
  const {
    items,
    customerId,
    customerName,
    totalItems,
    subtotal,
    tax,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomer,
    clearCustomer,
  } = useCartStore();
  const { pageSize } = usePaginationStore();
  const t = useTranslation();
  
  // Local state
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartDialog, setShowCartDialog] = useState(showCart);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentPage, setLocalCurrentPage] = useState(1);

  // Calculate total pages and paginated products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.groupName === selectedCategory;
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.hsnCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productId.toString().includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / pageSize);
  }, [filteredProducts.length, pageSize]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredProducts.length);
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setLocalCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Generate page numbers to display
  const getPageNumbers = useCallback(() => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  // Header actions - rendered in AppShell header
  const headerActions = useMemo(() => (
    <OrderHeaderActions
      totalItems={totalItems}
      total={total}
      onOpenCart={() => setShowCartDialog(true)}
      onClearCart={clearCart}
    />
  ), [totalItems, total, clearCart]);

  // Set header actions in AppShell - this hook must be called inside AppShell
  useSetHeaderActions(headerActions);

  // Fetch products when company changes
  const loadProducts = useCallback(async () => {
    if (!selectedCompany) return;
    
    const companyId = selectedCompany.companyId;
    const financialYear = selectedCompany.financialYear;
    
    if (lastCompanyId === companyId && lastFinancialYear === financialYear && products.length > 0) {
      return;
    }
    
    setProductsLoading(true);
    setProductsError(null);
    
    try {
      const result = await fetchProducts(companyId, financialYear);
      
      if (result.success && result.data && result.rawData && result.apiResponse) {
        setProducts(result.data, result.rawData, result.apiResponse, selectedCompany);
        
        const uniqueGroups = [...new Set(result.data.map(p => p.groupName))];
        const categoryList: ProductCategory[] = uniqueGroups.map((name, index) => ({
          id: index.toString(),
          name,
        }));
        setCategories(categoryList);
      } else {
        setProductsError(result.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      setProductsError('Failed to load products');
    }
  }, [selectedCompany, lastCompanyId, lastFinancialYear, products.length, setProducts, setProductsLoading, setProductsError]);

  useEffect(() => {
    if (!hasHydrated) return;
    
    const timer = setTimeout(() => {
      if (!isAuthenticated || !user) {
        window.location.href = '/login';
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [hasHydrated, isAuthenticated, user]);
  
  useEffect(() => {
    if (showCart) {
      setShowCartDialog(true);
    }
  }, [showCart]);

  useEffect(() => {
    if (selectedCompany && isAuthenticated) {
      loadProducts();
    }
  }, [selectedCompany, isAuthenticated, loadProducts]);
  
  useEffect(() => {
    const loadCustomers = async () => {
      if (user?.role === 'salesman') {
        try {
          const customersData = await customerService.getAllCustomers();
          setCustomers(customersData);
        } catch (error) {
          console.error('Failed to load customers:', error);
        }
      }
    };
    
    if (isAuthenticated && user) {
      loadCustomers();
    }
  }, [isAuthenticated, user]);
  
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const convertToCartProduct = (product: ProductDisplay) => ({
    id: product.id,
    sku: product.hsnCode,
    name: product.name,
    description: '',
    price: product.price,
    currency: 'INR',
    unit: product.unit,
    category: product.groupName,
    stock: product.stock,
    isActive: true,
  });

  const handleAddToCart = (product: ProductDisplay) => {
    const cartProduct = convertToCartProduct(product);
    addItem(cartProduct, 1, product.taxRate);
  };
  
  const getProductQuantityInCart = (productId: string): number => {
    const item = items.find(i => i.product.id === productId);
    return item?.quantity || 0;
  };
  
  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    
    if (user?.role === 'salesman' && !customerId) {
      setShowCustomerSelect(true);
      return;
    }
    
    const orderCustomerId = user?.role === 'customer' ? `cust_${user.id}` : customerId;
    const orderCustomerName = user?.role === 'customer' ? user.name : customerName;
    
    setIsPlacingOrder(true);
    
    try {
      const result = await orderService.createOrder({
        customerId: orderCustomerId || '',
        customerName: orderCustomerName || '',
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productSku: item.product.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        createdBy: user!.id,
        createdByRole: user!.role as 'customer' | 'salesman' | 'admin',
      });
      
      if (result.success) {
        clearCart();
        if (user?.role === 'salesman') {
          clearCustomer();
        }
        setOrderSuccess(true);
        setShowCartDialog(false);
      }
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      setIsPlacingOrder(false);
    }
  };
  
  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-6", totalItems > 0 && "pb-20 lg:pb-0")}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.order.title}</h1>
          <p className="text-muted-foreground">
            {selectedCompany 
              ? `${selectedCompany.companyName} - FY: ${selectedCompany.financialYear}`
              : 'Select a company to view products'}
          </p>
        </div>
        
        {user.role === 'salesman' && (
          <Popover open={showCustomerSelect} onOpenChange={setShowCustomerSelect}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {customerName || t.order.selectCustomer}
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder={t.order.searchCustomer}
                  value={customerSearch}
                  onValueChange={setCustomerSearch}
                />
                <CommandList>
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup>
                    {filteredCustomers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => {
                          setCustomer(customer.id, customer.name);
                          setShowCustomerSelect(false);
                          setCustomerSearch('');
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            customerId === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{customer.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {customer.phone} • {customer.city}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {!selectedCompany && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">No Company Selected</p>
              <p className="text-sm text-yellow-700">
                Please select a company from the header dropdown to view products.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {productsError && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Error Loading Products</p>
              <p className="text-sm text-destructive/80">{productsError}</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadProducts} className="ml-auto">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
      
      {selectedCompany && (
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, HSN code, or product ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t.order.category} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.order.allCategories}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedCompany && filteredProducts.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} products
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}
      
      {productsLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      ) : selectedCompany && products.length === 0 && !productsError ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No Products Found</p>
          <p className="text-sm text-muted-foreground">
            No products available for this company.
          </p>
        </div>
      ) : selectedCompany && filteredProducts.length === 0 && searchQuery ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Search className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No Results</p>
          <p className="text-sm text-muted-foreground">
            No products match your search criteria.
          </p>
        </div>
      ) : selectedCompany && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {paginatedProducts.map((product) => {
              const quantityInCart = getProductQuantityInCart(product.id);
              
              return (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" />
                  </div>
                  <CardContent className="p-2 sm:p-3">
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs sm:text-sm line-clamp-1">{product.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            ID: {product.productId} • {product.unit}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px] px-1 py-0 h-4 sm:h-5">
                          {product.groupName}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm sm:text-base">
                            {formatCurrency(product.price)}
                          </span>
                          {product.mrp > product.price && (
                            <span className="text-[10px] text-muted-foreground line-through ml-1">
                              {formatCurrency(product.mrp)}
                            </span>
                          )}
                        </div>
                        <Badge 
                          variant={product.stock > 0 ? "default" : "secondary"} 
                          className="text-[10px] px-1 py-0 h-4 sm:h-5"
                        >
                          {product.stock > 0 ? product.stock : 'Out'}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {product.taxName} ({product.taxRate}%)
                      </div>
                      
                      {quantityInCart > 0 ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7"
                              onClick={() => updateQuantity(
                                items.find(i => i.product.id === product.id)?.id || '',
                                quantityInCart - 1
                              )}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-5 sm:w-6 text-center text-xs sm:text-sm font-medium">{quantityInCart}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 sm:h-7 sm:w-7"
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stock <= quantityInCart}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7 text-destructive"
                            onClick={() => removeItem(
                              items.find(i => i.product.id === product.id)?.id || ''
                            )}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full h-7 sm:h-8 text-xs"
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          {t.order.addToCart}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Pagination>
                <PaginationContent>
                  {currentPage > 2 && (
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => setLocalCurrentPage(1)}
                        className="cursor-pointer"
                      >
                        First
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setLocalCurrentPage(Math.max(1, currentPage - 1))}
                      className={cn(
                        "cursor-pointer",
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                  
                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => setLocalCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setLocalCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={cn(
                        "cursor-pointer",
                        currentPage === totalPages && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                  
                  {currentPage < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => setLocalCurrentPage(totalPages)}
                        className="cursor-pointer"
                      >
                        Last
                      </PaginationLink>
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Go to page:</span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setLocalCurrentPage(page);
                    }
                  }}
                  className="w-16 h-8 text-center"
                />
                <span className="text-muted-foreground">of {totalPages}</span>
              </div>
            </div>
          )}
        </>
      )}
      
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <div className="bg-background/95 backdrop-blur-sm border-t shadow-lg">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{totalItems}</span>
                  <span className="text-xs text-muted-foreground">items</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div>
                  <span className="font-bold text-sm">{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive"
                  onClick={clearCart}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowCartDialog(true)}
                >
                  View Cart
                </Button>
              </div>
            </div>
          </div>
          <div className="h-[env(safe-area-inset-bottom)] bg-background/95" />
        </div>
      )}
      
      <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t.cart.title}</DialogTitle>
            <DialogDescription>
              {totalItems} {t.cart.items}
            </DialogDescription>
          </DialogHeader>
          
          {items.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t.cart.empty}
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-medium w-20 text-right">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="space-y-4 pt-4 border-t">
                {user?.role === 'salesman' && customerName && (
                  <div className="text-sm text-muted-foreground">
                    {t.cart.orderFor}: <span className="font-medium text-foreground">{customerName}</span>
                  </div>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.cart.subtotal}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.cart.tax}</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t.cart.grandTotal}</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearCart} className="flex-1">
                    {t.cart.clearCart}
                  </Button>
                  <Button 
                    onClick={handlePlaceOrder} 
                    className="flex-1"
                    disabled={isPlacingOrder || (user?.role === 'salesman' && !customerId)}
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Placing...
                      </>
                    ) : (
                      t.cart.placeOrder
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={orderSuccess} onOpenChange={setOrderSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">{t.cart.orderSuccess}</DialogTitle>
            <DialogDescription>
              {t.cart.orderSuccessMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => {
              setOrderSuccess(false);
              router.push('/orders');
            }}>
              {t.dashboard.viewAllOrders}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderPageContent() {
  return (
    <AppShell>
      <OrderPageInner />
    </AppShell>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}
