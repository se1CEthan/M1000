import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Download, Eye, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { InstantPaymentWidget } from '@/components/payment/InstantPaymentWidget';
import { Product, CATEGORY_INFO } from '@/types/database';
import { supabase } from '@/integrations/supabase/clients';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { toast: toastHook } = useToast();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!seller_id(*)
        `)
        .eq('slug', slug)
        .eq('status', 'approved')
        .single();

      if (error) throw error;
      setProduct(data as unknown as Product);
      
      // Increment view count
      await supabase
        .from('products')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);
        
    } catch (error) {
      console.error('Error fetching product:', error);
      toastHook({
        title: 'Error',
        description: 'Product not found',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please log in to purchase this product');
      return;
    }

    if (!product) {
      toast.error('Product not found');
      return;
    }

    // Check if user is trying to buy their own product
    if (user.id === product.seller_id) {
      toast.error('You cannot purchase your own product');
      return;
    }

    // INSTANT payment - no modal delays
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (orderId: string) => {
    setShowPaymentModal(false);
    toast.success('Payment successful! Redirecting to download...');
    // The user will be redirected to order success page by Cryptomus
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-12 bg-muted rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const categoryInfo = CATEGORY_INFO[product.category];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Link to="/marketplace" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              {product.thumbnail_url ? (
                <img
                  src={product.thumbnail_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl text-muted-foreground/30">📦</span>
                </div>
              )}
            </div>
            
            {/* Preview Images */}
            {product.preview_images && product.preview_images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {product.preview_images.slice(0, 3).map((image, index) => (
                  <div key={index} className="aspect-video rounded overflow-hidden bg-muted">
                    <img src={image} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Featured Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={categoryInfo.color}>
                {categoryInfo.label}
              </Badge>
              {product.is_featured && (
                <Badge className="bg-primary text-primary-foreground">
                  Featured
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground">{product.title}</h1>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span>{product.average_rating.toFixed(1)}</span>
                <span>({product.review_count} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span>{product.download_count} downloads</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{product.view_count} views</span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">
                ${product.price.toFixed(2)} USD
              </div>
              <div className="text-sm text-muted-foreground">
                ≈ 0.{Math.floor(product.price * 1000).toString().padStart(6, '0')} BTC
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.short_description}
              </p>
            </div>

            {/* Buy Button - Multiple Payment Options */}
            <div className="space-y-4">
              <Button 
                onClick={handleBuyNow}
                size="lg" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={!user || (user && user.id === product.seller_id)}
              >
                <Zap className="h-5 w-5 mr-2" />
                {!user ? 'Login to Buy' : user.id === product.seller_id ? 'Your Product' : 'Buy Now - Multiple Payment Options'}
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure payment • Crypto & Mobile Money • 90% goes to seller</span>
              </div>
            </div>

            {/* Product Details */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold">Product Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span>{product.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="capitalize">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License:</span>
                    <span>Single Use</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Support:</span>
                    <span>Email Support</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Info */}
            {product.seller && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Seller Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                      {product.seller.avatar_url ? (
                        <img
                          src={product.seller.avatar_url}
                          alt={product.seller.full_name || 'Seller'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-semibold">
                          {product.seller.full_name?.charAt(0) || 'S'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{product.seller.full_name || 'Seller'}</div>
                      <div className="text-sm text-muted-foreground">Verified Seller</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Full Description */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Full Description</h3>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instant Payment Widget */}
      {product && (
        <InstantPaymentWidget
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          product={product}
        />
      )}
    </MainLayout>
  );
}