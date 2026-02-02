import { Link } from 'react-router-dom';
import { Code, Users, Zap, Shield, Globe, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';

export default function About() {
  const features = [
    {
      icon: Code,
      title: 'Developer-First',
      description: 'Built by developers, for developers. We understand your needs and challenges.'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Cryptocurrency payments powered by Cryptomus for maximum security and privacy.'
    },
    {
      icon: Users,
      title: '90% Revenue Share',
      description: 'Keep 90% of your earnings. We believe creators should be rewarded fairly.'
    },
    {
      icon: Zap,
      title: 'Instant Delivery',
      description: 'Digital products delivered instantly via secure download links.'
    },
    {
      icon: Globe,
      title: 'Global Marketplace',
      description: 'Reach customers worldwide with our international platform.'
    },
    {
      icon: Award,
      title: 'Quality Assured',
      description: 'All products are reviewed to ensure high quality and functionality.'
    }
  ];

  const stats = [
    { label: 'Active Sellers', value: '500+' },
    { label: 'Digital Products', value: '1,000+' },
    { label: 'Happy Customers', value: '10,000+' },
    { label: 'Countries Served', value: '50+' }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            About Seltech
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The premier digital marketplace for developers, creators, and tech enthusiasts. 
            Buy and sell bots, software, templates, and digital assets with cryptocurrency payments.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground text-center leading-relaxed">
                To create the world's most trusted and developer-friendly marketplace for digital products. 
                We empower creators to monetize their skills while providing buyers with high-quality, 
                innovative tools and resources.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Seltech?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
            <div className="prose prose-lg prose-neutral dark:prose-invert mx-auto">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Seltech was founded in 2024 with a simple vision: create a marketplace where developers 
                and creators can easily monetize their digital products while buyers can discover 
                high-quality tools and resources.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We noticed that existing platforms often took large commissions, had complex payout 
                systems, or lacked the technical focus that developers needed. That's why we built 
                Seltech with cryptocurrency payments, fair revenue sharing, and a developer-first approach.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, Seltech serves thousands of developers worldwide, facilitating secure transactions 
                and fostering innovation in the digital product space. We're committed to growing our 
                community while maintaining the quality and trust that our users expect.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-3">Transparency</h3>
                <p className="text-muted-foreground">
                  Clear pricing, honest reviews, and transparent processes. No hidden fees or surprises.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                <p className="text-muted-foreground">
                  Embracing new technologies like cryptocurrency payments to improve the user experience.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-3">Community</h3>
                <p className="text-muted-foreground">
                  Building a supportive community where creators and buyers can connect and grow together.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of developers who trust Seltech for their digital product needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/marketplace">Browse Products</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/upgrade-to-seller">Become a Seller</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}