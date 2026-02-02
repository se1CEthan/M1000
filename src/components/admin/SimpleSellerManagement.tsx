import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/clients';
import { DataTable, TableColumn } from '@/components/shared/DataTable';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_verified_seller: boolean | null;
  verification_status: string | null;
  created_at: string;
  updated_at: string;
}

export function SimpleSellerManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    
    // Set up real-time updates
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!profile) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole as 'buyer' | 'seller' | 'admin',
          is_verified_seller: newRole === 'seller',
          verification_status: newRole === 'seller' ? 'approved' : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User role updated to ${newRole} successfully`,
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'seller': return 'bg-green-100 text-green-800';
      case 'buyer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3 mr-1" />;
      case 'seller': return <UserCheck className="h-3 w-3 mr-1" />;
      case 'buyer': return <Users className="h-3 w-3 mr-1" />;
      default: return <Users className="h-3 w-3 mr-1" />;
    }
  };

  const userColumns: TableColumn<UserProfile>[] = [
    {
      key: 'user',
      label: 'User',
      render: (user) => (
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm sm:text-base truncate">{user.full_name || 'No name'}</div>
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
              <Mail className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        <Badge className={`${getRoleColor(user.role)} text-xs`}>
          {getRoleIcon(user.role)}
          <span className="hidden sm:inline">{user.role?.toUpperCase() || 'USER'}</span>
          <span className="sm:hidden">{user.role?.slice(0, 3).toUpperCase() || 'USR'}</span>
        </Badge>
      )
    },
    {
      key: 'verification',
      label: 'Seller Status',
      render: (user) => {
        if (user.role !== 'seller') {
          return <span className="text-muted-foreground text-xs sm:text-sm">N/A</span>;
        }
        
        return (
          <Badge className={`text-xs ${user.is_verified_seller ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {user.is_verified_seller ? (
              <>
                <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                <span className="hidden sm:inline">Verified</span>
                <span className="sm:hidden">✓</span>
              </>
            ) : (
              <>
                <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                <span className="hidden sm:inline">Pending</span>
                <span className="sm:hidden">⏳</span>
              </>
            )}
          </Badge>
        );
      }
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (user) => (
        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
          <Calendar className="h-2 w-2 sm:h-3 sm:w-3 flex-shrink-0" />
          <span className="hidden sm:inline">{new Date(user.created_at).toLocaleDateString()}</span>
          <span className="sm:hidden">{new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <div className="flex gap-1 sm:gap-2">
          {user.role !== 'seller' && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 h-7 sm:h-auto text-xs sm:text-sm px-2 sm:px-3"
              onClick={() => handleRoleChange(user.user_id, 'seller')}
              disabled={actionLoading}
            >
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Make Seller</span>
            </Button>
          )}
          
          {user.role === 'seller' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRoleChange(user.user_id, 'buyer')}
              disabled={actionLoading}
              className="h-7 sm:h-auto text-xs sm:text-sm px-2 sm:px-3"
            >
              <UserX className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Remove Seller</span>
            </Button>
          )}
          
          {user.role !== 'admin' && profile?.role === 'admin' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleRoleChange(user.user_id, 'admin')}
              disabled={actionLoading}
              className="h-7 sm:h-auto text-xs sm:text-sm px-2 sm:px-3"
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Make Admin</span>
            </Button>
          )}
        </div>
      )
    }
  ];

  // Calculate stats
  const totalUsers = users.length;
  const sellers = users.filter(u => u.role === 'seller').length;
  const verifiedSellers = users.filter(u => u.role === 'seller' && u.is_verified_seller).length;
  const buyers = users.filter(u => u.role === 'buyer').length;
  const admins = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold">User & Seller Management</h2>
          <p className="text-sm text-muted-foreground">Manage user roles and seller verification</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" disabled={loading} className="w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Mobile-Responsive Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600">{sellers}</div>
            <div className="text-xs text-muted-foreground">{verifiedSellers} verified</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Buyers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{buyers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">{admins}</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Verification Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {sellers > 0 ? Math.round((verifiedSellers / sellers) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {users.length === 0 && !loading && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            No users found. This could mean the profiles table is empty or there are permission issues.
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        title="All Users"
        data={users}
        columns={userColumns}
        loading={loading}
        searchKey="email"
        searchPlaceholder="Search users by email..."
        filters={[
          {
            key: 'role',
            label: 'Role',
            options: [
              { value: 'buyer', label: 'Buyer' },
              { value: 'seller', label: 'Seller' },
              { value: 'admin', label: 'Admin' }
            ]
          }
        ]}
        emptyMessage="No users found"
      />
    </div>
  );
}