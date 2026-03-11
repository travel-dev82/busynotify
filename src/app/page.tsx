// =====================================================
// ROOT PAGE - Redirects to appropriate dashboard
// =====================================================

'use client';

import { useEffect } from 'react';
import { useAuthStore, useHasHydrated } from '@/shared/lib/stores';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  
  useEffect(() => {
    // Wait for hydration before redirecting
    if (!hasHydrated) return;
    
    // Use window.location.href for full page reload to ensure
    // destination page reads fresh state from localStorage
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/login';
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [hasHydrated, isAuthenticated]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
