import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle,
  Wallet,
  ShoppingBag,
  Shield,
  Settings,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  popular?: boolean;
}

interface FAQCategory {
  name: string;
  icon: React.ReactNode;
  color: string;
}

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: Record<string, FAQCategory> = {
    general: { name: 'General', icon: <HelpCircle className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
    buying: { name: 'Buying', icon: <ShoppingBag className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
    selling: { name: 'Selling', icon: <Wallet className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
    account: { name: 'Account', icon: <Users className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' },
    security: { name: 'Security', icon: <Shield className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
    technical: { name: 'Technical', icon: <Settings className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' }
  };

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'What is SelTech Online?',
      answer: 'SelTech Online is a digital marketplace where you can buy and sell digital products like bots, software, templates, and other tech-related items. We provide a secure platform for creators to monetize their digital products and for buyers to find high-quality digital solutions.',
      category: 'general',
      popular: true
    },
    {
      id: '2',
      question: 'How do I create an account?',
      answer: 'Creating an account is simple! Click the "Sign Up" button in the top right corner, enter your email address and create a password. You can also sign up using your Google account for faster registration. After signing up, you\'ll receive a confirmation email to verify your account.',
      category: 'general',
      popular: true
    },
    {
      id: '3',
      question: 'What payment methods do you accept?',
      answer: 'We accept payments through PesaPal including MTN Mobile Money, Airtel Money, Visa/Mastercard, bank transfers, and other international payment cards. This ensures fast, secure, and convenient transactions for customers across Africa and globally.',
      category: 'buying',
      popular: true
    },
    {
      id: '4',
      question: 'How do I download my purchased products?',
      answer: 'After completing your purchase, you\'ll receive an email with download links. You can also access your purchases from your account dashboard under "My Orders". All downloads are available immediately after payment confirmation.',
      category: 'buying',
      popular: true
    },
    {
      id: '5',
      question: 'How do I become a seller?',
      answer: 'To become a seller, first create an account, then click "Become a Seller" in your dashboard. You\'ll need to complete our verification process, which includes providing basic information about yourself and your business. Once approved, you can start uploading and selling your digital products.',
      category: 'selling',
      popular: true
    },
    {
      id: '6',
      question: 'How do I set up my PesaPal payment methods?',
      answer: 'As a seller, you need to configure your PesaPal payment details to receive payments. Go to your seller dashboard, click on "Payment Methods" tab, and add your preferred payout method (mobile money, bank account, etc.). Make sure to verify your details as this is where you\'ll receive your earnings.',
      category: 'selling',
      popular: true
    },
    {
      id: '7',
      question: 'What types of products can I sell?',
      answer: 'You can sell various digital products including Discord bots, Telegram bots, software applications, website templates, UI kits, APIs, plugins, and other digital tools. All products must be original work or properly licensed, and must comply with our content guidelines.',
      category: 'selling'
    },
    {
      id: '8',
      question: 'How much commission do you charge?',
      answer: 'We charge a competitive commission rate on each sale to maintain the platform and provide support services. The exact rate depends on your seller tier and volume. You can view the current commission structure in your seller dashboard.',
      category: 'selling'
    },
    {
      id: '9',
      question: 'When do I get paid?',
      answer: 'Payments are processed automatically to your configured PesaPal payment method after each successful sale. Payments are typically processed within 1-3 business days depending on your chosen payout method (mobile money is faster than bank transfers).',
      category: 'selling'
    },
    {
      id: '10',
      question: 'Is my personal information secure?',
      answer: 'Yes, we take security very seriously. All personal information is encrypted and stored securely. We never share your personal information with third parties without your consent. You can read our full privacy policy for more details.',
      category: 'security',
      popular: true
    },
    {
      id: '11',
      question: 'How do I reset my password?',
      answer: 'If you forgot your password, click "Forgot Password" on the login page. Enter your email address and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.',
      category: 'account'
    },
    {
      id: '12',
      question: 'Can I change my email address?',
      answer: 'Yes, you can change your email address in your account settings. Go to your profile settings, update your email address, and verify the new email through the confirmation link we\'ll send you.',
      category: 'account'
    },
    {
      id: '13',
      question: 'What browsers are supported?',
      answer: 'SelTech Online works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.',
      category: 'technical'
    },
    {
      id: '14',
      question: 'Do you have a mobile app?',
      answer: 'Currently, we don\'t have a dedicated mobile app, but our website is fully responsive and works great on mobile devices. You can access all features through your mobile browser.',
      category: 'technical'
    },
    {
      id: '15',
      question: 'How do I report a problem with a product?',
      answer: 'If you encounter issues with a purchased product, you can contact the seller directly through the product page, or reach out to our support team. We\'ll help mediate any disputes and ensure you get the support you need.',
      category: 'buying'
    },
    {
      id: '16',
      question: 'Can I get a refund?',
      answer: 'Refunds are handled on a case-by-case basis, typically for products that don\'t work as described or are significantly different from their listing. Contact our support team with details about your issue, and we\'ll work to resolve it fairly.',
      category: 'buying'
    },
    {
      id: '17',
      question: 'How do I contact customer support?',
      answer: 'You can contact our support team through the "Contact" page, by email, or through the live chat feature when available. We aim to respond to all inquiries within 24 hours.',
      category: 'general'
    },
    {
      id: '18',
      question: 'Are there any restrictions on what I can sell?',
      answer: 'Yes, we have content guidelines that prohibit illegal content, malicious software, copyrighted material (unless you own the rights), and products that violate our terms of service. Review our seller guidelines for the complete list.',
      category: 'selling'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularFAQs = faqs.filter(faq => faq.popular);

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <HelpCircle className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Find quick answers to the most common questions about SelTech Online
            </p>
            
            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {Object.entries(categories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Popular FAQs */}
        {!searchQuery && selectedCategory === 'all' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Most Popular Questions</h2>
            <div className="space-y-4">
              {popularFAQs.slice(0, 5).map((faq) => (
                <Card key={faq.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                          <Badge className={categories[faq.category].color}>
                            {categories[faq.category].name}
                          </Badge>
                        </div>
                        {openFAQ === faq.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </button>
                    {openFAQ === faq.id && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <p className="text-gray-600 mt-4 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All FAQs */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No FAQs found</h3>
              <p className="text-gray-600">Try adjusting your search or category filter.</p>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <Card key={faq.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                        <Badge className={categories[faq.category].color}>
                          {categories[faq.category].name}
                        </Badge>
                      </div>
                      {openFAQ === faq.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                  {openFAQ === faq.id && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      <p className="text-gray-600 mt-4 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help you with any questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button className="bg-white text-blue-600 hover:bg-gray-100">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </Link>
              <Link to="/help">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Browse Help Center
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}