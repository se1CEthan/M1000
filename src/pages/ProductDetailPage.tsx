import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Product } from '@/types/database';
import { Button } from '@/components/ui/button';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      // Replace with your actual API endpoint to fetch product by slug
      const res = await fetch(`/api/products/${slug}`);
      const data = await res.json();
      setProduct(data.product);
      setLoading(false);
    }
    if (slug) fetchProduct();
  }, [slug]);

  if (loading) return <div className="p-8 text-center">Loading product...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Product not found.</div>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
      <p className="mb-4 text-muted-foreground">{product.description}</p>
      <div className="mb-6">
        <span className="text-lg font-bold text-primary">${product.price}</span>
      </div>
      <Button size="lg" variant="primary" className="w-full" onClick={() => navigate(`/pay/${product.slug}`)}>
        Buy Now - Pay with Crypto
      </Button>
    </div>
  );
}
