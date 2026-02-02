import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Users, Search, Filter, Shield, Ban, CheckCircle, AlertTriangle, Mail, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/clients';

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_verified_seller: boolean;
  verification_status: string | null;
  total_earnings: number;
  total_sales: number;
  created_at: string;
  updated_at: string;
  verification_application?: Array<{
    id: string;
    status: string;
    created_at: string;
    business_type?: string;
    expected_monthly_sales?: number;
  }>;
}

export function AdminUserManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Simplified approach: fetch profiles and verification applications separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Fetch verification applications separately
      const { data: verificationsData, error: verificationsError } = await supabase
        .from('seller_verification_applications')
        .select(`
          id,
          user_id,
          full_name,
          status,
          business_type,
          expected_monthly_sales,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (verificationsError) {
        console.error('Error fetching verifications:', verificationsError);
        // Don't throw here, just log and continue with profiles only
      }

      // Create a map of verification applications by user_id
      const verificationMap = new Map();
      (verificationsData || []).forEach(app => {
        if (app.user_id) {
          if (!verificationMap.has(app.user_id)) {
            verificationMap.set(app.user_id, []);
          }
          verificationMap.get(app.user_id).push(app);
        }
      });

      // Enhance profiles with verification data
      const enhancedProfiles = (profilesData || []).map(profile => ({
        ...profile,
        verification_application: verificationMap.get(profile.user_id) || []
      }));

      // Find orphaned verification applications (applications without profiles)
      const existingUserIds = new Set((profilesData || []).map(p => p.user_id));
      const orphanedApps = (verificationsData || []).filter(app => 
        app.user_id && !existingUserIds.has(app.user_id)
      );

      // Convert orphaned applications to user-like objects
      const orphanedUsers = orphanedApps.map(app => ({
        id: `orphan_${app.id}`,
        user_id: app.user_id || `temp_${app.id}`,
        email: `${(app.full_name || 'user').toLowerCase().replace(/\s+/g, '.')}@pending.verification`,
        full_name: app.full_name || 'Verification Applicant',
        avatar_url: null,
        role: 'pending_verification',
        is_verified_seller: false,
        verification_status: app.status || 'pending',
        total_earnings: 0,
        total_sales: 0,
        created_at: app.created_at,
        updated_at: app.created_at,
        verification_application: [app]
      }));

      setUsers([...enhancedProfiles, ...orphanedUsers]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please check your database connection.',
        variant: 'destructive',
      });
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: profile?.id,
        p_action_type: 'user_role_changed',
        p_target_id: userId,
        p_target_type: 'user',
        p_details: { new_role: newRole },
      });

      toast({
        title: 'Role Updated',
        description: `User role changed to ${newRole}`,
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, reason: string) => {
    setActionLoading(true);
    try {
      // In a real implementation, you'd have a suspended status or field
      // For now, we'll use admin notes or a custom field
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'suspended',
          verification_notes: reason 
        })
        .eq('id', userId);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: profile?.id,
        p_action_type: 'user_suspended',
        p_target_id: userId,
        p_target_type: 'user',
        p_details: { reason },
      });

      toast({
        title: 'User Suspended',
        description: 'User has been suspended successfully',
      });

      setSelectedUser(null);
      setSuspensionReason('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error suspending user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend user',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'verified' && user.is_verified_seller) ||
      (statusFilter === 'unverified' && !user.is_verified_seller) ||
      (statusFilter === 'suspended' && user.verification_status === 'suspended');
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'seller':
        return 'bg-blue-100 text-blue-800';
      case 'buyer':
        return 'bg-green-100 text-green-800';
      case 'pending_verification':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (user: User) => {
    if (user.verification_status === 'suspended') {
      return <Ban className="h-4 w-4 text-red-500" />;
    }
    if (user.is_verified_seller) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">User Management</h2>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                No users found matching your criteria.
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.full_name || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold">
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {user.full_name || 'No name provided'}
                        </h3>
                        {getStatusIcon(user)}
                        {user.role === 'pending_verification' && (
                          <Badge variant="outline" className="text-xs">
                            Verification Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      {user.verification_application && user.verification_application.length > 0 && (
                        <p className="text-xs text-blue-600">
                          Has verification application ({user.verification_application[0].status})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.toUpperCase()}
                      </Badge>
                      {user.role === 'seller' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ${user.total_earnings} earned • {user.total_sales} sales
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                        disabled={actionLoading}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buyer">Buyer</SelectItem>
                          <SelectItem value="seller">Seller</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            disabled={user.verification_status === 'suspended'}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Suspend User</DialogTitle>
                            <DialogDescription>
                              Suspend {user.full_name || user.email} from the platform.
                              This action can be reversed later.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Suspension Reason *</label>
                              <Textarea
                                value={suspensionReason}
                                onChange={(e) => setSuspensionReason(e.target.value)}
                                placeholder="Explain why this user is being suspended..."
                                rows={3}
                                className="mt-2"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="destructive"
                              onClick={() => selectedUser && handleSuspendUser(selectedUser.id, suspensionReason)}
                              disabled={actionLoading || !suspensionReason.trim()}
                            >
                              Suspend User
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}