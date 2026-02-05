import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Package, User, Download, Eye, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/clients';

interface ProductReview {
  id: string;
  product_id: string;
  status: string;
  created_at: string;
  products: {
    id: string;
    title: string;
    description: string;
    short_description: string | null;
    category: string;
    tags: string[];
    price: number;
    pricing_type: string;
    version: string;
    demo_url: string | null;
    documentation_url: string | null;
    thumbnail_url: string | null;
    file_url: string | null;
    file_size: number | null;
    seller_id: string;
    profiles: {
      full_name: string | null;
      email: string;
      avatar_url: string | null;
    };
  };
}

interface AdminProductReviewProps {
  productReview: ProductReview;
  onBack: () => void;
  onReviewed: () => void;
}

export function AdminProductReview({ productReview, onBack, onReviewed }: AdminProductReviewProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const product = productReview.products;

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!profile || (action === 'reject' && !rejectionReason.trim())) {
      toast({
        title: 'Notes Required',
        description: action === 'reject' ? 'Please provide a rejection reason' : 'Please provide review notes',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Update product review status
      const { error: reviewError } = await supabase
        .from('product_reviews')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          review_notes: reviewNotes || null,
          rejection_reason: action === 'reject' ? rejectionReason : null,
          reviewer_id: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', productReview.id);

      if (reviewError) throw reviewError;

      // Update product status
      const { error: productError } = await supabase
        .from('products')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
        })
        .eq('id', product.id);

      if (productError) throw productError;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: profile.id,
        p_action_type: action === 'approve' ? 'product_approved' : 'product_rejected',
        p_target_id: product.id,
        p_target_type: 'product',
        p_details: {
          product_title: product.title,
          seller_id: product.seller_id,
          review_notes: reviewNotes,
          rejection_reason: action === 'reject' ? rejectionReason : null,
        },
      });

      toast({
        title: 'Review Completed',
        description: `Product has been ${action === 'approve' ? 'approved' : 'rejected'}`,
      });

      onReviewed();
    } catch (error: any) {
      console.error('Error reviewing product:', error);
      toast({
        title: 'Review Failed',
        description: error.message || 'Failed to process review',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Product Review</h2>
          <p className="text-muted-foreground">
            Review and approve or reject this product submission
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {product.thumbnail_url ? (
                    <img 
                      src={product.thumbnail_url} 
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Category:</span>
                      <Badge variant="outline" className="ml-2 capitalize">
                        {product.category}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> 
                      <div className="inline-block ml-2">
                        <span className="font-semibold">UGX {Math.round((product.price || 0) * 3700).toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Version:</span> {product.version}
                    </div>
                    <div>
                      <span className="font-medium">Pricing Type:</span>
                      <Badge variant="outline" className="ml-2 capitalize">
                        {product.pricing_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {product.short_description && (
                <div>
                  <span className="font-medium">Short Description:</span>
                  <p className="text-sm text-muted-foreground mt-1">{product.short_description}</p>
                </div>
              )}

              <div>
                <span className="font-medium">Description:</span>
                <p className="text-sm mt-1 whitespace-pre-wrap">{product.description}</p>
              </div>

              {product.tags.length > 0 && (
                <div>
                  <span className="font-medium">Tags:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  {product.profiles.avatar_url ? (
                    <img 
                      src={product.profiles.avatar_url} 
                      alt={product.profiles.full_name || 'Seller'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {(product.profiles.full_name || product.profiles.email).charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">
                    {product.profiles.full_name || 'No name provided'}
                  </h4>
                  <p className="text-sm text-muted-foreground">{product.profiles.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files and Links */}
          <Card>
            <CardHeader>
              <CardTitle>Files and Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.file_url && (
                <div>
                  <span className="font-medium">Product File:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <a 
                      href={product.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Download File
                    </a>
                    {product.file_size && (
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(product.file_size)})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {product.demo_url && (
                <div>
                  <span className="font-medium">Preview URL:</span>
                  <a 
                    href={product.demo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-primary hover:underline text-sm"
                  >
                    {product.demo_url}
                  </a>
                </div>
              )}

              {product.documentation_url && (
                <div>
                  <span className="font-medium">Documentation:</span>
                  <a 
                    href={product.documentation_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-primary hover:underline text-sm"
                  >
                    {product.documentation_url}
                  </a>
                </div>
              )}

              {!product.file_url && !product.demo_url && !product.documentation_url && (
                <p className="text-muted-foreground text-sm">No additional files or links provided</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review Panel */}
        <div className="space-y-6">
          {/* Review Status */}
          <Card>
            <CardHeader>
              <CardTitle>Review Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className={
                  productReview.status === 'approved' ? 'bg-green-100 text-green-800' :
                  productReview.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }>
                  {productReview.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Submitted: {new Date(productReview.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Review Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Review Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>✓ Original or properly licensed content</p>
              <p>✓ Clear and accurate description</p>
              <p>✓ Appropriate pricing</p>
              <p>✓ Working preview/documentation links</p>
              <p>✓ No malicious code or content</p>
              <p>✓ Follows platform policies</p>
            </CardContent>
          </Card>

          {/* Review Actions */}
          {productReview.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Review Decision</CardTitle>
                <CardDescription>
                  Provide your review decision and notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Review Notes</label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Optional notes about the product..."
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this product is being rejected..."
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => handleReview('approve')}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Product
                  </Button>
                  
                  <Button
                    onClick={() => handleReview('reject')}
                    disabled={loading || !rejectionReason.trim()}
                    variant="destructive"
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Product
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