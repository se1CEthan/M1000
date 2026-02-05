import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Package, 
  User, 
  Download, 
  Eye, 
  Star,
  ExternalLink,
  FileText,
  DollarSign,
  Calendar,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DownloadService } from '@/lib/download-service';

interface ProductWithSeller {
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
  status: string;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

interface ProductReviewDetailProps {
  product: ProductWithSeller;
  onBack: () => void;
  onReviewed: () => void;
  onAction: (productId: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
}

export function ProductReviewDetail({ product, onBack, onReviewed, onAction }: ProductReviewDetailProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);

  const handleReview = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting this product',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await onAction(product.id, action, action === 'reject' ? rejectionReason : reviewNotes);
      onReviewed();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!product.file_url) {
      toast({
        title: 'No File Available',
        description: 'This product does not have a downloadable file',
        variant: 'destructive',
      });
      return;
    }

    setDownloadLoading(true);
    try {
      const result = await DownloadService.generateAdminDownloadUrl(product.id);
      
      if (result.success && result.downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `${product.title.replace(/[^a-zA-Z0-9]/g, '_')}_product_file`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Download Started',
          description: 'The product file download has started',
        });
      } else {
        toast({
          title: 'Download Failed',
          description: result.error || 'Failed to generate download link',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Error',
        description: 'An error occurred while preparing the download',
        variant: 'destructive',
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Product Review</h2>
          <p className="text-muted-foreground">
            Review and manage product submission
          </p>
        </div>
        <Badge className={getStatusColor(product.status)}>
          {product.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
          {product.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
          {product.status === 'pending' && <Eye className="h-3 w-3 mr-1" />}
          {product.status?.toUpperCase() || 'PENDING'}
        </Badge>
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
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {product.thumbnail_url ? (
                    <img 
                      src={product.thumbnail_url} 
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-semibold">{product.title}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Category:</span>
                      <Badge variant="outline" className="capitalize">
                        {product.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Price:</span>
                      <div>
                        <span className="font-semibold">UGX {Math.round((product.price || 0) * 3700).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Version:</span>
                      <span>{product.version}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Submitted:</span>
                      <span>{new Date(product.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div>
                    <Badge variant="outline" className="capitalize">
                      {product.pricing_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              {product.short_description && (
                <div>
                  <h4 className="font-medium mb-2">Short Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {product.short_description}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Full Description</h4>
                <div className="text-sm bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">{product.description}</pre>
                </div>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
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
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  {product.profiles.avatar_url ? (
                    <img 
                      src={product.profiles.avatar_url} 
                      alt={product.profiles.full_name || 'Seller'}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold">
                      {(product.profiles.full_name || product.profiles.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-lg">
                    {product.profiles.full_name || 'No name provided'}
                  </h4>
                  <p className="text-muted-foreground">{product.profiles.email}</p>
                  <p className="text-sm text-muted-foreground">Seller ID: {product.seller_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files and Links */}
          <Card>
            <CardHeader>
              <CardTitle>Files and Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.file_url && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Product File</p>
                      {product.file_size && (
                        <p className="text-sm text-muted-foreground">
                          Size: {formatFileSize(product.file_size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={product.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              )}

              {product.demo_url && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Live Preview</p>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {product.demo_url}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={product.demo_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit
                    </a>
                  </Button>
                </div>
              )}

              {product.documentation_url && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Documentation</p>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {product.documentation_url}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={product.documentation_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      View Docs
                    </a>
                  </Button>
                </div>
              )}

              {!product.file_url && !product.demo_url && !product.documentation_url && (
                <p className="text-muted-foreground text-center py-4">
                  No additional files or links provided
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review Panel */}
        <div className="space-y-6">
          {/* Review Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Review Guidelines</CardTitle>
              <CardDescription>
                Check these criteria before approving
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Original or properly licensed content</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Clear and accurate description</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Appropriate pricing for value</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Working preview/documentation links</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>No malicious code or content</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Follows platform policies</span>
              </div>
            </CardContent>
          </Card>

          {/* Review Actions */}
          {product.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Review Decision</CardTitle>
                <CardDescription>
                  Approve or reject this product submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Review Notes (Optional)</label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any notes about this product..."
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Rejection Reason (Required if rejecting)</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this product is being rejected..."
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => handleReview('approve')}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {loading ? 'Processing...' : 'Approve Product'}
                  </Button>
                  
                  <Button
                    onClick={() => handleReview('reject')}
                    disabled={loading || !rejectionReason.trim()}
                    variant="destructive"
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {loading ? 'Processing...' : 'Reject Product'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Already Reviewed */}
          {product.status !== 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Review Complete</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  {product.status === 'approved' ? (
                    <div className="text-green-600">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-medium">Product Approved</p>
                      <p className="text-sm text-muted-foreground">
                        This product is live on the marketplace
                      </p>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <XCircle className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-medium">Product Rejected</p>
                      <p className="text-sm text-muted-foreground">
                        This product was not approved
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}