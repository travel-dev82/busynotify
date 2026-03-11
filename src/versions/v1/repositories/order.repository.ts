// =====================================================
// ORDER REPOSITORY - Data Access Layer for Orders
// =====================================================

import type { Order, OrderItem, OrderStatus, OrderFilter } from '../../../shared/types';
import {
  getAllOrders,
  getOrdersByCustomerId,
  getOrdersByCreator,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getFilteredOrders,
} from '../mock-data/orders';

export class OrderRepository {
  /**
   * Get all orders
   * @future Replace with: GET /api/orders
   */
  async findAll(): Promise<Order[]> {
    await this.simulateDelay();
    return getAllOrders();
  }

  /**
   * Get order by ID
   * @future Replace with: GET /api/orders/:id
   */
  async findById(id: string): Promise<Order | null> {
    await this.simulateDelay();
    return getOrderById(id) || null;
  }

  /**
   * Get orders by customer ID
   * @future Replace with: GET /api/orders?customerId=xxx
   */
  async findByCustomerId(customerId: string): Promise<Order[]> {
    await this.simulateDelay();
    return getOrdersByCustomerId(customerId);
  }

  /**
   * Get orders by creator (salesman)
   * @future Replace with: GET /api/orders?createdBy=xxx
   */
  async findByCreator(createdBy: string): Promise<Order[]> {
    await this.simulateDelay();
    return getOrdersByCreator(createdBy);
  }

  /**
   * Create new order
   * @future Replace with: POST /api/orders
   */
  async create(
    customerId: string,
    customerName: string,
    items: OrderItem[],
    createdBy: string,
    createdByRole: 'customer' | 'salesman' | 'admin',
    notes?: string
  ): Promise<Order> {
    await this.simulateDelay();
    return createOrder(customerId, customerName, items, createdBy, createdByRole, notes);
  }

  /**
   * Update order status
   * @future Replace with: PATCH /api/orders/:id/status
   */
  async updateStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    await this.simulateDelay();
    return updateOrderStatus(orderId, status);
  }

  /**
   * Get orders with filters
   * @future Replace with: GET /api/orders with query params
   */
  async findWithFilter(filter: OrderFilter): Promise<Order[]> {
    await this.simulateDelay();
    return getFilteredOrders(filter);
  }

  private async simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  }
}

// Singleton instance
export const orderRepository = new OrderRepository();
