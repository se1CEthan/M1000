import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductCategory, CATEGORY_INFO } from '@/types/database';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: ProductCategory;
  productCount: number;
}

export function CategoryCard({ category, productCount }: CategoryCardProps) {
  const categoryInfo = CATEGORY_INFO[category];
  
  const getRouteForCategory = (category: ProductCategory) => {
    switch (category) {
      case 'bots':
        return '/bots';
      case 'software':
        return '/software';
      case 'templates':
        return '/templates';
      default:
        return `/marketplace?category=${category}`;
    }
  };

  return (
    <Link to={getRouteForCategory(category)}>
      <Card className="group cursor-pointer border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
        <CardContent className="flex flex-col items-center p-6 text-center">
          <div className={cn(
            'mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all duration-300 group-hover:scale-110 group-hover:text-primary',
            categoryInfo.color
          )}>
            {category === 'bots' && '🤖'}
            {category === 'software' && '💻'}
            {category === 'templates' && '📄'}
            {category === 'assets' && '🎨'}
            {category === 'apis' && '🔌'}
            {category === 'plugins' && '🧩'}
          </div>
          <h3 className="mb-2 font-semibold text-foreground group-hover:text-primary transition-colors">
            {categoryInfo.label}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
