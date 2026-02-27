import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, Globe, Mail } from 'lucide-react';

export default function Privacy() {
  const sections = [
    {
      icon: Database,
      title: 'Information We Collect',
      content: [
        'Account information (email, name, profile details)',
        'Payment information processed securely through Cryptomus',
        'Product usage and download history',
        'Communication preferences and support interactions',
        'Technical information (IP address, browser type, device information)'
      ]
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: [
        'Provide and maintain our marketplace services',
        'Process transactions and deliver digital products',
        'Communicate with you about your account and purchases',
        'Improve our platform and user experience',
        'Comply with legal obligations and prevent fraud'
      ]
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: [
        'All payment processing is handled by Cryptomus with industry-standard encryption',
        'We use secure HTTPS connections for all data transmission',
        'Regular security audits and monitoring',
        'Limited access to personal data on a need-to-know basis',
        'Secure data storage with regular backups'
      ]
    },
    {
      icon: Globe,
      title: 'Data Sharing',
      content: [
        'We do not sell your personal information to third parties',
        'Payment data is processed by Cryptomus (our cryptocurrency payment processor)',
        'We may share data when required by law or to protect our rights',
        'Anonymous usage statistics may be shared for analytics purposes',
        'Seller information is displayed publicly on product pages'
      ]
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: January 20, 2025
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <p className="text-muted-foreground leading-relaxed">
              Seltech ("we," "our," or "us") operates the Seltech digital marketplace platform. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you visit our website and use our services. We are committed to protecting your privacy 
              and ensuring the security of your personal information.
            </p>
          </CardContent>
        </Card>

        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Sections */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">You have the right to:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Access & Portability</h4>
                  <p className="text-sm text-muted-foreground">
                    Request a copy of your personal data and download your information.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Correction</h4>
                  <p className="text-sm text-muted-foreground">
                    Update or correct inaccurate personal information.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Deletion</h4>
                  <p className="text-sm text-muted-foreground">
                    Request deletion of your personal data (subject to legal requirements).
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Opt-out</h4>
                  <p className="text-sm text-muted-foreground">
                    Unsubscribe from marketing communications at any time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Essential cookies for website functionality and security
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Analytics cookies to understand how you use our platform
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Preference cookies to remember your settings
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We retain your personal information only as long as necessary to provide our services 
                and comply with legal obligations. Account data is typically retained for the duration 
                of your account plus 7 years for legal and tax purposes. You can request earlier 
                deletion by contacting our support team.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>International Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Seltech operates globally and may transfer your data to countries outside your residence. 
                We ensure appropriate safeguards are in place to protect your information during 
                international transfers, including using secure cloud providers and encryption.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or want to exercise your rights, contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> privacy@seltech.online</p>
                <p><strong>Support:</strong> support@seltech.online</p>
                <p><strong>Response Time:</strong> Within 30 days</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                This Privacy Policy may be updated periodically. We will notify you of significant changes 
                via email or platform notifications. Continued use of our services after changes constitutes 
                acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}