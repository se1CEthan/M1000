-- Add Demo Products for Cryptomus Inspection
-- Run this in your Supabase SQL Editor

-- First, create a demo seller profile (if not exists)
INSERT INTO public.profiles (
  id,
  user_id,
  email,
  full_name,
  avatar_url,
  role,
  is_verified_seller,
  created_at
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'demo@seltech.online',
  'Seltech Demo Seller',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'seller',
  true,
  now()
) ON CONFLICT (email) DO NOTHING;

-- Get the demo seller ID
DO $$
DECLARE
    demo_seller_id UUID;
BEGIN
    SELECT id INTO demo_seller_id FROM public.profiles WHERE email = 'demo@seltech.online';
    
    -- Insert demo products
    INSERT INTO public.products (
        seller_id,
        title,
        slug,
        description,
        short_description,
        category,
        tags,
        price,
        pricing_type,
        status,
        version,
        thumbnail_url,
        preview_images,
        demo_url,
        download_count,
        view_count,
        average_rating,
        review_count,
        is_featured,
        created_at
    ) VALUES 
    (
        demo_seller_id,
        'Seltech Bot v1.0',
        'seltech-bot-v1',
        'This is a demo product for Cryptomus integration review. A powerful automation bot designed for developers and businesses. Features include automated workflows, API integrations, and real-time monitoring capabilities. Perfect for streamlining your development process and increasing productivity.',
        'Demo automation bot for Cryptomus integration review - includes API integrations and workflow automation',
        'bots',
        ARRAY['automation', 'api', 'workflow', 'demo', 'cryptomus'],
        15.99,
        'one_time',
        'approved',
        '1.0.0',
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop'
        ],
        'https://demo.seltech.online/bot-demo',
        127,
        1543,
        4.8,
        23,
        true,
        now()
    ),
    (
        demo_seller_id,
        'Digital Tool Pro',
        'digital-tool-pro',
        'This is a demo product for Cryptomus integration review. Professional digital toolkit for developers including code generators, API testing tools, and deployment utilities. Streamline your development workflow with this comprehensive suite of tools.',
        'Demo digital toolkit for Cryptomus integration review - professional developer tools suite',
        'software',
        ARRAY['tools', 'development', 'api', 'demo', 'cryptomus'],
        29.99,
        'one_time',
        'approved',
        '2.1.0',
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&h=600&fit=crop'
        ],
        'https://demo.seltech.online/tool-demo',
        89,
        892,
        4.6,
        15,
        false,
        now()
    ),
    (
        demo_seller_id,
        'React Template Bundle',
        'react-template-bundle',
        'This is a demo product for Cryptomus integration review. Complete collection of modern React templates including dashboard, landing pages, and e-commerce layouts. Built with TypeScript, Tailwind CSS, and modern best practices.',
        'Demo React templates for Cryptomus integration review - modern TypeScript templates',
        'templates',
        ARRAY['react', 'typescript', 'tailwind', 'demo', 'cryptomus'],
        19.99,
        'one_time',
        'approved',
        '1.5.0',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
        ARRAY[
            'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&h=600&fit=crop'
        ],
        'https://demo.seltech.online/template-demo',
        234,
        2156,
        4.9,
        41,
        true,
        now()
    ) ON CONFLICT (slug) DO NOTHING;
    
END $$;

-- Update product counts for better demo appearance
UPDATE public.products 
SET 
    view_count = view_count + floor(random() * 100 + 50),
    download_count = download_count + floor(random() * 20 + 10)
WHERE seller_id IN (SELECT id FROM public.profiles WHERE email = 'demo@seltech.online');

-- Add some demo reviews
INSERT INTO public.reviews (
    product_id,
    buyer_id,
    order_id,
    rating,
    title,
    content,
    is_verified_purchase,
    created_at
) 
SELECT 
    p.id,
    (SELECT id FROM public.profiles WHERE email = 'demo@seltech.online'),
    gen_random_uuid(),
    5,
    'Great demo product!',
    'This demo product showcases excellent quality for Cryptomus integration review. Highly recommended for testing payment flows.',
    true,
    now() - interval '5 days'
FROM public.products p 
WHERE p.slug IN ('seltech-bot-v1', 'digital-tool-pro', 'react-template-bundle')
ON CONFLICT (product_id, buyer_id) DO NOTHING;

COMMENT ON TABLE public.products IS 'Products table with demo data for Cryptomus inspection';