import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Search, 
  Wallet, 
  ShoppingBag, 
  UserPlus, 
  Settings, 
  Shield, 
  MessageCircle,
  BookOpen,
  Video,
  FileText,
  Zap,
  Users,
  Star
} from 'lucide-react';
import { useState } from 'react';

interface HelpCategory {
  title: string;
  description: string;
  icon: React.ReactNode;
  articles: {
    title: string;
    description: string;
    path: string;
    badge?: string;
    popular?: boolean;
  }[];
}

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories: HelpCategory[] = [
    {
      title: 'Getting Started',
      description: 'New to SelTech Online? Start here',
      icon: <Zap className="h-5 w-5" />,
      articles: [
        {
          title: 'How to Create an Account',
          description: 'Step-by-step guide to signing up and getting started',
          path: '/help/create-account',
          popular: true
        },
        {
          title: 'Platform Overview',
          description: 'Understanding the SelTech Online marketplace',
          path: '/help/platform-overview'
        },
        {
          title: 'First Purchase Guide',
          description: 'How to make your first purchase safely',
          path: '/help/first-purchase',
          popular: true
        }
      ]
    },
    {
      title: 'Buying Products',
      description: 'Everything about purchasing digital products',
      icon: <ShoppingBag className="h-5 w-5" />,
      articles: [
        {
          title: 'Buyer Guide',
          description: 'Complete guide for purchasing digital products',
          path: '/help/buyer-guide',
          badge: 'Essential'
        },
        {
          title: 'Payment Methods',
          description: 'Supported payment methods and how to use them',
          path: '/help/payment-methods'
        },
        {
          title: 'Download & Access Products',
          description: 'How to download and access your purchased products',
          path: '/help/download-products',
          popular: true
        },
        {
          title: 'Refunds & Returns',
          description: 'Understanding our refund policy and process',
          path: '/help/refunds'
        }
      ]
    },
    {
      title: 'Selling Products',
      description: 'Start selling your digital products',
      icon: <UserPlus className="h-5 w-5" />,
      articles: [
        {
          title: 'Seller Guide',
          description: 'Complete guide for sellers on the platform',
          path: '/help/seller-guide',
          badge: 'Essential'
        },
        {
          title: 'PesaPal Payment Setup',
          description: 'How to set up your PesaPal payment methods',
          path: '/help/pesapal-payment-setup',
          badge: 'Required',
          popular: true
        },
        {
          title: 'Product Upload Guidelines',
          description: 'Best practices for uploading and listing products',
          path: '/help/product-upload'
        },
        {
          title: 'Seller Verification Process',
          description: 'How to get verified as a seller',
          path: '/help/seller-verification'
        },
        {
          title: 'Payout System',
          description: 'Understanding how and when you get paid',
          path: '/help/payout-system'
        }
      ]
    },
    {
      title: 'Account & Security',
      description: 'Manage your account and stay secure',
      icon: <Shield className="h-5 w-5" />,
      articles: [
        {
          title: 'Account Settings',
          description: 'How to manage your account settings and preferences',
          path: '/help/account-settings'
        },
        {
          title: 'Security Best Practices',
          description: 'Keep your account safe and secure',
          path: '/help/security'
        },
        {
          title: 'Two-Factor Authentication',
          description: 'Enable 2FA for enhanced account security',
          path: '/help/2fa'
        },
        {
          title: 'Password Reset',
          description: 'How to reset your password if you forgot it',
          path: '/help/password-reset'
        }
      ]
    },
    {
      title: 'Technical Support',
      description: 'Technical issues and troubleshooting',
      icon: <Settings className="h-5 w-5" />,
      articles: [
        {
          title: 'Common Issues & Solutions',
          description: 'Quick fixes for the most common problems',
          path: '/help/common-issues',
          popular: true
        },
        {
          title: 'Browser Compatibility',
          description: 'Supported browsers and compatibility issues',
          path: '/help/browser-compatibility'
        },
        {
          title: 'Mobile App Guide',
          description: 'Using SelTech Online on mobile devices',
          path: '/help/mobile-app'
        },
        {
          title: 'API Documentation',
          description: 'Developer resources and API reference',
          path: '/api-docs'
        }
      ]
    }
  ];

  const popularArticles = helpCategories
    .flatMap(category => category.articles)
    .filter(article => article.popular)
    .slice(0, 6);

  const filteredCategories = helpCategories.map(category => ({
    ...category,
    articles: category.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.articles.length > 0);

  const getBadgeColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'essential':
        return 'bg-blue-100 text-blue-800';
      case 'required':
        return 'bg-red-100 text-red-800';
      case 'new':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <HelpCircle className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Help Center</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Find answers to your questions and get the help you need to make the most of SelTech Online
            </p>
            
            {/* Search */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Popular Articles */}
        {!searchQuery && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">Popular Articles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularArticles.map((article, index) => (
                <Link key={index} to={article.path}>
                  <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2">
                          {article.title}
                        </h3>
                        <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-3">{article.description}</p>
                      {article.badge && (
                        <Badge className={`mt-3 text-xs ${getBadgeColor(article.badge)}`}>
                          {article.badge}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Help Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {category.icon}
                  </div>
                  {category.title}
                </CardTitle>
                <p className="text-gray-600">{category.description}</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.articles.map((article, articleIndex) => (
                    <Link key={articleIndex} to={article.path}>
                      <div className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                                {article.title}
                              </h3>
                              {article.popular && (
                                <Star className="h-3 w-3 text-yellow-500" />
                              )}
                              {article.badge && (
                                <Badge className={`text-xs ${getBadgeColor(article.badge)}`}>
                                  {article.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{article.description}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is available 24/7 to help you with any questions or issues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button className="bg-white text-blue-600 hover:bg-gray-100">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </Link>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <Video className="h-4 w-4 mr-2" />
                Schedule a Call
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}