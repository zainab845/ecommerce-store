import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import CategorySection from '@/components/home/CategorySection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import PremiumCTA from '@/components/home/PremiumCTA';
import RecentlyViewed from '@/components/product/RecentlyViewed';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StatsSection />
      <FeaturedProducts />
      <CategorySection />
      <TestimonialsSection />
      <PremiumCTA />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
  <RecentlyViewed maxDisplay={4} />
</div>
    </main>
  );
}