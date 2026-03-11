// =====================================================
// CART STORE - Zustand Store for Shopping Cart State
// =====================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '../../types';

interface CartState {
  items: CartItem[];
  customerId?: string;
  customerName?: string;
  
  // Computed values
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  
  // Actions
  addItem: (product: Product, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomer: (customerId: string, customerName: string) => void;
  clearCustomer: () => void;
}

const TAX_RATE = 0.18; // 18% GST

function calculateTotals(items: CartItem[]) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  return { totalItems, subtotal, tax, total };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: undefined,
      customerName: undefined,
      totalItems: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
      
      addItem: (product, quantity) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) => item.product.id === product.id
        );
        
        let newItems: CartItem[];
        
        if (existingIndex >= 0) {
          // Update existing item
          newItems = items.map((item, index) => {
            if (index === existingIndex) {
              const newQuantity = item.quantity + quantity;
              return {
                ...item,
                quantity: newQuantity,
                totalPrice: item.unitPrice * newQuantity,
              };
            }
            return item;
          });
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `cart_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            product,
            quantity,
            unitPrice: product.price,
            totalPrice: product.price * quantity,
          };
          newItems = [...items, newItem];
        }
        
        const totals = calculateTotals(newItems);
        set({ items: newItems, ...totals });
      },
      
      removeItem: (itemId) => {
        const newItems = get().items.filter((item) => item.id !== itemId);
        const totals = calculateTotals(newItems);
        set({ items: newItems, ...totals });
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        const newItems = get().items.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity,
              totalPrice: item.unitPrice * quantity,
            };
          }
          return item;
        });
        
        const totals = calculateTotals(newItems);
        set({ items: newItems, ...totals });
      },
      
      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          subtotal: 0,
          tax: 0,
          total: 0,
        });
      },
      
      setCustomer: (customerId, customerName) => {
        set({ customerId, customerName });
      },
      
      clearCustomer: () => {
        set({ customerId: undefined, customerName: undefined });
      },
    }),
    {
      name: 'busy-notify-cart',
      partialize: (state) => ({
        items: state.items,
        customerId: state.customerId,
        customerName: state.customerName,
      }),
    }
  )
);

// Selector hooks
export const useCartItems = () => useCartStore((state) => state.items);
export const useCartTotal = () => useCartStore((state) => state.total);
export const useCartItemCount = () => useCartStore((state) => state.totalItems);
