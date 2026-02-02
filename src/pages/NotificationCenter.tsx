import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  Bell, BellRing, Check, CheckCheck, Trash2, 
  MessageSquare, DollarSign, User, Award, AlertCircle,
  Clock, Settings, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationService } from '@/lib/freelancing-service';
import type { Notification } from '@/types/freelancing';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const NOTIFICATION_TYPES = {
  message: { icon: MessageSquare, color: 'text-blue-500', label: 'Message' },
  payment: { icon: DollarSign, color: 'text-green-500', label: 'Payment' },
  proposal: { icon: User, color: 'text-purple-500', label: 'Proposal' },
  contract: { icon: Award, color: 'text-orange-500', label: 'Contract' },
  review: { icon: Award, color: 'text-yellow-500', label: 'Review' },
  system: { icon: AlertCircle, color: 'text-gray-500', label: 'System' },
  reminder: { icon: Clock, color: 'text-red-500', label: 'Reminder' }
};

export default function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getByUserId(user!.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead(user!.id);
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      toast({
        title: 'Success',
        description: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive'
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // This would typically call a delete API
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({
        title: 'Success',
        description: 'Notification deleted'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive'
      });
    }
  };

  const deleteSelected = async () => {
    try {
      setNotifications(prev => 
        prev.filter(n => !selectedNotifications.has(n.id))
      );
      setSelectedNotifications(new Set());
      toast({
        title: 'Success',
        description: `${selectedNotifications.size} notifications deleted`
      });
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notifications',
        variant: 'destructive'
      });
    }
  };

  const toggleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const selectAllNotifications = () => {
    const filteredNotifications = getFilteredNotifications();
    setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
  };

  const clearSelection = () => {
    setSelectedNotifications(new Set());
  };

  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      const typeMatch = filterType === 'all' || notification.type === filterType;
      const statusMatch = filterStatus === 'all' || 
        (filterStatus === 'unread' && !notification.is_read) ||
        (filterStatus === 'read' && notification.is_read);
      
      return typeMatch && statusMatch;
    });
  };

  const getNotificationIcon = (type: string) => {
    const notificationType = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES];
    if (!notificationType) return NOTIFICATION_TYPES.system;
    return notificationType;
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={item} className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Bell className="h-8 w-8" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground mt-2">
                Stay updated with your freelancing activities
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} size="sm">
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </motion.div>

          {/* Filters and Actions */}
          <motion.div variants={item}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(NOTIFICATION_TYPES).map(([key, type]) => (
                          <SelectItem key={key} value={key}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedNotifications.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedNotifications.size} selected
                      </span>
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Clear
                      </Button>
                      <Button variant="destructive" size="sm" onClick={deleteSelected}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                {filteredNotifications.length > 0 && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Checkbox
                      checked={selectedNotifications.size === filteredNotifications.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllNotifications();
                        } else {
                          clearSelection();
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      Select all visible notifications
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications List */}
          <motion.div variants={item}>
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value="messages">
                  Messages ({notifications.filter(n => n.type === 'message').length})
                </TabsTrigger>
                <TabsTrigger value="payments">
                  Payments ({notifications.filter(n => n.type === 'payment').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                      <p className="text-muted-foreground">
                        {filterType !== 'all' || filterStatus !== 'all' 
                          ? 'No notifications match your current filters'
                          : 'You\'re all caught up! New notifications will appear here.'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => {
                      const notificationType = getNotificationIcon(notification.type);
                      const Icon = notificationType.icon;
                      
                      return (
                        <motion.div key={notification.id} variants={item}>
                          <Card className={`transition-all duration-200 ${
                            !notification.is_read 
                              ? 'border-l-4 border-l-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <Checkbox
                                  checked={selectedNotifications.has(notification.id)}
                                  onCheckedChange={() => toggleSelectNotification(notification.id)}
                                />
                                
                                <div className={`p-2 rounded-full ${
                                  !notification.is_read ? 'bg-primary/10' : 'bg-muted'
                                }`}>
                                  <Icon className={`h-4 w-4 ${notificationType.color}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className={`font-medium ${
                                        !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                                      }`}>
                                        {notification.title}
                                      </h4>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {notification.message}
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 ml-4">
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatTimeAgo(notification.created_at)}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-1"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {notificationType.label}
                                      </Badge>
                                      {!notification.is_read && (
                                        <Badge variant="destructive" className="text-xs">
                                          New
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {!notification.is_read && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => markAsRead(notification.id)}
                                          className="text-xs"
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          Mark Read
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteNotification(notification.id)}
                                        className="text-xs text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Additional data display */}
                                  {notification.data && Object.keys(notification.data).length > 0 && (
                                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                      <div className="text-xs text-muted-foreground">
                                        {notification.data.project_title && (
                                          <p>Project: {notification.data.project_title}</p>
                                        )}
                                        {notification.data.amount && (
                                          <p>Amount: ${notification.data.amount}</p>
                                        )}
                                        {notification.data.client_name && (
                                          <p>Client: {notification.data.client_name}</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Other tab contents would be similar but filtered */}
              <TabsContent value="unread">
                <div className="text-center py-12 text-muted-foreground">
                  <BellRing className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Unread notifications will appear here</p>
                </div>
              </TabsContent>

              <TabsContent value="messages">
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Message notifications will appear here</p>
                </div>
              </TabsContent>

              <TabsContent value="payments">
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Payment notifications will appear here</p>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Notification Preferences */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Customize how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Email Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">New messages</span>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Payment updates</span>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Proposal responses</span>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Contract updates</span>
                        <Checkbox defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Push Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Urgent messages</span>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Payment received</span>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Deadline reminders</span>
                        <Checkbox defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Weekly summary</span>
                        <Checkbox />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t">
                  <Button>
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}