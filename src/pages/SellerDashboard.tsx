import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Package, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  ShoppingCart,
  Wallet,
  Bell,
  Settings,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { Product } from '@/types/database';
import { supabase } from '@/integrations/supabase/clients';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { DataTable, TableColumn } from '@/components/shared/DataTable';
import { ProductUploadForm } from '@/components/seller/ProductUploadForm';
import { MobileMoneyPayoutSetup } from '@/components/seller/MobileMoneyPayoutSetup';
import { LiveEarningsDashboard } from '@/components/seller/LiveEarningsDashboard';
import { StorageManagement } from '@/components/seller/StorageManagement';
import { PayoutNotifications } from '@/components/notifications/PayoutNotifications';
import { LiveSellerStats } from '@/components/seller/LiveSellerStats';
import { SellerAnalytics } from '@/components/seller/SellerAnalytics';
import { useSellerStats } from '@/hooks/useSellerStats';

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { stats } = useSellerStats();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (profile?.role === 'seller' || profile?.role === 'admin') {
      fetchSellerData();
      // Set up real-time updates
      const interval = setInterval(fetchSellerData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [profile]);

  const fetchSellerData = async () => {
    if (!profile) return;

    try {
      // Fetch products and orders separately to avoid relationship issues
      const [productsResult, ordersResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('seller_id', profile.user_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('*')
          .eq('seller_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (productsResult.error) throw productsResult.error;
      if (ordersResult.error) throw ordersResult.error;

      const products = productsResult.data || [];
      const orders = ordersResult.data || [];

      // Enrich orders with product and buyer information
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          let productInfo = null;
          let buyerInfo = null;

          // Fetch product info if product_id exists
          if (order.product_id) {
            try {
              const productResult = await supabase
                .from('products')
                .select('title, thumbnail_url, price')
                .eq('id', order.product_id)
                .single();
              
              if (!productResult.error) {
                productInfo = productResult.data;
              }
            } catch (error) {
              console.log('Could not fetch product info for order:', order.id);
            }
          }

          // Fetch buyer info if buyer_id exists
          if (order.buyer_id) {
            try {
              const buyerResult = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('user_id', order.buyer_id)
                .single();
              
              if (!buyerResult.error) {
                buyerInfo = buyerResult.data;
              }
            } catch (error) {
              console.log('Could not fetch buyer info for order:', order.id);
            }
          }

          return {
            ...order,
            product: productInfo || { title: 'Unknown Product', thumbnail_url: null, price: order.price },
            buyer: buyerInfo || { full_name: 'Anonymous', email: 'N/A' }
          };
        })
      );

      setProducts(products as Product[]);
      setOrders(enrichedOrders);

    } catch (error) {
      console.error('Error fetching seller data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductUploaded = () => {
    setShowUploadForm(false);
    fetchSellerData();
    toast({
      title: 'Success!',
      description: 'Your product has been uploaded and is pending review.',
    });
  };

  // Redirect if not a seller
  if (!user || !profile) {
    return (
      <DashboardLayout title="Please sign in">
        <div className="text-center py-16">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <Button asChild>
            <a href="/auth">Sign In</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (profile.role === 'buyer') {
    return (
      <DashboardLayout title="Seller Access Required">
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-6">
            You need to be a seller to access this dashboard.
          </p>
          <Button asChild>
            <a href="/upgrade-to-seller">Become a Seller</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Product columns for production
  const productColumns: TableColumn<Product>[] = [
    {
      key: 'title',
      label: 'Product',
      render: (product) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
            {product.thumbnail_url ? (
              <img src={product.thumbnail_url} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground m-3" />
            )}
          </div>
          <div>
            <div className="font-medium">{product.title}</div>
            <div className="text-sm text-muted-foreground">
              ${product.price} (UGX {Math.round((product.price || 0) * 3700).toLocaleString()})
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (product) => (
        <Badge className={
          product.status === 'approved' ? 'bg-green-100 text-green-800' :
          product.status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }>
          {product.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
          {product.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
          {product.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
          {product.status?.toUpperCase() || 'PENDING'}
        </Badge>
      )
    },
    {
      key: 'analytics',
      label: 'Performance',
      render: (product) => (
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-3 w-3" />
            <span>{product.view_count || 0} views</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="h-3 w-3" />
            <span>{product.download_count || 0} sales</span>
          </div>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (product) => new Date(product.created_at).toLocaleDateString()
    }
  ];

  // Order columns for production
  const orderColumns: TableColumn<any>[] = [
    {
      key: 'order_number',
      label: 'Order',
      render: (order) => (
        <div>
          <div className="font-medium">{order.order_number}</div>
          <div className="text-sm text-muted-foreground">
            {order.product?.title || 'Unknown Product'}
          </div>
        </div>
      )
    },
    {
      key: 'buyer',
      label: 'Buyer',
      render: (order) => (
        <div className="text-sm">
          <div>{order.buyer?.full_name || 'Anonymous'}</div>
          <div className="text-muted-foreground">{order.buyer?.email}</div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (order) => (
        <div>
          <div className="font-medium">${order.price?.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">
            UGX {Math.round((order.price || 0) * 3700).toLocaleString()}
          </div>
          <div className="text-xs text-green-600">
            You earn: UGX {Math.round((order.seller_earnings || order.price * 0.9 || 0) * 3700).toLocaleString()}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => (
        <Badge className={
          order.status === 'paid' ? 'bg-green-100 text-green-800' :
          order.status === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }>
          {order.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
          {order.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
          {order.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
          {order.status?.toUpperCase() || 'PENDING'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (order) => new Date(order.created_at).toLocaleDateString()
    }
  ];

  return (
    <DashboardLayout
      title="Live Seller Dashboard"
      subtitle="Real-time product monitoring and analytics"
      showNotifications
    >
      {/* Live Stats Overview */}
      <LiveSellerStats onTabChange={setActiveTab} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 mt-8">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="payout" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Mobile Payout
            {!stats.hasWallet && <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>}
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Live Earnings Dashboard */}
          <LiveEarningsDashboard />
          
          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataTable
              title="Recent Orders"
              data={orders.slice(0, 5)}
              columns={orderColumns.slice(0, 3)}
              emptyMessage="No orders yet"
            />
            <DataTable
              title="Recent Products"
              data={products.slice(0, 5)}
              columns={productColumns.slice(0, 3)}
              emptyMessage="No products uploaded yet"
            />
          </div>
        </TabsContent>

        <TabsContent value="payout">
          <MobileMoneyPayoutSetup />
        </TabsContent>

        <TabsContent value="products">
          {showUploadForm ? (
            <ProductUploadForm
              onSuccess={handleProductUploaded}
              onCancel={() => setShowUploadForm(false)}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Your Products</h2>
                  <p className="text-muted-foreground">
                    Manage and track your product listings
                  </p>
                </div>
                <Button onClick={() => setShowUploadForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Product
                </Button>
              </div>
              
              <DataTable
                title="All Products"
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
                  }
                ]}
                emptyMessage="No products uploaded yet. Upload your first product to get started!"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders">
          <DataTable
            title="Order History"
            description="Track all your sales and customer orders"
            data={orders}
            columns={orderColumns}
            loading={loading}
            searchKey="order_number"
            searchPlaceholder="Search orders..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'pending', label: 'Pending' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'failed', label: 'Failed' }
                ]
              }
            ]}
            emptyMessage="No orders yet. Start selling to see your orders here!"
          />
        </TabsContent>

        <TabsContent value="analytics">
          <SellerAnalytics />
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <StorageManagement />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PayoutNotifications />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}