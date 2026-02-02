'use client';

import { motion } from 'framer-motion';
import { Star, Heart, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const services = [
  {
    id: 1,
    title: 'Full-Stack Web Application Development',
    seller: 'Sarah Johnson',
    avatar: '/api/placeholder/100/100',
    rating: 4.9,
    reviews: 234,
    price: 2500,
    image: '/api/placeholder/400/300',
    category: 'Web Development',
    trending: true,
  },
  {
    id: 2,
    title: 'Modern UI/UX Design for Mobile Apps',
    seller: 'Michael Chen',
    avatar: '/api/placeholder/100/100',
    rating: 5.0,
    reviews: 189,
    price: 1800,
    image: '/api/placeholder/400/300',
    category: 'UI/UX Design',
    trending: false,
  },
  {
    id: 3,
    title: 'AI-Powered Chatbot Development',
    seller: 'Emma Williams',
    avatar: '/api/placeholder/100/100',
    rating: 4.8,
    reviews: 156,
    price: 3200,
    image: '/api/placeholder/400/300',
    category: 'AI & ML',
    trending: true,
  },
  {
    id: 4,
    title: 'E-commerce Platform with Payment Integration',
    seller: 'David Martinez',
    avatar: '/api/placeholder/100/100',
    rating: 4.9,
    reviews: 298,
    price: 4500,
    image: '/api/placeholder/400/300',
    category: 'Web Development',
    trending: false,
  },
];

export default function FeaturedServices() {
  return (
    <section className="py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Featured <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Services</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Top-rated services from our expert freelancers
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <Link href={`/services/${service.id}`} className="block">
              <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700">
                <div className="relative h-48 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20" />
                  {service.trending && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </div>
                  )}
                  <button className="absolute top-3 left-3 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                    <span className="text-sm font-medium">{service.seller}</span>
                  </div>

                  <h3 className="font-semibold text-lg mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>

                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{service.rating}</span>
                    <span className="text-gray-500 text-sm">({service.reviews})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {service.category}
                    </span>
                    <span className="font-bold text-lg">
                      ${service.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mt-12"
      >
        <Link
          href="/browse"
          className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all"
        >
          View All Services
        </Link>
      </motion.div>
    </section>
  );
}
