import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      {/* Beam-style gradient orbs */}
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />

      <div className="container relative mx-auto px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Ready to sell on{' '}
            <span className="gradient-text">Seltech?</span>
          </h2>
          <p className="mx-auto mt-4 mb-10 max-w-xl text-lg text-muted-foreground">
            Create a seller account to list your products. Verified sellers receive 90% of each sale.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="group rounded-xl">
              <Link to="/auth?mode=signup&role=seller">
                Bring your products to Seltech
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-xl">
              <Link to="/upgrade-to-seller">Seller information</Link>
            </Button>
          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            Secure payments · Verified sellers · 90% seller share
          </p>
        </motion.div>
      </div>
    </section>
  );
}
