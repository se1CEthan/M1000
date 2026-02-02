import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Package, 
  ShoppingCart, 
  Users, 
  CheckCircle, 
  XCircle,
  Clock,
  RefreshCw,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/clients';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'product_submitted' | 'product_approved' | 'product_rejected' | 'order_created' | 'user_registered';
  title: string;
  description: string;
  timestamp: string;
  data?: any;
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
    
    // Set up real-time updates
    const interval = setInterval(fetchRecentActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      
      // Fetch recent products
      const { data: products } = await supabase
        .from('products')
        .select('id, title, status, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Combine and format activities
      const allActivities: ActivityItem[] = [];

      // Add product activities
      products?.forEach(product => {
        allActivities.push({
          id: `product-${product.id}`,
          type: 'product_submitted',
          title: 'New Product Submitted',
          description: `"${product.title}" submitted for review`,
          timestamp: product.created_at,
          data: product
        });

        if (product.status === 'approved' && product.updated_at !== product.created_at) {
          allActivities.push({
            id: `product-approved-${product.id}`,
            type: 'product_approved',
            title: 'Product Approved',
            description: `"${product.title}" has been approved`,
            timestamp: product.updated_at,
            data: product
          });
        }

        if (product.status === 'rejected' && product.updated_at !== product.created_at) {
          allActivities.push({
            id: `product-rejected-${product.id}`,
            type: 'product_rejected',
            title: 'Product Rejected',
            description: `"${product.title}" has been rejected`,
            timestamp: product.updated_at,
            data: product
          });
        }
      });

      // Add order activities
      orders?.forEach(order => {
        allActivities.push({
          id: `order-${order.id}`,
          type: 'order_created',
          title: 'New Order',
          description: `Order for $${order.total_amount} created`,
          timestamp: order.created_at,
          data: order
        });
      });

      // Add user activities
      profiles?.forEach(profile => {
        allActivities.push({
          id: `user-${profile.id}`,
          type: 'user_registered',
          title: 'New User Registration',
          description: `${profile.full_name || profile.email} joined as ${profile.role}`,
          timestamp: profile.created_at,
          data: profile
        });
      });

      // Sort by timestamp and take most recent 20
      const sortedActivities = allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'product_submitted': return <Package className="h-4 w-4 text-blue-600" />;
      case 'product_approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'product_rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'order_created': return <ShoppingCart className="h-4 w-4 text-purple-600" />;
      case 'user_registered': return <Users className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'product_submitted': return <Badge variant="outline" className="text-blue-600">Submitted</Badge>;
      case 'product_approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'product_rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'order_created': return <Badge className="bg-purple-100 text-purple-800">Order</Badge>;
      case 'user_registered': return <Badge className="bg-orange-100 text-orange-800">New User</Badge>;
      default: return <Badge variant="secondary">Activity</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity Feed
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecentActivity}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {activities.length === 0 && !loading ? (
          <div className="p-6 text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-1 p-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{activity.title}</h4>
                      {getActivityBadge(activity.type)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { 
                          addSuffix: true 
                        })}
                      </span>
                      
                      {activity.data && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex items-center justify-center p-6">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}