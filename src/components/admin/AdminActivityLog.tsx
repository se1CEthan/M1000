import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Search, Filter, Calendar, User, Package, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/clients';

interface ActivityLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_id: string;
  target_type: string;
  details: Record<string, any>;
  created_at: string;
  admin_profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function AdminActivityLog() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7d');

  useEffect(() => {
    fetchActivities();
  }, [dateFilter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = dateFilter === '1d' ? 1 : dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      const { data, error } = await supabase
        .from('admin_activity_log')
        .select(`
          *,
          admin_profile:profiles!admin_activity_log_admin_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activity log',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.admin_profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.admin_profile.full_name && activity.admin_profile.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      activity.action_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || activity.action_type === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'seller_approved':
      case 'seller_rejected':
        return <User className="h-4 w-4" />;
      case 'product_approved':
      case 'product_rejected':
        return <Package className="h-4 w-4" />;
      case 'user_suspended':
      case 'user_unsuspended':
        return <Shield className="h-4 w-4" />;
      case 'settings_updated':
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes('approved')) {
      return 'bg-green-100 text-green-800';
    }
    if (actionType.includes('rejected') || actionType.includes('suspended')) {
      return 'bg-red-100 text-red-800';
    }
    if (actionType.includes('updated') || actionType.includes('unsuspended')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDetails = (details: Record<string, any>) => {
    if (!details || Object.keys(details).length === 0) return null;
    
    const relevantDetails = [];
    if (details.product_title) relevantDetails.push(`Product: ${details.product_title}`);
    if (details.notes) relevantDetails.push(`Notes: ${details.notes}`);
    if (details.reason) relevantDetails.push(`Reason: ${details.reason}`);
    if (details.new_role) relevantDetails.push(`New Role: ${details.new_role}`);
    
    return relevantDetails.length > 0 ? relevantDetails.join(' • ') : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Loading activity log...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Activity Log</h2>
        <p className="text-muted-foreground">
          Track all administrative actions and changes
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="seller_approved">Seller Approved</SelectItem>
                <SelectItem value="seller_rejected">Seller Rejected</SelectItem>
                <SelectItem value="product_approved">Product Approved</SelectItem>
                <SelectItem value="product_rejected">Product Rejected</SelectItem>
                <SelectItem value="user_suspended">User Suspended</SelectItem>
                <SelectItem value="settings_updated">Settings Updated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription>
            {filteredActivities.length} activities found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities found matching your criteria.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      {activity.admin_profile.avatar_url ? (
                        <img 
                          src={activity.admin_profile.avatar_url} 
                          alt={activity.admin_profile.full_name || 'Admin'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold">
                          {(activity.admin_profile.full_name || activity.admin_profile.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {activity.admin_profile.full_name || activity.admin_profile.email}
                        </span>
                        <Badge className={getActionColor(activity.action_type)}>
                          {getActionIcon(activity.action_type)}
                          <span className="ml-1">{formatActionType(activity.action_type)}</span>
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1">
                        Target: {activity.target_type} ({activity.target_id.slice(0, 8)}...)
                      </p>
                      
                      {formatDetails(activity.details) && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {formatDetails(activity.details)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}