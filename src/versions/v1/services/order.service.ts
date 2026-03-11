// =====================================================
// ORDER SERVICE - Business Logic for Order Operations
// =====================================================

import type { Order, OrderItem, OrderStatus, OrderFilter } from '../../../shared/types';
import { orderRepository } from '../repositories/order.repository';
import { productService } from './product.service';

export class OrderService {
  /**
   * Get all orders
   */
  async getAllOrders(): Promise<Order[]> {
    return orderRepository.findAll();
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    return orderRepository.findById(id);
  }

  /**
   * Get orders for a customer
   */
  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return orderRepository.findByCustomerId(customerId);
  }

  /**
   * Get orders created by a user (salesman)
   */
  async getOrdersByCreator(createdBy: string): Promise<Order[]> {
    return orderRepository.findByCreator(createdBy);
  }

  /**
   * Get orders with filters
   */
  async getFilteredOrders(filter: OrderFilter): Promise<Order[]> {
    return orderRepository.findWithFilter(filter);
  }

  /**
   * Create new order
   */
  async createOrder(params: {
    customerId: string;
    customerName: string;
    items: Array<{
      productId: string;
      productName: string;
      productSku: string;
      quantity: number;
      unitPrice: number;
    }>;
    createdBy: string;
    createdByRole: 'customer' | 'salesman' | 'admin';
    notes?: string;
  }): Promise<{
    success: boolean;
    order?: Order;
    error?: string;
  }> {
    try {
      // Validate items and calculate totals
      const orderItems: OrderItem[] = [];
      
      for (const item of params.items) {
        // Check availability
        const availability = await productService.checkAvailability(
          item.productId,
          item.quantity
        );
        
        if (!availability.available) {
          return {
            success: false,
            error: `Product ${item.productName} has insufficient stock. Available: ${availability.stock}`,
          };
        }
        
        orderItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        });
      }
      
      // Create the order
      const order = await orderRepository.create(
        params.customerId,
        params.customerName,
        orderItems,
        params.createdBy,
        params.createdByRole,
        params.notes
      );
      
      return {
        success: true,
        order,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create order',
      };
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<{
    success: boolean;
    order?: Order;
    error?: string;
  }> {
    try {
      const order = await orderRepository.updateStatus(orderId, status);
      
      if (!order) {
        return {
          success: false,
          error: 'Order not found',
        };
      }
      
      return {
        success: true,
        order,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update order status',
      };
    }
  }
}

// Singleton instance
export const orderService = new OrderService();
