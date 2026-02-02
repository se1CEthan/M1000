import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { Product } from '@/types/database';
import { supabase } from '@/integrations/supabase/clients';

export function FeaturedProducts() {
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
async function fetchFeaturedProducts() {
try {
const { data, error } = await supabase
.from('products')
.select(`
*,
seller:profiles!seller_id(*)
`)
.eq('status', 'approved')
.eq('is_featured', true)
.order('created_at', { ascending: false })
.limit(6);

if (error) throw error;
setProducts((data as unknown as Product[]) || []);
} catch (error) {
console.error('Error fetching featured products:', error);
} finally {
setLoading(false);
}
}

fetchFeaturedProducts();
}, []);

// If no featured products, show latest products
useEffect(() => {
if (!loading && products.length === 0) {
async function fetchLatestProducts() {
try {
const { data, error } = await supabase
.from('products')
.select(`
*,
seller:profiles!seller_id(*)
`)
.eq('status', 'approved')
.order('created_at', { ascending: false })
.limit(6);

if (error) throw error;
setProducts((data as unknown as Product[]) || []);
} catch (error) {
console.error('Error fetching latest products:', error);
}
}

fetchLatestProducts();
}
}, [loading, products.length]);

return (
<section className="py-16 lg:py-24">
<div className="container mx-auto px-4 sm:px-6">
<motion.div
className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, margin: '-50px' }}
transition={{ duration: 0.5 }}
>
<div>
<h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
Featured products
</h2>
<p className="mt-1.5 text-muted-foreground">
Discover top-rated tools from verified sellers
</p>
</div>
<Button variant="outline" asChild className="hidden rounded-xl sm:inline-flex">
<Link to="/marketplace">
View all
<ArrowRight className="ml-2 h-4 w-4" />
</Link>
</Button>
</motion.div>

{loading ? (
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
{[...Array(6)].map((_, i) => (
<div
key={i}
className="h-[320px] animate-pulse rounded-xl bg-muted/60"
/>
))}
</div>
) : products.length > 0 ? (
<motion.div
className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
initial="hidden"
whileInView="visible"
viewport={{ once: true, margin: '-40px' }}
variants={{
hidden: {},
visible: { transition: { staggerChildren: 0.06 } },
}}
>
{products.map((product, i) => (
<motion.div
key={product.id}
variants={{
hidden: { opacity: 0, y: 20 },
visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}}
>
<ProductCard product={product} />
</motion.div>
))}
</motion.div>
) : (
<div className="flex flex-col items-center justify-center py-16 text-center">
<p className="text-lg text-muted-foreground">No products available yet.</p>
<Button asChild className="mt-4">
<Link to="/auth?mode=signup&role=seller">Be the first seller!</Link>
</Button>
</div>
)}

<div className="mt-8 text-center sm:hidden">
<Button variant="outline" asChild>
<Link to="/marketplace">
View All Products
<ArrowRight className="ml-2 h-4 w-4" />
</Link>
</Button>
</div>
</div>
</section>
);
}
