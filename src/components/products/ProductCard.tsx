import { Link } from 'react-router-dom';
import { Star, Download, Eye, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Product, CATEGORY_INFO, PRICING_TYPE_INFO } from '@/types/database';
import { ThumbnailService } from '@/lib/thumbnail-service';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onWishlist?: () => void;
  isWishlisted?: boolean;
}

export function ProductCard({ product, onWishlist, isWishlisted }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const categoryInfo = CATEGORY_INFO[product.category];
  const pricingInfo = PRICING_TYPE_INFO[product.pricing_type];

  const formatPrice = (price: number) => {
    // Add three zeros to the price (multiply by 1000)
    const ugxPrice = price * 1000;
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(ugxPrice);
  };

  // Get optimized thumbnail URL
  const thumbnailUrl = product.thumbnail_url 
    ? ThumbnailService.getOptimizedThumbnailUrl(product.thumbnail_url, {
        width: 400,
        height: 250,
        quality: 85,
        format: 'webp'
      })
    : null;

  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
      {/* Thumbnail */}
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {thumbnailUrl && !imageError ? (
            <>
              {/* Loading placeholder */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                  <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-muted-foreground/40 rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Optimized image */}
              <img
                src={thumbnailUrl}
                alt={product.title}
                className={cn(
                  "h-full w-full object-cover transition-all duration-300 group-hover:scale-105",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            /* Default thumbnail with category-specific styling */
            <div className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br transition-all duration-300 group-hover:scale-105",
              categoryInfo.color === 'text-blue-600' && "from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20",
              categoryInfo.color === 'text-green-600' && "from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20",
              categoryInfo.color === 'text-purple-600' && "from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20",
              categoryInfo.color === 'text-orange-600' && "from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20",
              categoryInfo.color === 'text-red-600' && "from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20",
              categoryInfo.color === 'text-indigo-600' && "from-indigo-100 to-indigo-200 dark:from-indigo-900/20 dark:to-indigo-800/20",
              !categoryInfo.color && "from-muted to-muted/50"
            )}>
              <div className="text-center space-y-2">
                <span className="text-4xl opacity-60">{categoryInfo.icon}</span>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {categoryInfo.label}
                </p>
              </div>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          {/* Featured badge */}
          {product.is_featured && (
            <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground shadow-lg">
              Featured
            </Badge>
          )}

          {/* Wishlist button */}
          {onWishlist && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute right-3 top-3 h-8 w-8 rounded-full bg-background/50 backdrop-blur transition-all shadow-lg',
                isWishlisted ? 'text-destructive' : 'text-foreground opacity-0 group-hover:opacity-100'
              )}
              onClick={(e) => {
                e.preventDefault();
                onWishlist();
              }}
            >
              <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
            </Button>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        {/* Category & Pricing Type */}
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary" className={cn('text-xs', categoryInfo.color)}>
            {categoryInfo.label}
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {pricingInfo.label}
          </Badge>
        </div>

        {/* Title */}
        <Link to={`/product/${product.slug}`}>
          <h3 className="mb-1 line-clamp-1 font-semibold text-foreground transition-colors hover:text-primary">
            {product.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {product.short_description || product.description}
        </p>

        {/* Stats */}
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span>{product.average_rating.toFixed(1)}</span>
            <span>({product.review_count})</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            <span>{product.download_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{product.view_count}</span>
          </div>
        </div>

        {/* Price & Seller */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.pricing_type !== 'one_time' && (
              <span className="ml-1 text-xs text-muted-foreground">
                /{product.pricing_type === 'subscription_monthly' ? 'mo' : 'yr'}
              </span>
            )}
          </div>
          {product.seller && (
            <Link
              to={`/seller/${product.seller.id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-6 w-6 rounded-full bg-muted overflow-hidden">
                {product.seller.avatar_url ? (
                  <img
                    src={product.seller.avatar_url}
                    alt={product.seller.full_name || 'Seller'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary text-xs text-primary-foreground">
                    {product.seller.full_name?.charAt(0) || 'S'}
                  </div>
                )}
              </div>
              <span className="max-w-[80px] truncate">{product.seller.full_name || 'Seller'}</span>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
