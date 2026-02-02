import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/clients';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'seller_approved' | 'seller_rejected' | 'product_approved' | 'product_rejected' | 'order_received' | 'payout_processed' | 'general';
  action_url?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export function useNotifications() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId
      });

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.action_url) {
      navigate(notification.action_url);
    }

    // Show toast for important notifications
    if (notification.type === 'seller_approved') {
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    }
  };

  // Listen for real-time notifications
  useEffect(() => {
    if (!user || !profile) return;

    fetchNotifications();

    // Set up real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.user_id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for new notifications
          toast({
            title: newNotification.title,
            description: newNotification.message,
            duration: 5000,
            action: newNotification.action_url ? (
              <button
                onClick={() => handleNotificationClick(newNotification)}
                className="text-sm underline"
              >
                View
              </button>
            ) : undefined,
          });

          // Auto-redirect for seller approval
          if (newNotification.type === 'seller_approved' && newNotification.action_url) {
            setTimeout(() => {
              navigate(newNotification.action_url!);
            }, 2000); // Redirect after 2 seconds
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, profile]);

  // Check for existing seller approval notifications on mount
  useEffect(() => {
    if (!profile || profile.role !== 'seller') return;

    // Check if user just became a seller and has unread approval notification
    const approvalNotification = notifications.find(
      n => n.type === 'seller_approved' && !n.is_read
    );

    if (approvalNotification) {
      // Auto-redirect to seller dashboard
      setTimeout(() => {
        handleNotificationClick(approvalNotification);
      }, 1000);
    }
  }, [notifications, profile]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    handleNotificationClick,
  };
}