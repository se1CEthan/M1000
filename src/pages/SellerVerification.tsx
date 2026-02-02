import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/clients';
import { SellerVerificationForm } from '@/components/seller/SellerVerificationForm';

interface VerificationApplication {
  id: string;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  full_name: string;
  business_type: string;
  selling_reason: string;
}

export default function SellerVerification() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [application, setApplication] = useState<VerificationApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchApplication();
    }
  }, [profile]);

  const fetchApplication = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('seller_verification_applications')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setApplication(data);
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSuccess = () => {
    setShowForm(false);
    fetchApplication();
    toast({
      title: 'Application Submitted!',
      description: 'Your seller verification application has been submitted for review.',
    });
  };

  // Redirect if not logged in
  if (!user || !profile) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Button asChild>
            <a href="/auth">Sign In</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // If already a verified seller
  if (profile.role === 'seller' && profile.is_verified_seller) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">You're Already Verified!</h1>
            <p className="text-muted-foreground mb-6">
              You're already a verified seller on Seltech. You can start uploading products right away.
            </p>
            <Button asChild>
              <a href="/seller-dashboard">Go to Seller Dashboard</a>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'under_review':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'additional_info_required':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'additional_info_required':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'under_review':
        return 'Under Review';
      case 'additional_info_required':
        return 'Additional Info Required';
      case 'pending':
        return 'Pending Review';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div>Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Seller Verification</h1>
            <p className="text-muted-foreground">
              Complete your seller verification to start selling on Seltech
            </p>
          </div>

          {/* Existing Application Status */}
          {application && !showForm && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(application.status)}
                      Application Status
                    </CardTitle>
                    <CardDescription>
                      Submitted on {new Date(application.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(application.status)}>
                    {getStatusText(application.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {application.full_name}
                    </div>
                    <div>
                      <span className="font-medium">Business Type:</span> {application.business_type}
                    </div>
                  </div>

                  {application.admin_notes && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Admin Notes
                      </h4>
                      <p className="text-sm">{application.admin_notes}</p>
                    </div>
                  )}

                  {application.status === 'pending' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Your application is in the review queue. We'll notify you via email once it's been reviewed.
                        This typically takes 2-5 business days.
                      </p>
                    </div>
                  )}

                  {application.status === 'under_review' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Your application is currently being reviewed by our team. 
                        You'll receive an email notification with the decision soon.
                      </p>
                    </div>
                  )}

                  {application.status === 'rejected' && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-red-800 mb-3">
                        Unfortunately, your application was not approved. You can submit a new application 
                        after addressing the issues mentioned in the admin notes above.
                      </p>
                      <Button onClick={() => setShowForm(true)} variant="outline">
                        Submit New Application
                      </Button>
                    </div>
                  )}

                  {application.status === 'additional_info_required' && (
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="text-sm text-amber-800 mb-3">
                        Additional information is required to complete your verification. 
                        Please review the admin notes and submit a new application with the requested information.
                      </p>
                      <Button onClick={() => setShowForm(true)} variant="outline">
                        Update Application
                      </Button>
                    </div>
                  )}

                  {application.status === 'approved' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-800 mb-3">
                        Congratulations! Your seller verification has been approved. 
                        You can now start uploading products to the marketplace.
                      </p>
                      <Button asChild>
                        <a href="/seller-dashboard">Go to Seller Dashboard</a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Form */}
          {(!application || showForm || application.status === 'rejected' || application.status === 'additional_info_required') && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {application ? 'Update Verification Application' : 'Seller Verification Application'}
                </CardTitle>
                <CardDescription>
                  {application 
                    ? 'Please provide the additional information requested by our team.'
                    : 'Complete this form to become a verified seller on Seltech. All fields marked with * are required.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SellerVerificationForm onSuccess={handleApplicationSuccess} />
              </CardContent>
            </Card>
          )}

          {/* No Application Yet */}
          {!application && !showForm && (
            <div className="text-center">
              <div className="max-w-md mx-auto">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-4">Ready to Start Selling?</h2>
                <p className="text-muted-foreground mb-6">
                  Complete our seller verification process to start selling your digital products on Seltech.
                </p>
                <Button onClick={() => setShowForm(true)} size="lg">
                  Start Verification Process
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}