import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, Users, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/clients';
import { useToast } from '@/hooks/use-toast';

interface AdminNotification {
  id: string;
  type: 'seller_application' | 'product_submission' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

interface AdminNotificationsProps {
  onNotificationClick?: (notification: AdminNotification) => void;
}

export function AdminNotifications({ onNotificationClick }: AdminNotificationsProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time updates for new applications and products
    const interval = setInterval(() => {
      checkForNewItems();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Create mock notifications based on recent activity
      const mockNotifications: AdminNotification[] = [];
      
      // Check for pending seller applications
      try {
        const { data: applications } = await supabase
          .from('seller_verification_applications')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);

        if (applications) {
          applications.forEach(app => {
            mockNotifications.push({
              id: `app-${app.id}`,
              type: 'seller_application',
              title: 'New Seller Application',
              message: `${app.full_name} submitted a seller verification application`,
              data: app,
              read: false,
              created_at: app.created_at
            });
          });
        }
      } catch (error) {
        console.log('Seller applications table not available');
      }

      // Check for pending products
      const { data: products } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_seller_id_fkey(full_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (products) {
        products.forEach(product => {
          mockNotifications.push({
            id: `product-${product.id}`,
            type: 'product_submission',
            title: 'New Product Submission',
            message: `${product.profiles?.full_name || 'A seller'} submitted "${product.title}" for review`,
            data: product,
            read: false,
            created_at: product.created_at
          });
        });
      }

      // Sort by creation date
      mockNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewItems = async () => {
    try {
      // Check for new applications in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      try {
        const { data: newApplications } = await supabase
          .from('seller_verification_applications')
          .select('*')
          .eq('status', 'pending')
          .gte('created_at', fiveMinutesAgo);

        if (newApplications && newApplications.length > 0) {
          toast({
            title: 'New Seller Applications',
            description: `${newApplications.length} new seller application(s) received`,
          });
        }
      } catch (error) {
        // Table doesn't exist, skip
      }

      // Check for new products
      const { data: newProducts } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'pending')
        .gte('created_at', fiveMinutesAgo);

      if (newProducts && newProducts.length > 0) {
        toast({
          title: 'New Product Submissions',
          description: `${newProducts.length} new product(s) submitted for review`,
        });
      }

      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error checking for new items:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'seller_application': return <Users className="h-4 w-4 text-blue-500" />;
      case 'product_submission': return <Package className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    markAsRead(notification.id);
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Admin Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-background'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}