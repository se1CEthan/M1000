'use client';

import { motion } from 'framer-motion';
import { Code, Smartphone, Palette, Brain, Database, Video, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

const categories = [
  { name: 'Web Development', icon: Code, color: 'from-blue-500 to-cyan-500', count: '2.5k+' },
  { name: 'Mobile Apps', icon: Smartphone, color: 'from-purple-500 to-pink-500', count: '1.8k+' },
  { name: 'UI/UX Design', icon: Palette, color: 'from-orange-500 to-red-500', count: '3.2k+' },
  { name: 'AI & Machine Learning', icon: Brain, color: 'from-green-500 to-emerald-500', count: '950+' },
  { name: 'Database & Backend', icon: Database, color: 'from-indigo-500 to-blue-500', count: '1.5k+' },
  { name: 'Video & Animation', icon: Video, color: 'from-pink-500 to-rose-500', count: '1.2k+' },
  { name: 'Cybersecurity', icon: Shield, color: 'from-red-500 to-orange-500', count: '680+' },
  { name: 'DevOps & Cloud', icon: Zap, color: 'from-yellow-500 to-orange-500', count: '890+' },
];

export default function Categories() {
  return (
    <section className="py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Explore by <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Category</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Find the perfect service for your project
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category, index) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/browse?category=${category.name}`}
                className="block p-6 bg-white dark:bg-gray-800 rounded-2xl hover:shadow-xl transition-all group border border-gray-100 dark:border-gray-700"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {category.count} services
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
