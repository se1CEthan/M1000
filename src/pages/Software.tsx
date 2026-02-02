import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Search, Filter, Grid, List, Code, Database, Globe, Shield, Smartphone, Monitor } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/types/database';
import { supabase } from '@/integrations/supabase/clients';
import { cn } from '@/lib/utils';

const SOFTWARE_TYPES = [
  { id: 'web', label: 'Web Apps', icon: Globe, description: 'Browser-based applications' },
  { id: 'desktop', label: 'Desktop Apps', icon: Monitor, description: 'Native desktop software' },
  { id: 'mobile', label: 'Mobile Apps', icon: Smartphone, description: 'iOS and Android apps' },
  { id: 'cli', label: 'CLI Tools', icon: Code, description: 'Command line utilities' },
  { id: 'database', label: 'Database Tools', icon: Database, description: 'Database management' },
  { id: 'security', label: 'Security Tools', icon: Shield, description: 'Security and privacy tools' },
];

export default function Software() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  useEffect(() => {
    fetchSoftware();
  }, [selectedType, sortBy, searchQuery]);

  const fetchSoftware = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          seller:profiles!seller_id(*)
        `)
        .eq('status', 'approved')
        .eq('category', 'software');

      // Apply type filter through tags
      if (selectedType !== 'all') {
        query = query.contains('tags', [selectedType]);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
          query = query.order('download_count', { ascending: false });
          break;
        case 'rating':
          query = query.order('average_rating', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setProducts((data as unknown as Product[]) || []);
    } catch (error) {
      console.error('Error fetching software:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams({ search: searchQuery });
  };

  const updateSearchParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    updateSearchParams({ type: type === 'all' ? '' : type });
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateSearchParams({ sort });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Software</h1>
              <p className="text-muted-foreground">
                Professional software solutions for developers and businesses
              </p>
            </div>
          </div>
        </div>

        {/* Software Types */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Software Types</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {SOFTWARE_TYPES.map((type) => (
              <Card
                key={type.id}
                className={cn(
                  'cursor-pointer border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:border-primary/50',
                  selectedType === type.id && 'border-primary bg-primary/5'
                )}
                onClick={() => handleTypeChange(type.id)}
              >
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <type.icon className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold text-sm mb-1">{type.label}</h3>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search software..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="flex flex-wrap items-center gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleTypeChange('all')}
                >
                  All
                </Badge>
                {SOFTWARE_TYPES.map((type) => (
                  <Badge
                    key={type.id}
                    variant={selectedType === type.id ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleTypeChange(type.id)}
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort by:</span>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className={cn(
            'grid gap-6',
            viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
          )}>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-[320px] animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className={cn(
            'grid gap-6',
            viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
          )}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No software found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
              updateSearchParams({ search: '', type: '' });
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}