import { MainLayout } from '@/components/layout/MainLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategorySection } from '@/components/home/CategorySection';
import { WhySeltech } from '@/components/home/WhySeltech';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      <FeaturedProducts />
      <CategorySection />
      <WhySeltech />
      <CTASection />
    </MainLayout>
  );
};

export default Index;
