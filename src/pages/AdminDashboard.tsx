import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Package, 
  Shield, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  BarChart3,
  Settings,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/clients';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { DataTable, TableColumn } from '@/components/shared/DataTable';
import { AdminUserManagement } from '@/components/admin/AdminUserManagement';
import { SimpleUserManagement } from '@/components/admin/SimpleUserManagement';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { MaintenanceSettings } from '@/components/admin/MaintenanceSettings';
import { Product } from '@/types/database';
import { ProductReviewDetail } from '@/components/admin/ProductReviewDetail';
import { AdminAnalyticsEnhanced } from '@/components/admin/AdminAnalyticsEnhanced';
import { LiveAdminStats } from '@/components/admin/LiveAdminStats';
import { LiveNotificationCenter } from '@/components/admin/LiveNotificationCenter';
import { LiveActivityFeed } from '@/components/admin/LiveActivityFeed';
import { SimpleSellerManagement } from '@/components/admin/SimpleSellerManagement';
import { SellerVerificationReview } from '@/components/admin/SellerVerificationReview';
import { MaintenanceSettings } from '@/components/admin/MaintenanceSettings';
import { AdminPurchasesAndPayouts } from '@/components/admin/AdminPurchasesAndPayouts';

interface ProductWithSeller extends Product {
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithSeller | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [useSimpleUserManagement, setUseSimpleUserManagement] = useState(false);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    return (
      <DashboardLayout
        title="Live Admin Dashboard"
        subtitle="Real-time platform monitoring and management"
      >
        {/* Mobile-Responsive Header with Live Notifications */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 mb-4 sm:mb-6">
          <LiveNotificationCenter />
        </div>
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductAction = async (productId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Product ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} product`,
        variant: 'destructive',
      });
    }
  };

  // Redirect if not admin
  if (!user || !profile || profile.role !== 'admin') {
    return (
      <DashboardLayout title="Access Denied" subtitle="Admin privileges required">
        <div className="text-center py-8 sm:py-16">
          <Shield className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm sm:text-base text-muted-foreground mb-6">You need admin privileges to access this page.</p>
          <Button asChild>
            <a href="/">Go Home</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Mobile-optimized product table columns
  const productColumns: TableColumn<ProductWithSeller>[] = [
    {
      key: 'title',
      label: 'Product',
      render: (product) => (
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
            {product.thumbnail_url ? (
              <img src={product.thumbnail_url} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm sm:text-base truncate">{product.title}</div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">
              by {product.profiles?.full_name || product.profiles?.email || 'Unknown'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (product) => (
        <Badge variant="outline" className="capitalize text-xs">
          <span className="hidden sm:inline">{product.category}</span>
          <span className="sm:hidden">{product.category?.slice(0, 3)}</span>
        </Badge>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (product) => (
        <span className="text-sm font-medium">
          ${product.price?.toFixed(2) || '0.00'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (product) => (
        <Badge className={`text-xs ${
          product.status === 'approved' ? 'bg-green-100 text-green-800' :
          product.status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {product.status === 'approved' && <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />}
          {product.status === 'rejected' && <XCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />}
          {product.status === 'pending' && <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />}
          <span className="hidden sm:inline">{product.status?.toUpperCase() || 'PENDING'}</span>
          <span className="sm:hidden">{product.status?.slice(0, 3).toUpperCase() || 'PEN'}</span>
        </Badge>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (product) => (
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedProduct(product)}
            className="h-8 w-8 sm:h-auto sm:w-auto p-1 sm:px-3"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Review</span>
          </Button>
          {product.status === 'pending' && (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 h-8 w-8 sm:h-auto sm:w-auto p-1 sm:px-3"
                onClick={() => handleProductAction(product.id, 'approve')}
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleProductAction(product.id, 'reject')}
                className="h-8 w-8 sm:h-auto sm:w-auto p-1 sm:px-3"
              >
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  if (selectedProduct) {
    return (
      <DashboardLayout
        title="Product Review"
        subtitle="Review and approve product submission"
        showBackButton
        onBack={() => setSelectedProduct(null)}
      >
        <ProductReviewDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          onReviewed={() => {
            setSelectedProduct(null);
            fetchData();
          }}
          onAction={handleProductAction}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Live Admin Dashboard"
      subtitle="Real-time marketplace management"
    >
      {/* Mobile-Responsive Header with Live Notifications */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Live Admin Dashboard</h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">Real-time platform monitoring and management</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <LiveNotificationCenter />
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="hidden md:inline">Live Updates Active</span>
            <span className="md:hidden">Live</span>
          </div>
          {/* Mobile Live Indicator */}
          <div className="sm:hidden flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
      </div>

      {/* Mobile-Responsive Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-6">
        {/* Mobile-Optimized Tab Navigation */}
        <div className="overflow-x-auto pb-2">
          <TabsList className="grid w-full grid-cols-5 sm:grid-cols-9 min-w-max sm:min-w-0 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4 py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Live Overview</span>
              <span className="sm:hidden text-xs">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="purchases" className="text-xs sm:text-sm px-2 sm:px-4 py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Purchases</span>
              <span className="sm:hidden text-xs">Sales</span>
            </TabsTrigger>
            <TabsTrigger value="sellers" className="text-xs sm:text-sm px-2 sm:px-4 py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Sellers</span>
              <span className="sm:hidden text-xs">Sellers</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="text-xs sm:text-sm px-2 sm:px-4 py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Verification</span>
              <span className="sm:hidden text-xs">Verify</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm px-2 sm:px-4 py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Products</span>
              <span className="sm:hidden text-xs">Products</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-4 py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden text-xs">Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 sm:px-4 py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden text-xs">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs sm:text-sm px-2 sm:px-4 py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Maintenance</span>
              <span className="sm:hidden text-xs">Maint</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 sm:px-4 py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden text-xs">Config</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4">
          {/* Live Stats */}
          <LiveAdminStats />
          
          {/* Mobile-Responsive Live Activity and Recent Data */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <div className="order-2 xl:order-1">
              <LiveActivityFeed />
            </div>
            
            <div className="order-1 xl:order-2">
              <DataTable
                title="Recent Product Submissions"
                data={products.slice(0, 10)}
                columns={[
                  {
                    key: 'title',
                    label: 'Product',
                    render: (product) => (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-muted rounded overflow-hidden flex-shrink-0">
                          {product.thumbnail_url ? (
                            <img src={product.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 m-1 sm:m-2 text-muted-foreground" />
                          )}
                        </div>
                        <div className="font-medium truncate text-xs sm:text-sm">
                          {product.title}
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (product) => (
                      <Badge variant="outline" className="capitalize text-xs">
                        {product.status || 'pending'}
                      </Badge>
                    )
                  },
                  {
                    key: 'price',
                    label: 'Price',
                    render: (product) => (
                      <span className="text-xs sm:text-sm font-medium">
                        ${product.price?.toFixed(2) || '0.00'}
                      </span>
                    )
                  },
                  {
                    key: 'actions',
                    label: '',
                    render: (product) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProduct(product)}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )
                  }
                ]}
                emptyMessage="No products submitted yet"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="mt-4">
          <AdminPurchasesAndPayouts />
        </TabsContent>

        <TabsContent value="sellers" className="mt-4">
          <SimpleSellerManagement />
        </TabsContent>

        <TabsContent value="verification" className="mt-4">
          <SellerVerificationReview onApplicationsChange={fetchData} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <DataTable
            title="Product Management"
            description="Review and manage all product submissions"
            data={products}
            columns={productColumns}
            loading={loading}
            searchKey="title"
            searchPlaceholder="Search products..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'pending', label: 'Pending Review' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' }
                ]
              },
              {
                key: 'category',
                label: 'Category',
                options: [
                  { value: 'bots', label: 'Bots' },
                  { value: 'software', label: 'Software' },
                  { value: 'templates', label: 'Templates' },
                  { value: 'assets', label: 'Assets' },
                  { value: 'apis', label: 'APIs' },
                  { value: 'plugins', label: 'Plugins' }
                ]
              }
            ]}
            emptyMessage="No products found"
          />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">User Management</h3>
                <p className="text-sm text-muted-foreground">
                  {useSimpleUserManagement ? 'Simple mode - basic user management' : 'Advanced mode - with verification data'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setUseSimpleUserManagement(!useSimpleUserManagement)}
              >
                {useSimpleUserManagement ? 'Switch to Advanced' : 'Switch to Simple'}
              </Button>
            </div>
            
            {useSimpleUserManagement ? (
              <SimpleUserManagement />
            ) : (
              <AdminUserManagement />
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AdminAnalyticsEnhanced products={products} />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <MaintenanceSettings />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <AdminSettings />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}