import React, { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Production-safe lazy loading with error boundaries
const safeImport = (importFn: () => Promise<any>, fallbackName: string) => {
  return lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error(`Failed to load ${fallbackName}:`, error);
      // Return a fallback component
      return {
        default: () => (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center p-8">
              <h1 className="text-2xl font-bold mb-4">Page Unavailable</h1>
              <p className="text-muted-foreground mb-4">
                This page is temporarily unavailable.
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Go Home
              </button>
            </div>
          </div>
        )
      };
    }
  });
};

// Lazy load components with fallbacks
const Index = safeImport(() => import("./pages/Index"), "Index");
const Auth = safeImport(() => import("./pages/Auth"), "Auth");
const Marketplace = safeImport(() => import("./pages/Marketplace"), "Marketplace");
const Bots = safeImport(() => import("./pages/Bots"), "Bots");
const Software = safeImport(() => import("./pages/Software"), "Software");
const Templates = safeImport(() => import("./pages/Templates"), "Templates");
const UpgradeToSeller = safeImport(() => import("./pages/UpgradeToSeller"), "UpgradeToSeller");
const SellerDashboard = safeImport(() => import("./pages/SellerDashboard"), "SellerDashboard");
const SellerVerification = safeImport(() => import("./pages/SellerVerification"), "SellerVerification");
const AdminDashboard = safeImport(() => import("./pages/AdminDashboard"), "AdminDashboard");

// Fallback loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Simple 404 component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center p-8">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-4">Page not found</p>
      <button
        onClick={() => window.location.href = '/'}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Go Home
      </button>
    </div>
  </div>
);

// Production-optimized QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// App status component
const AppStatus = () => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    // Check if all critical dependencies are loaded
    const checkStatus = async () => {
      try {
        // Verify React is working
        if (!React.version) throw new Error('React not loaded');
        
        // Verify environment
        if (!import.meta.env.VITE_SUPABASE_URL) {
          console.warn('Supabase URL not configured');
        }
        
        setStatus('ready');
      } catch (error) {
        console.error('App status check failed:', error);
        setStatus('error');
      }
    };

    checkStatus();
  }, []);

  if (status === 'loading') return <PageLoader />;
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-destructive">System Error</h1>
          <p className="text-muted-foreground mb-4">
            Unable to initialize the application
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return null;
};

const DebugApp = () => {
  console.log("🔧 Debug App initializing...");

  return (
    <ErrorBoundary>
      <AppStatus />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/bots" element={<Bots />} />
              <Route path="/software" element={<Software />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/upgrade-to-seller" element={<UpgradeToSeller />} />
              <Route path="/seller-dashboard" element={<SellerDashboard />} />
              <Route path="/seller-verification" element={<SellerVerification />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default DebugApp;