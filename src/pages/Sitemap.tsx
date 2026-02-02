import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  ShoppingBag, 
  Bot, 
  Code, 
  FileText, 
  Info, 
  Mail, 
  Shield, 
  FileCheck, 
  LogIn, 
  UserPlus, 
  CheckCircle, 
  HelpCircle,
  BookOpen,
  Zap,
  Users,
  Settings,
  Map
} from 'lucide-react';

interface SitemapSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  links: {
    path: string;
    title: string;
    description: string;
    badge?: string;
  }[];
}

export default function Sitemap() {
  const sitemapSections: SitemapSection[] = [
    {
      title: 'Main Pages',
      description: 'Core pages and marketplace',
      icon: <Home className="h-5 w-5" />,
      links: [
        {
          path: '/',
          title: 'Homepage',
          description: 'Welcome to SelTech Online - Digital marketplace for tech products'
        },
        {
          path: '/marketplace',
          title: 'Marketplace',
          description: 'Browse all digital products and services',
          badge: 'Popular'
        },
        {
          path: '/about',
          title: 'About Us',
          description: 'Learn about SelTech Online and our mission'
        },
        {
          path: '/contact',
          title: 'Contact',
          description: 'Get in touch with our support team'
        }
      ]
    },
    {
      title: 'Product Categories',
      description: 'Browse products by category',
      icon: <ShoppingBag className="h-5 w-5" />,
      links: [
        {
          path: '/bots',
          title: 'Bots & Automation',
          description: 'Discord bots, Telegram bots, and automation tools'
        },
        {
          path: '/software',
          title: 'Software & Applications',
          description: 'Desktop applications, mobile apps, and software tools'
        },
        {
          path: '/templates',
          title: 'Templates & Themes',
          description: 'Website templates, design themes, and UI kits'
        }
      ]
    },
    {
      title: 'User Authentication',
      description: 'Account management and authentication',
      icon: <LogIn className="h-5 w-5" />,
      links: [
        {
          path: '/auth',
          title: 'Sign In / Sign Up',
          description: 'Create an account or sign in to your existing account'
        },
        {
          path: '/upgrade-to-seller',
          title: 'Become a Seller',
          description: 'Start selling your digital products on our platform',
          badge: 'Earn Money'
        },
        {
          path: '/seller-verification',
          title: 'Seller Verification',
          description: 'Complete your seller verification process'
        }
      ]
    },
    {
      title: 'Help & Support',
      description: 'Documentation and support resources',
      icon: <HelpCircle className="h-5 w-5" />,
      links: [
        {
          path: '/help',
          title: 'Help Center',
          description: 'Find answers to common questions and get support'
        },
        {
          path: '/help/crypto-wallet-setup',
          title: 'Crypto Wallet Setup',
          description: 'Step-by-step guide to setting up your crypto wallet',
          badge: 'Important'
        },
        {
          path: '/help/seller-guide',
          title: 'Seller Guide',
          description: 'Complete guide for sellers on how to use the platform'
        },
        {
          path: '/help/buyer-guide',
          title: 'Buyer Guide',
          description: 'How to purchase and download digital products'
        },
        {
          path: '/faq',
          title: 'Frequently Asked Questions',
          description: 'Quick answers to the most common questions'
        }
      ]
    },
    {
      title: 'Legal & Policies',
      description: 'Terms, privacy, and legal information',
      icon: <Shield className="h-5 w-5" />,
      links: [
        {
          path: '/privacy',
          title: 'Privacy Policy',
          description: 'How we collect, use, and protect your personal information'
        },
        {
          path: '/terms',
          title: 'Terms of Service',
          description: 'Terms and conditions for using SelTech Online'
        }
      ]
    },
    {
      title: 'Developer Resources',
      description: 'API documentation and developer tools',
      icon: <Code className="h-5 w-5" />,
      links: [
        {
          path: '/api-docs',
          title: 'API Documentation',
          description: 'Complete API reference for developers'
        },
        {
          path: '/blog',
          title: 'Developer Blog',
          description: 'Latest updates, tutorials, and developer news'
        }
      ]
    }
  ];

  const getBadgeColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'popular':
        return 'bg-blue-100 text-blue-800';
      case 'earn money':
        return 'bg-green-100 text-green-800';
      case 'important':
        return 'bg-orange-100 text-orange-800';
      case 'new':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Map className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Site Map</h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Navigate through all pages and sections of SelTech Online. 
              Find exactly what you're looking for with our comprehensive site directory.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {sitemapSections.map((section, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {section.icon}
                  </div>
                  {section.title}
                </CardTitle>
                <p className="text-gray-600">{section.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.links.map((link, linkIndex) => (
                    <div key={linkIndex} className="group">
                      <Link
                        to={link.path}
                        className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                                {link.title}
                              </h3>
                              {link.badge && (
                                <Badge className={`text-xs ${getBadgeColor(link.badge)}`}>
                                  {link.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{link.description}</p>
                            <p className="text-xs text-blue-600 mt-1 font-mono">
                              {window.location.origin}{link.path}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information */}
        <div className="mt-12 bg-blue-50 rounded-xl p-8">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help Finding Something?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you navigate 
              the platform and find exactly what you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Link>
              <Link
                to="/help"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Visit Help Center
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">20+ Pages</h3>
            <p className="text-sm text-gray-600">Comprehensive platform coverage</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">User-Friendly</h3>
            <p className="text-sm text-gray-600">Easy navigation and discovery</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Always Updated</h3>
            <p className="text-sm text-gray-600">Current and accurate links</p>
          </div>
        </div>
      </div>
    </div>
  );
}