import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CategoryCard } from '@/components/products/CategoryCard';
import { ProductCategory } from '@/types/database';
import { supabase } from '@/integrations/supabase/clients';

const CATEGORIES: ProductCategory[] = ['bots', 'software', 'templates', 'assets', 'apis', 'plugins'];

export function CategorySection() {
const [categoryCounts, setCategoryCounts] = useState<Record<ProductCategory, number>>({
bots: 0,
software: 0,
templates: 0,
assets: 0,
apis: 0,
plugins: 0,
});

useEffect(() => {
async function fetchCategoryCounts() {
try {
const { data, error } = await supabase
.from('products')
.select('category')
.eq('status', 'approved');

if (error) throw error;

const counts: Record<ProductCategory, number> = {
bots: 0,
software: 0,
templates: 0,
assets: 0,
apis: 0,
plugins: 0,
};

data?.forEach((product) => {
if (product.category in counts) {
counts[product.category as ProductCategory]++;
}
});

setCategoryCounts(counts);
} catch (error) {
console.error('Error fetching category counts:', error);
}
}

fetchCategoryCounts();
}, []);

return (
<section className="bg-muted/30 py-16 lg:py-24">
<div className="container mx-auto px-4 sm:px-6">
<motion.div
className="mb-12 text-center"
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, margin: '-50px' }}
transition={{ duration: 0.5 }}
>
<h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
Seltech product suites
</h2>
<p className="mt-1.5 text-muted-foreground">
Bots, software, templates, and digital assets. Find the right tools for your project.
</p>
</motion.div>

<motion.div
className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
initial="hidden"
whileInView="visible"
viewport={{ once: true, margin: '-40px' }}
variants={{
hidden: {},
visible: { transition: { staggerChildren: 0.05 } },
}}
>
{CATEGORIES.map((category) => (
<motion.div
key={category}
variants={{
hidden: { opacity: 0, y: 16 },
visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}}
>
<CategoryCard
category={category}
productCount={categoryCounts[category]}
/>
</motion.div>
))}
</motion.div>
</div>
</section>
);
}
