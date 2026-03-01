import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  DollarSign, 
  User, 
  Package, 
  Calendar,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/clients';
import { useToast } from '@/hooks/use-toast';
import { DataTable, TableColumn } from '@/components/shared/DataTable';

interface Purchase {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  price: number;
  currency: string;
  payment_method: string;
  seller_earnings: number;
  platform_fee: number;
  product: {
    id: string;
    title: string;
    thumbnail_url?: string;
  };
  seller: {
    id: string;
    full_name: string;
    email: string;
    mobile_money_number?: string;
  };
  buyer: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface SellerPayout {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: string;
  payout_method: string;
  mobile_number?: string;
  processed_at?: string;
  seller: {
    id: string;
    full_name: string;
    email: string;
    mobile_money_number?: string;
  };
  order: {
    id: string;
    order_number: string;
    product: {
      title: string;
    };
  };
}

export function AdminPurchasesAndPayouts() {
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payouts, setPayouts] = useState<SellerPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch purchases with seller and buyer info
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          status,
          price,
          currency,
          payment_method,
          seller_earnings,
          platform_fee,
          product:products(id, title, thumbnail_url),
          seller:profiles!seller_id(id, full_name, email, mobile_money_number),
          buyer:profiles!buyer_id(id, full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (purchasesError) throw purchasesError;

      // Fetch seller payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('seller_payouts')
        .select(`
          id,
          created_at,
          amount,
          currency,
          status,
          payout_method,
          mobile_number,
          processed_at,
          seller:profiles!seller_id(id, full_name, email, mobile_money_number),
          order:orders(
            id,
            order_number,
            product:products(title)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (payoutsError) throw payoutsError;

      setPurchases(purchasesData || []);
      setPayouts(payoutsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchases and payouts data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutAction = async (payoutId: string, action: 'approve' | 'complete' | 'reject') => {
    try {
      const updateData: any = {
        status: action === 'approve' ? 'approved' : action === 'complete' ? 'completed' : 'failed'
      };

      if (action === 'complete') {
        updateData.processed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('seller_payouts')
        .update(updateData)
        .eq('id', payoutId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Payout ${action}d successfully`,
      });

      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} payout`,
        variant: 'destructive',
      });
    }
  };

  const exportData = (type: 'purchases' | 'payouts') => {
    const data = type === 'purchases' ? purchases : payouts;
    const csvContent = type === 'purchases' 
      ? generatePurchasesCSV(data as Purchase[])
      : generatePayoutsCSV(data as SellerPayout[]);
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generatePurchasesCSV = (data: Purchase[]) => {
    const headers = [
      'Order Number',
      'Date',
      'Product',
      'Seller Name',
      'Seller Email',
      'Seller Mobile',
      'Buyer Name',
      'Buyer Email',
      'Amount (UGX)',
      'Seller Earnings (UGX)',
      'Platform Fee (UGX)',
      'Status',
      'Payment Method'
    ];

    const rows = data.map(purchase => [
      purchase.order_number,
      new Date(purchase.created_at).toLocaleDateString(),
      purchase.product?.title || 'N/A',
      purchase.seller?.full_name || 'N/A',
      purchase.seller?.email || 'N/A',
      purchase.seller?.mobile_money_number || 'N/A',
      purchase.buyer?.full_name || 'N/A',
      purchase.buyer?.email || 'N/A',
      purchase.price || 0,
      purchase.seller_earnings || 0,
      purchase.platform_fee || 0,
      purchase.status,
      purchase.payment_method || 'N/A'
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const generatePayoutsCSV = (data: SellerPayout[]) => {
    const headers = [
      'Payout ID',
      'Date',
      'Seller Name',
      'Seller Email',
      'Mobile Number',
      'Amount (UGX)',
      'Status',
      'Product',
      'Order Number',
      'Processed Date'
    ];

    const rows = data.map(payout => [
      payout.id,
      new Date(payout.created_at).toLocaleDateString(),
      payout.seller?.full_name || 'N/A',
      payout.seller?.email || 'N/A',
      payout.mobile_number || payout.seller?.mobile_money_number || 'N/A',
      payout.amount || 0,
      payout.status,
      payout.order?.product?.title || 'N/A',
      payout.order?.order_number || 'N/A',
      payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : 'N/A'
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const purchaseColumns: TableColumn<Purchase>[] = [
    {
      key: 'order_number',
      label: 'Order',
      render: (purchase) => (
        <div className="space-y-1">
          <div className="font-mono text-sm">{purchase.order_number}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(purchase.created_at).toLocaleDateString()}
          </div>
        </div>
      )
    },
    {
      key: 'product',
      label: 'Product',
      render: (purchase) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded overflow-hidden">
            {purchase.product?.thumbnail_url ? (
              <img src={purchase.product.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package className="h-4 w-4 m-2 text-muted-foreground" />
            )}
          </div>
          <div className="font-medium text-sm truncate max-w-32">
            {purchase.product?.title || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'seller',
      label: 'Seller',
      render: (purchase) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{purchase.seller?.full_name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">{purchase.seller?.email}</div>
          {purchase.seller?.mobile_money_number && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {purchase.seller.mobile_money_number}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'buyer',
      label: 'Buyer',
      render: (purchase) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{purchase.buyer?.full_name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">{purchase.buyer?.email}</div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (purchase) => (
        <div className="space-y-1">
          <div className="font-bold">UGX {purchase.price?.toLocaleString() || '0'}</div>
          <div className="text-xs text-green-600">
            Seller: UGX {purchase.seller_earnings?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-blue-600">
            Platform: UGX {purchase.platform_fee?.toLocaleString() || '0'}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (purchase) => getStatusBadge(purchase.status)
    }
  ];

  const payoutColumns: TableColumn<SellerPayout>[] = [
    {
      key: 'created_at',
      label: 'Date',
      render: (payout) => (
        <div className="space-y-1">
          <div className="text-sm">{new Date(payout.created_at).toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(payout.created_at).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    {
      key: 'seller',
      label: 'Seller',
      render: (payout) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{payout.seller?.full_name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">{payout.seller?.email}</div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Phone className="h-3 w-3" />
            {payout.mobile_number || payout.seller?.mobile_money_number || 'No mobile number'}
          </div>
        </div>
      )
    },
    {
      key: 'order',
      label: 'Order',
      render: (payout) => (
        <div className="space-y-1">
          <div className="font-mono text-sm">{payout.order?.order_number || 'N/A'}</div>
          <div className="text-xs text-muted-foreground truncate max-w-32">
            {payout.order?.product?.title || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (payout) => (
        <div className="font-bold text-green-600">
          UGX {payout.amount?.toLocaleString() || '0'}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (payout) => getStatusBadge(payout.status)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (payout) => (
        <div className="flex gap-1">
          {payout.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePayoutAction(payout.id, 'approve')}
                className="h-8 px-2 text-xs"
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handlePayoutAction(payout.id, 'reject')}
                className="h-8 px-2 text-xs"
              >
                Reject
              </Button>
            </>
          )}
          {payout.status === 'approved' && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 h-8 px-2 text-xs"
              onClick={() => handlePayoutAction(payout.id, 'complete')}
            >
              Mark Paid
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
            <p className="text-xs text-muted-foreground">
              {purchases.filter(p => p.status === 'paid').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              UGX {purchases.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform: UGX {purchases.reduce((sum, p) => sum + (p.platform_fee || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payouts.filter(p => p.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              UGX {payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(purchases.map(p => p.seller?.id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              With mobile money setup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="purchases" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="payouts">Seller Payouts</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData('purchases')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Purchases
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData('payouts')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Payouts
            </Button>
          </div>
        </div>

        <TabsContent value="purchases">
          <DataTable
            title="Product Purchases"
            description="All product purchases with seller and buyer information"
            data={purchases}
            columns={purchaseColumns}
            loading={loading}
            searchKey="order_number"
            searchPlaceholder="Search by order number..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'pending', label: 'Pending' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]
              },
              {
                key: 'payment_method',
                label: 'Payment Method',
                options: [
                  { value: 'pesapal', label: 'PesaPal' },
                  { value: 'cryptomus', label: 'Crypto' },
                  { value: 'manual', label: 'Manual' }
                ]
              }
            ]}
            emptyMessage="No purchases found"
          />
        </TabsContent>

        <TabsContent value="payouts">
          <DataTable
            title="Seller Payouts"
            description="Manage seller payouts to mobile money accounts"
            data={payouts}
            columns={payoutColumns}
            loading={loading}
            searchKey="seller.full_name"
            searchPlaceholder="Search by seller name..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'failed', label: 'Failed' }
                ]
              }
            ]}
            emptyMessage="No payouts found"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}