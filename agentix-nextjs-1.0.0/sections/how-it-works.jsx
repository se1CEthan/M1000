'use client';

import { motion } from 'framer-motion';
import { UserPlus, Search, MessageSquare, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up as a freelancer or business in seconds. Choose your role and complete your profile.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Search,
    title: 'Find or Post Projects',
    description: 'Browse thousands of services or post your project and receive bids from qualified freelancers.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: MessageSquare,
    title: 'Collaborate & Communicate',
    description: 'Use our real-time messaging and video conferencing to discuss project details and requirements.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: CheckCircle,
    title: 'Complete & Get Paid',
    description: 'Deliver quality work, get approved, and receive secure payments via Stripe or crypto.',
    color: 'from-green-500 to-emerald-500',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/10 rounded-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          How <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Seltech Works</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Get started in 4 simple steps
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {/* Connection lines */}
        <div className="hidden lg:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 dark:from-blue-800 dark:via-purple-800 dark:to-green-800" />

        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 mx-auto relative z-10`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-20">
                  {index + 1}
                </div>

                <h3 className="font-bold text-xl mb-3 text-center">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
