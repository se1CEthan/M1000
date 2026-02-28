import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { UltraFastWidget } from '@/components/payment/UltraFastWidget';
import { Product } from '@/types/database';

export default function PayProductPage() {
  const { slug } = useParams();
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
      <h2 className="text-2xl font-bold mb-4">Pay for {product.title}</h2>
      <UltraFastWidget isOpen={true} onClose={() => window.history.back()} product={product} />
    </div>
  );
}
