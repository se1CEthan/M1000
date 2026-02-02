import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, User, MapPin, Briefcase, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/clients';

interface SellerApplication {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  address: any;
  business_type: string;
  business_name: string | null;
  business_registration: string | null;
  tax_id: string | null;
  selling_reason: string;
  product_categories: string[];
  expected_monthly_sales: number;
  terms_accepted: boolean;
  commission_rate_accepted: boolean;
  status: string;
  created_at: string;
  profiles: {
    email: string;
    avatar_url: string | null;
  };
}

interface AdminSellerReviewProps {
  application: SellerApplication;
  onBack: () => void;
  onReviewed: () => void;
}

export function AdminSellerReview({ application, onBack, onReviewed }: AdminSellerReviewProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!profile || !adminNotes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please provide admin notes for this review',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Update application status
      const { error: appError } = await supabase
        .from('seller_verification_applications')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_notes: adminNotes,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', application.id);

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
          .eq('id', application.user_id);

        if (profileError) throw profileError;

        // Send notification to the user about approval
        await supabase
          .from('notifications')
          .insert({
            user_id: application.user_id,
            title: 'Seller Application Approved! 🎉',
            message: 'Congratulations! Your seller application has been approved. You can now start uploading and selling your digital products.',
            type: 'seller_approved',
            action_url: '/seller-dashboard',
            created_at: new Date().toISOString()
          });
      }

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: profile.id,
        p_action_type: action === 'approve' ? 'seller_approved' : 'seller_rejected',
        p_target_id: application.user_id,
        p_target_type: 'user',
        p_details: {
          application_id: application.id,
          notes: adminNotes,
        },
      });

      toast({
        title: 'Review Completed',
        description: `Seller application has been ${action === 'approve' ? 'approved' : 'rejected'}`,
      });

      onReviewed();
    } catch (error: any) {
      console.error('Error reviewing application:', error);
      toast({
        title: 'Review Failed',
        description: error.message || 'Failed to process review',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Not provided';
    return `${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.state} ${address.postal_code}, ${address.country}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Seller Application Review</h2>
          <p className="text-muted-foreground">
            Review and approve or reject this seller verification application
          </p>
        </div>
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
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  {application.profiles.avatar_url ? (
                    <img 
                      src={application.profiles.avatar_url} 
                      alt={application.full_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold">
                      {application.full_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{application.full_name}</h3>
                  <p className="text-muted-foreground">{application.profiles.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Born: {new Date(application.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Phone:</span> {application.phone_number}
                </div>
                <div>
                  <span className="font-medium">Business Type:</span> 
                  <Badge variant="outline" className="ml-2 capitalize">
                    {application.business_type}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{formatAddress(application.address)}</p>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.business_name && (
                <div>
                  <span className="font-medium">Business Name:</span> {application.business_name}
                </div>
              )}
              {application.business_registration && (
                <div>
                  <span className="font-medium">Registration:</span> {application.business_registration}
                </div>
              )}
              {application.tax_id && (
                <div>
                  <span className="font-medium">Tax ID:</span> {application.tax_id}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Expected Monthly Sales:</span> ${application.expected_monthly_sales}
                </div>
              </div>

              <div>
                <span className="font-medium">Product Categories:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {application.product_categories.map((category) => (
                    <Badge key={category} variant="secondary" className="capitalize">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selling Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Selling Motivation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{application.selling_reason}</p>
            </CardContent>
          </Card>
        </div>

        {/* Review Panel */}
        <div className="space-y-6">
          {/* Application Status */}
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className={
                  application.status === 'approved' ? 'bg-green-100 text-green-800' :
                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }>
                  {application.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Submitted: {new Date(application.created_at).toLocaleDateString()}</p>
                <p>Terms Accepted: {application.terms_accepted ? '✓' : '✗'}</p>
                <p>Commission Accepted: {application.commission_rate_accepted ? '✓' : '✗'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Review Actions */}
          {application.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Review Decision</CardTitle>
                <CardDescription>
                  Provide your review notes and decision
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Admin Notes *</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Provide detailed notes about your decision..."
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => handleReview('approve')}
                    disabled={loading || !adminNotes.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  
                  <Button
                    onClick={() => handleReview('reject')}
                    disabled={loading || !adminNotes.trim()}
                    variant="destructive"
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}