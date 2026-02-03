import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SmartSellerButton } from '@/components/ui/smart-seller-button';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      {/* Beam-style gradient orbs with subtle pulse */}
      <motion.div
        className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px]"
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/20 blur-[100px]"
        animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="container relative mx-auto px-4 sm:px-6">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={item}
            className="mb-6 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Discover & Sell
            <span className="mt-2 block gradient-text">Developer Tools</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Buy and sell bots, software, templates, and digital assets with <b>PesaPal (MTN, Airtel, Visa, International Cards)</b>.
            Sellers keep 90% of every sale. Already trusted by developers worldwide.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              asChild
              className="group rounded-xl bg-primary px-8 text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-[0_0_28px_hsl(var(--primary)_/_0.35)]"
            >
              <Link to="/marketplace">
                Start with marketplace
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              variant="outline"
              className="group rounded-xl border-accent/60 bg-transparent hover:bg-accent/10 transition-all duration-300 hover:shadow-[0_0_28px_hsl(var(--accent)_/_0.25)]"
            >
              <Link to="/auth?redirect=freelancing">
                Start freelancing
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <SmartSellerButton
              size="lg"
              variant="outline"
              className="rounded-xl border-border/60 bg-transparent hover:bg-muted/50"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Selling
            </SmartSellerButton>
          </motion.div>

          <motion.p
            variants={item}
            className="mt-12 text-sm text-muted-foreground"
          >
            Processing 10,000+ products · <b>PesaPal (MTN, Airtel, Visa, International Cards)</b> · 90% seller share
          </motion.p>

          <motion.div
            variants={container}
            className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4"
          >
            {[
              { value: '1,000+', label: 'Products' },
              { value: '500+', label: 'Sellers' },
              { value: '50K+', label: 'Downloads' },
              { value: '90%', label: 'Seller share' },
            ].map(({ value, label }) => (
              <motion.div
                key={label}
                variants={item}
                className="rounded-xl border border-border/50 bg-card/50 px-4 py-5 backdrop-blur-sm"
              >
                <div className="font-display text-2xl font-bold text-primary sm:text-3xl">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
