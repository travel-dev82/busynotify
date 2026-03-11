// =====================================================
// AUTH REPOSITORY - Data Access Layer for Authentication
// =====================================================

import type { User, AuthCredentials, AuthSession } from '../../../shared/types';
import {
  getUserByUsername,
  validateCredentials,
} from '../mock-data/users';

// In a real app, this would be replaced with API calls
// Phase 1: Uses mock data

export class AuthRepository {
  private sessions: Map<string, AuthSession> = new Map();

  /**
   * Validate user credentials
   * @future Replace with: POST /api/auth/login
   */
  async validateLogin(credentials: AuthCredentials): Promise<User | null> {
    // Simulate network delay
    await this.simulateDelay();
    
    return validateCredentials(credentials.username, credentials.password);
  }

  /**
   * Create a session for the user
   * @future Replace with: Response from POST /api/auth/login
   */
  async createSession(user: User): Promise<AuthSession> {
    await this.simulateDelay();
    
    const session: AuthSession = {
      user,
      token: this.generateMockToken(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    
    this.sessions.set(session.token, session);
    return session;
  }

  /**
   * Validate an existing session
   * @future Replace with: GET /api/auth/validate
   */
  async validateSession(token: string): Promise<AuthSession | null> {
    await this.simulateDelay();
    
    const session = this.sessions.get(token);
    if (session && session.expiresAt > Date.now()) {
      return session;
    }
    
    // Clean up expired session
    if (session) {
      this.sessions.delete(token);
    }
    
    return null;
  }

  /**
   * Invalidate a session (logout)
   * @future Replace with: POST /api/auth/logout
   */
  async invalidateSession(token: string): Promise<void> {
    await this.simulateDelay();
    this.sessions.delete(token);
  }

  /**
   * Get user by ID
   * @future Replace with: GET /api/users/:id
   */
  async getUserById(id: string): Promise<User | null> {
    await this.simulateDelay();
    
    const users = [
      { id: 'usr_001', username: 'admin', name: 'Admin User', role: 'admin' as const },
      { id: 'usr_002', username: 'customer', name: 'Rahul Sharma', role: 'customer' as const },
      { id: 'usr_003', username: 'salesman', name: 'Vikram Singh', role: 'salesman' as const },
    ];
    
    const user = users.find(u => u.id === id);
    return user || null;
  }

  // Helper methods
  private generateMockToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private async simulateDelay(): Promise<void> {
    // Simulate network delay (100-300ms)
    return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  }
}

// Singleton instance
export const authRepository = new AuthRepository();
