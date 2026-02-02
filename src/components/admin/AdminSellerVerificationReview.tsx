import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MapPin, 
  Building, 
  Phone, 
  Mail,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/clients';
import { DataTable, TableColumn } from '@/components/shared/DataTable';

interface SellerApplication {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  address: any;
  business_type: string;
  business_name?: string;
  business_registration?: string;
  tax_id?: string;
  selling_reason: string;
  experience_level: string;
  product_categories: string[];
  expected_monthly_sales: number;
  portfolio_url?: string;
  previous_platforms: string[];
  terms_accepted: boolean;
  commission_rate_accepted: boolean;
  status: string;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
    full_name?: string;
    avatar_url?: string;
    role: string;
  };
}

interface AdminSellerVerificationReviewProps {
  onApplicationsChange?: () => void;
}

export function AdminSellerVerificationReview({ onApplicationsChange }: AdminSellerVerificationReviewProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<SellerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchApplications();
    
    // Set up real-time updates
    const interval = setInterval(fetchApplications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_verification_applications')
        .select(`
          *,
          profiles!seller_verification_applications_user_id_fkey(
            email,
            full_name,
            avatar_url,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        // Don't throw error, just log it and continue with empty array
        setApplications([]);
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (
    applicationId: string, 
    action: 'approve' | 'reject',
    notes?: string
  ) => {
    if (!profile) return;

    setActionLoading(true);
    try {
      const application = applications.find(app => app.id === applicationId);
      if (!application) return;

      // Update application status
      const { error: appError } = await supabase
        .from('seller_verification_applications')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_notes: notes || adminNotes,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (appError) throw appError;

      // Update user profile if approved
      if (action === 'approve') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: 'seller',
            is_verified_seller: true,
            verification_status: 'approved',
            verification_reviewed_at: new Date().toISOString(),
            verification_reviewed_by: profile.id,
          })
          .eq('user_id', application.user_id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          // Continue anyway, application status was updated
        }
      }

      toast({
        title: 'Success',
        description: `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      // Refresh data
      await fetchApplications();
      setSelectedApplication(null);
      setAdminNotes('');
      
      if (onApplicationsChange) {
        onApplicationsChange();
      }

    } catch (error: any) {
      console.error('Error processing application:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} application`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'rejected': return <XCircle className="h-3 w-3 mr-1" />;
      case 'under_review': return <Eye className="h-3 w-3 mr-1" />;
      default: return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  const applicationColumns: TableColumn<SellerApplication>[] = [
    {
      key: 'applicant',
      label: 'Applicant',
      render: (app) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            {app.profiles?.avatar_url ? (
              <img src={app.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="font-medium">{app.full_name}</div>
            <div className="text-sm text-muted-foreground">{app.profiles?.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'business_type',
      label: 'Business Type',
      render: (app) => (
        <Badge variant="outline" className="capitalize">
          {app.business_type}
        </Badge>
      )
    },
    {
      key: 'categories',
      label: 'Categories',
      render: (app) => (
        <div className="flex flex-wrap gap-1">
          {app.product_categories.slice(0, 2).map((category, index) => (
            <Badge key={index} variant="secondary" className="text-xs capitalize">
              {category}
            </Badge>
          ))}
          {app.product_categories.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{app.product_categories.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'expected_sales',
      label: 'Expected Sales',
      render: (app) => `$${app.expected_monthly_sales?.toFixed(0) || '0'}/mo`
    },
    {
      key: 'status',
      label: 'Status',
      render: (app) => (
        <Badge className={getStatusColor(app.status)}>
          {getStatusIcon(app.status)}
          {app.status?.toUpperCase() || 'PENDING'}
        </Badge>
      )
    },
    {
      key: 'submitted',
      label: 'Submitted',
      render: (app) => new Date(app.created_at).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (app) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedApplication(app)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Review
          </Button>
          {app.status === 'pending' && (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleApplicationAction(app.id, 'approve')}
                disabled={actionLoading}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleApplicationAction(app.id, 'reject')}
                disabled={actionLoading}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  if (selectedApplication) {
    const app = selectedApplication;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Seller Application Review</h2>
            <p className="text-muted-foreground">Review and approve seller verification</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedApplication(null)}>
            Back to List
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{app.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="font-medium">{app.profiles?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="font-medium">{app.phone_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                    <p className="font-medium">{new Date(app.date_of_birth).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {app.address && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <p className="font-medium">
                      {app.address.line1}
                      {app.address.line2 && `, ${app.address.line2}`}
                      <br />
                      {app.address.city}, {app.address.state} {app.address.postal_code}
                      <br />
                      {app.address.country}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Business Type</Label>
                    <p className="font-medium capitalize">{app.business_type}</p>
                  </div>
                  {app.business_name && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Business Name</Label>
                      <p className="font-medium">{app.business_name}</p>
                    </div>
                  )}
                  {app.business_registration && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Registration Number</Label>
                      <p className="font-medium">{app.business_registration}</p>
                    </div>
                  )}
                  {app.tax_id && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tax ID</Label>
                      <p className="font-medium">{app.tax_id}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Selling Reason</Label>
                  <p className="font-medium mt-1 p-3 bg-muted rounded-lg">{app.selling_reason}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Experience Level</Label>
                    <p className="font-medium capitalize">{app.experience_level}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Expected Monthly Sales</Label>
                    <p className="font-medium">${app.expected_monthly_sales?.toFixed(0) || '0'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Product Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {app.product_categories.map((category, index) => (
                      <Badge key={index} variant="secondary" className="capitalize">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Application Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge className={`${getStatusColor(app.status)} text-lg px-4 py-2`}>
                    {getStatusIcon(app.status)}
                    {app.status?.toUpperCase() || 'PENDING'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted:</span>
                    <span>{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                  {app.reviewed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reviewed:</span>
                      <span>{new Date(app.reviewed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {app.admin_notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Admin Notes</Label>
                    <p className="text-sm mt-1 p-2 bg-muted rounded">{app.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Actions */}
            {app.status === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Review Decision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="admin-notes"
                      placeholder="Add notes about your decision..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApplicationAction(app.id, 'approve', adminNotes)}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleApplicationAction(app.id, 'reject', adminNotes)}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Categories:</span>
                  <span className="font-medium">{app.product_categories.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected Sales:</span>
                  <span className="font-medium">${app.expected_monthly_sales?.toFixed(0) || '0'}/mo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terms Accepted:</span>
                  <span className="font-medium">{app.terms_accepted ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commission Accepted:</span>
                  <span className="font-medium">{app.commission_rate_accepted ? '✅' : '❌'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seller Verification Applications</h2>
          <p className="text-muted-foreground">Review and approve seller applications</p>
        </div>
        <Button onClick={fetchApplications} variant="outline">
          Refresh
        </Button>
      </div>

      {applications.length === 0 && !loading && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No seller verification applications found. This could mean:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>No applications have been submitted yet</li>
              <li>The seller_verification_applications table doesn't exist</li>
              <li>There are database permission issues</li>
            </ul>
            <p className="mt-2">
              Run the database setup scripts to ensure the table exists and has proper permissions.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        title="Applications"
        data={applications}
        columns={applicationColumns}
        loading={loading}
        searchKey="full_name"
        searchPlaceholder="Search applications..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'pending', label: 'Pending Review' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
            ]
          },
          {
            key: 'business_type',
            label: 'Business Type',
            options: [
              { value: 'individual', label: 'Individual' },
              { value: 'business', label: 'Business' },
              { value: 'company', label: 'Company' }
            ]
          }
        ]}
        emptyMessage="No seller applications found"
      />
    </div>
  );
}