// =====================================================
// ROOT PAGE - Redirects to appropriate dashboard
// =====================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/shared/lib/stores';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const hasHydrated = useHasHydrated();
  
  useEffect(() => {
    // Wait for hydration before redirecting
    if (!hasHydrated) return;
    
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [hasHydrated, isAuthenticated, router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
