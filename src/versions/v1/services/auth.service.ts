// =====================================================
// AUTH SERVICE - Business Logic for Authentication
// =====================================================

import type { User, AuthCredentials, AuthSession } from '../../../shared/types';
import { authRepository } from '../repositories/auth.repository';

export class AuthService {
  /**
   * Login user with credentials
   * Returns session on success, null on failure
   */
  async login(credentials: AuthCredentials): Promise<{
    success: boolean;
    session?: AuthSession;
    error?: string;
  }> {
    try {
      // Validate credentials
      const user = await authRepository.validateLogin(credentials);
      
      if (!user) {
        return {
          success: false,
          error: 'Invalid username or password',
        };
      }
      
      // Create session
      const session = await authRepository.createSession(user);
      
      return {
        success: true,
        session,
      };
    } catch (error) {
      return {
        success: false,
        error: 'An error occurred during login',
      };
    }
  }

  /**
   * Validate existing session
   */
  async validateSession(token: string): Promise<AuthSession | null> {
    return authRepository.validateSession(token);
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(token: string): Promise<void> {
    await authRepository.invalidateSession(token);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return authRepository.getUserById(id);
  }
}

// Singleton instance
export const authService = new AuthService();
