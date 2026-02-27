import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { MaintenanceWrapper } from "@/components/MaintenanceWrapper";
import { CookieConsent } from "@/components/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy, useEffect } from "react";
import { BackgroundOrderSync } from "@/lib/background-order-sync";
import Index from "./pages/Index";
import NotificationCenter from "./pages/NotificationCenter";

// Lazy load components for better performance
const Auth = lazy(() => import("./pages/Auth"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Bots = lazy(() => import("./pages/Bots"));
const Software = lazy(() => import("./pages/Software"));
const Templates = lazy(() => import("./pages/Templates"));
const UpgradeToSeller = lazy(() => import("./pages/UpgradeToSeller"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerVerification = lazy(() => import("./pages/SellerVerification"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const ContentPolicy = lazy(() => import("./pages/ContentPolicy"));
const ManualPayment = lazy(() => import("./pages/ManualPayment"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const Help = lazy(() => import("./pages/Help"));
const FAQ = lazy(() => import("./pages/FAQ"));
const FreelancingRoleSelection = lazy(() => import("./pages/FreelancingRoleSelection"));
const FreelancerDashboard = lazy(() => import("./pages/FreelancerDashboard"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const CreateProject = lazy(() => import("./pages/CreateProject"));
const FreelancerProfileSetup = lazy(() => import("./pages/FreelancerProfileSetup"));
const BusinessProfileSetup = lazy(() => import("./pages/BusinessProfileSetup"));
const BrowseProjects = lazy(() => import("./pages/BrowseProjects"));
const ProposalSubmission = lazy(() => import("./pages/ProposalSubmission"));
const ContractWorkspace = lazy(() => import("./pages/ContractWorkspace"));
const ReviewSystem = lazy(() => import("./pages/ReviewSystem"));
const DisputeResolution = lazy(() => import("./pages/DisputeResolution"));
const FreelancerSearch = lazy(() => import("./pages/FreelancerSearch"));
const MessagingCenter = lazy(() => import("./pages/MessagingCenter"));
const CryptomusPayment = lazy(() => import("./pages/CryptomusPayment"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Initialize background order sync service
  useEffect(() => {
    BackgroundOrderSync.init();
    BackgroundOrderSync.cleanupOldOrders();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <MaintenanceWrapper>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route path="/bots" element={<Bots />} />
                    <Route path="/software" element={<Software />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/cookie-policy" element={<CookiePolicy />} />
                    <Route path="/content-policy" element={<ContentPolicy />} />
                    <Route path="/upgrade-to-seller" element={<UpgradeToSeller />} />
                    <Route path="/seller-dashboard" element={<SellerDashboard />} />
                    <Route path="/seller-verification" element={<SellerVerification />} />
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                    <Route path="/manual-payment" element={<ManualPayment />} />
                    <Route path="/maintenance" element={<MaintenancePage />} />
                    <Route path="/sitemap" element={<Sitemap />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<Auth />} />
                    <Route path="/freelancing-role-selection" element={<FreelancingRoleSelection />} />
                    <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />
                    <Route path="/business-dashboard" element={<BusinessDashboard />} />
                    <Route path="/business/projects/create" element={<CreateProject />} />
                    <Route path="/freelancer/profile/setup" element={<FreelancerProfileSetup />} />
                    <Route path="/business/profile/setup" element={<BusinessProfileSetup />} />
                    <Route path="/freelancer/projects" element={<BrowseProjects />} />
                    <Route path="/freelancer/projects/:projectId/proposal" element={<ProposalSubmission />} />
                    <Route path="/freelancer/contracts/:contractId/workspace" element={<ContractWorkspace />} />
                    <Route path="/freelancer/contracts/:contractId/review" element={<ReviewSystem />} />
                    <Route path="/freelancer/contracts/:contractId/dispute" element={<DisputeResolution />} />
                    <Route path="/business/freelancers" element={<FreelancerSearch />} />
                    <Route path="/messages" element={<MessagingCenter />} />
                    <Route path="/cryptomus-payment" element={<CryptomusPayment />} />
                    <Route path="/payment-callback" element={<PaymentCallback />} />
                    <Route path="/notifications" element={<NotificationCenter />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <CookieConsent />
              </MaintenanceWrapper>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;