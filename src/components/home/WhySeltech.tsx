import { motion } from 'framer-motion';
import { Shield, Zap, Wallet, Users, Code, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Wallet,
    title: 'Crypto Payments',
    description: 'Pay with Bitcoin, Ethereum, and 20+ cryptocurrencies. Fast, secure, and borderless.',
  },
  {
    icon: Shield,
    title: '90% Seller Earnings',
    description: 'Keep 90% of every sale. One of the highest payout rates in the industry.',
  },
  {
    icon: Zap,
    title: 'Instant Delivery',
    description: 'Automated digital delivery. Get your products immediately after payment.',
  },
  {
    icon: Users,
    title: 'Verified Sellers',
    description: 'All sellers are verified. Buy with confidence from trusted developers.',
  },
  {
    icon: Code,
    title: 'Developer First',
    description: 'Built by developers, for developers. We understand your needs.',
  },
  {
    icon: Lock,
    title: 'Secure Platform',
    description: 'Enterprise-grade security. Your data and products are always protected.',
  },
];

export function WhySeltech() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Your marketplace benefits
          </h2>
          <p className="mt-1.5 text-muted-foreground">
            Scale without friction. Crypto payments, instant delivery, 90% seller share.
          </p>
        </motion.div>

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
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
            >
            <Card
              key={index}
              className="group border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
