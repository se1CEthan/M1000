'use client';

import HeroSection from "@/sections/hero-section";
import FeaturedServices from "@/sections/featured-services";
import HowItWorks from "@/sections/how-it-works";
import TopFreelancers from "@/sections/top-freelancers";
import Categories from "@/sections/categories";
import Testimonials from "@/sections/testimonials";
import CTASection from "@/sections/cta-section";

export default function Page() {
    return (
        <main className="px-6 md:px-16 lg:px-24 xl:px-32">
            <HeroSection />
            <Categories />
            <FeaturedServices />
            <HowItWorks />
            <TopFreelancers />
            <Testimonials />
            <CTASection />
        </main>
    );
}
