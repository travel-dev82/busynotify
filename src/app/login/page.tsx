// =====================================================
// LOGIN PAGE
// =====================================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/shared/lib/stores';
import { useTranslation } from '@/shared/lib/language-context';
import { authService } from '@/versions/v1/services';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setSession, setLoading, setError, error, isLoading } = useAuthStore();
  const t = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const redirectAttempted = useRef(false);
  
  useEffect(() => {
    // Only redirect once to avoid loops
    if (isAuthenticated && !redirectAttempted.current) {
      redirectAttempted.current = true;
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.login({ username, password });
      
      if (result.success && result.session) {
        setSession(result.session);
        router.replace('/dashboard');
      } else {
        setError(result.error || t.auth.invalidCredentials);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Show loading if authenticated (will redirect)
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{t.auth.loginTitle}</CardTitle>
          <CardDescription>{t.auth.loginSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">{t.auth.username}</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                t.auth.loginButton
              )}
            </Button>
            
            {/* Demo credentials hint */}
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <p className="font-medium mb-1">Demo Credentials:</p>
              <ul className="space-y-0.5 text-xs">
                <li><code className="bg-background px-1 rounded">admin / admin</code> - Admin access</li>
                <li><code className="bg-background px-1 rounded">customer / customer</code> - Customer access</li>
                <li><code className="bg-background px-1 rounded">salesman / salesman</code> - Salesman access</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
