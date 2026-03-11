// =====================================================
// ORDER PAGE - Product Listing and Cart
// =====================================================

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  ChevronsUpDown,
  Package,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useCartStore } from '@/shared/lib/stores';
import { useTranslation } from '@/shared/lib/language-context';
import { AppShell } from '@/shared/components/app-shell';
import { formatCurrency } from '@/shared/components/format-currency';
import { productService, customerService, orderService } from '@/versions/v1/services';
import type { Product, ProductCategory, Customer } from '@/shared/types';

function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showCart = searchParams.get('cart') === 'true';
  
  const { user, isAuthenticated } = useAuthStore();
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
  const t = useTranslation();
  
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCartDialog, setShowCartDialog] = useState(showCart);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    
    loadData();
  }, [mounted, isAuthenticated, router, user]);
  
  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getAllProducts(),
        productService.getCategories(),
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);
      
      // Load customers if salesman
      if (user?.role === 'salesman') {
        const customersData = await customerService.getAllCustomers();
        setCustomers(customersData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );
  
  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
  };
  
  const getProductQuantityInCart = (productId: string): number => {
    const item = items.find(i => i.product.id === productId);
    return item?.quantity || 0;
  };
  
  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    
    // For salesman, ensure customer is selected
    if (user?.role === 'salesman' && !customerId) {
      setShowCustomerSelect(true);
      return;
    }
    
    // For customer, use their own ID
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
  
  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
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
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.order.title}</h1>
            <p className="text-muted-foreground">
              {user.role === 'salesman' 
                ? `${t.cart.orderFor}: ${customerName || 'Select customer'}`
                : t.order.products}
            </p>
          </div>
          
          <div className="flex gap-2">
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
            
            <Button onClick={() => setShowCartDialog(true)} className="relative">
              <ShoppingCart className="mr-2 h-4 w-4" />
              {t.common.cart}
              {totalItems > 0 && (
                <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
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
        
        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const quantityInCart = getProductQuantityInCart(product.id);
              
              return (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {product.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">
                          {formatCurrency(product.price)}
                        </span>
                        <Badge variant={product.stock > 0 ? "default" : "secondary"}>
                          {product.stock > 0 ? `${product.stock} ${t.order.inStock}` : t.order.outOfStock}
                        </Badge>
                      </div>
                      
                      {quantityInCart > 0 ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(
                                items.find(i => i.product.id === product.id)?.id || '',
                                quantityInCart - 1
                              )}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{quantityInCart}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stock <= quantityInCart}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeItem(
                              items.find(i => i.product.id === product.id)?.id || ''
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t.order.addToCart}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Cart Dialog */}
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
        
        {/* Order Success Dialog */}
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
