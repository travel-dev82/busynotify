// =====================================================
// ROOT PAGE - Redirects to appropriate dashboard
// =====================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/lib/stores';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    // Use a small timeout to ensure hydration is complete
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
