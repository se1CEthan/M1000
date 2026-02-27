import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie, Settings, BarChart, Target, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Cookie className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Cookie Policy</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn about how we use cookies and similar technologies to improve your experience on SelTech Online.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          {/* What Are Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Cookie className="h-5 w-5 text-blue-600" />
                What Are Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Cookies are small text files that are stored on your device when you visit a website. They help websites 
                remember information about your visit, such as your preferred language and other settings, which can make 
                your next visit easier and the site more useful to you.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Cookies do not contain any information that personally identifies you, but personal 
                  information that we store about you may be linked to the information stored in and obtained from cookies.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Types of Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Types of Cookies We Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Essential Cookies */}
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Essential Cookies</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Required</span>
                </div>
                <p className="text-gray-600 mb-2">
                  These cookies are necessary for the website to function properly and cannot be disabled.
                </p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Authentication and login status</li>
                  <li>Shopping cart contents</li>
                  <li>Security and fraud prevention</li>
                  <li>Basic site functionality</li>
                </ul>
              </div>

              {/* Analytics Cookies */}
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Analytics Cookies</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Optional</span>
                </div>
                <p className="text-gray-600 mb-2">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Page views and user behavior</li>
                  <li>Traffic sources and referrals</li>
                  <li>Site performance metrics</li>
                  <li>Error tracking and debugging</li>
                </ul>
              </div>

              {/* Functional Cookies */}
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Functional Cookies</h3>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Optional</span>
                </div>
                <p className="text-gray-600 mb-2">
                  These cookies enable enhanced functionality and personalization, such as remembering your preferences.
                </p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Language and region preferences</li>
                  <li>Theme and display settings</li>
                  <li>Recently viewed products</li>
                  <li>Customized user interface</li>
                </ul>
              </div>

              {/* Advertising Cookies */}
              <div className="border-l-4 border-orange-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Advertising Cookies</h3>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Optional</span>
                </div>
                <p className="text-gray-600 mb-2">
                  These cookies are used to deliver advertisements that are relevant to you and your interests.
                </p>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Personalized ad content</li>
                  <li>Ad performance measurement</li>
                  <li>Frequency capping</li>
                  <li>Cross-site tracking prevention</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Cookies and Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We use various third-party services that may set their own cookies. These services help us provide 
                better functionality and analyze our website performance.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Google Analytics</h4>
                  <p className="text-sm text-gray-600">
                    Helps us understand website usage and improve user experience.
                  </p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Google AdSense</h4>
                  <p className="text-sm text-gray-600">
                    Delivers relevant advertisements and measures ad performance.
                  </p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Supabase</h4>
                  <p className="text-sm text-gray-600">
                    Provides authentication and database services for our platform.
                  </p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Cryptomus</h4>
                  <p className="text-sm text-gray-600">
                    Handles cryptocurrency payment processing with Bitcoin, Ethereum, USDT, and other cryptocurrencies.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Managing Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Managing Your Cookie Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Browser Settings</h3>
                <p className="text-gray-600 mb-4">
                  You can control and manage cookies through your browser settings. Most browsers allow you to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>View what cookies are stored on your device</li>
                  <li>Delete cookies individually or all at once</li>
                  <li>Block cookies from specific sites</li>
                  <li>Block third-party cookies</li>
                  <li>Block all cookies (not recommended)</li>
                </ul>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-amber-800 text-sm">
                  <strong>Important:</strong> Disabling certain cookies may affect the functionality of our website. 
                  Essential cookies cannot be disabled as they are necessary for basic site operation.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Cookie Consent</h3>
                <p className="text-gray-600 mb-4">
                  When you first visit our website, you'll see a cookie consent banner. You can:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Accept all cookies for the best experience</li>
                  <li>Customize your preferences by cookie type</li>
                  <li>Reject non-essential cookies</li>
                  <li>Change your preferences at any time</li>
                </ul>
              </div>

              <div className="flex gap-4 pt-4">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Manage Cookie Preferences
                </Button>
                <Button variant="outline">
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Browser-Specific Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Browser-Specific Cookie Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Google Chrome</h4>
                  <p className="text-sm text-gray-600 mb-2">Settings → Privacy and Security → Cookies and other site data</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mozilla Firefox</h4>
                  <p className="text-sm text-gray-600 mb-2">Options → Privacy & Security → Cookies and Site Data</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Safari</h4>
                  <p className="text-sm text-gray-600 mb-2">Preferences → Privacy → Manage Website Data</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Microsoft Edge</h4>
                  <p className="text-sm text-gray-600 mb-2">Settings → Cookies and site permissions → Cookies and site data</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Updates to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Updates to This Cookie Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We may update this cookie policy from time to time to reflect changes in our practices or for other 
                operational, legal, or regulatory reasons. We will notify you of any material changes by posting the 
                updated policy on our website and updating the "Last updated" date.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                If you have any questions about our use of cookies or this cookie policy, please contact us:
              </p>
              
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> privacy@seltech.online</p>
                <p><strong>Support:</strong> support@seltech.online</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}