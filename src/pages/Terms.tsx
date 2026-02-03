import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, CreditCard, Users, AlertTriangle, Mail } from 'lucide-react';

export default function Terms() {
  const sections = [
    {
      icon: Users,
      title: 'User Accounts',
      content: [
        'You must be 18 years or older to create an account',
        'Provide accurate and complete information during registration',
        'Maintain the security of your account credentials',
        'You are responsible for all activities under your account',
        'One account per person or business entity'
      ]
    },
    {
      icon: CreditCard,
      title: 'Payments & Transactions',
      content: [
        'All payments are processed securely through PesaPal',
        'PesaPal payments (MTN, Airtel, Visa, Bank and International Cards) are secure and reliable',
        'Prices are displayed in USD with KES equivalent for PesaPal',
        'Platform fee: 10% of each transaction (seller keeps 90%)',
        'Refunds available within 7 days for defective products'
      ]
    },
    {
      icon: Shield,
      title: 'Digital Product Delivery',
      content: [
        'All digital products are delivered via secure download links',
        'Download links expire after 30 days for security',
        'Products are delivered instantly after payment confirmation',
        'Backup downloads available through your account dashboard',
        'Products are licensed for single-user use unless specified'
      ]
    },
    {
      icon: AlertTriangle,
      title: 'Prohibited Activities',
      content: [
        'Uploading malicious software, viruses, or harmful code',
        'Selling copyrighted material without proper authorization',
        'Creating fake accounts or manipulating reviews',
        'Attempting to circumvent payment systems',
        'Harassment or inappropriate behavior toward other users'
      ]
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Please read these terms carefully before using our platform. By using Seltech, you agree to these terms.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: January 20, 2025
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Seltech, a digital marketplace for developers and creators. These Terms of Service 
              ("Terms") govern your use of our platform and services. By accessing or using Seltech, you 
              agree to be bound by these Terms. If you disagree with any part of these terms, you may not 
              access our service.
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

        {/* Additional Terms */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seller Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">As a seller on Seltech, you agree to:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Product Quality</h4>
                  <p className="text-sm text-muted-foreground">
                    Ensure all products work as described and are free from malware or harmful code.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Accurate Descriptions</h4>
                  <p className="text-sm text-muted-foreground">
                    Provide honest, detailed descriptions and accurate screenshots or demos.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Customer Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Respond to customer inquiries and provide reasonable support for your products.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Legal Compliance</h4>
                  <p className="text-sm text-muted-foreground">
                    Ensure you have the right to sell all products and comply with applicable laws.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buyer Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">As a buyer on Seltech, you agree to:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Use purchased products in accordance with their license terms
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Not redistribute or resell products without explicit permission
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Provide honest reviews and feedback
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Report any issues or defects promptly
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Sellers retain ownership of their intellectual property. By uploading content to Seltech, 
                sellers grant us a limited license to display, distribute, and promote their products on our platform.
              </p>
              <p className="text-muted-foreground">
                Buyers receive a license to use purchased products according to the terms specified by the seller. 
                This typically includes personal or commercial use rights but excludes redistribution.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Refunds & Disputes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Refund Policy</h4>
                  <p className="text-sm text-muted-foreground">
                    Refunds are available within 7 days of purchase if the product is defective, 
                    doesn't work as described, or is significantly different from what was advertised.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Dispute Resolution</h4>
                  <p className="text-sm text-muted-foreground">
                    We encourage direct communication between buyers and sellers. If issues cannot be 
                    resolved, our support team will mediate disputes fairly and impartially.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                While we strive for 99.9% uptime, Seltech is provided "as is" without warranties. 
                We may temporarily suspend service for maintenance, updates, or technical issues. 
                We are not liable for any losses resulting from service interruptions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Seltech's liability is limited to the amount paid for the specific transaction in question. 
                We are not liable for indirect, incidental, or consequential damages. This limitation 
                applies to the fullest extent permitted by law.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We may terminate or suspend accounts that violate these Terms. Users may close their 
                accounts at any time. Upon termination:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Access to the platform will be revoked
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Previously purchased products remain accessible for 30 days
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  Seller earnings will be paid out according to our payment schedule
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Questions about these Terms? Contact our legal team:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> legal@seltech.online</p>
                <p><strong>Support:</strong> support@seltech.online</p>
                <p><strong>Business:</strong> business@seltech.online</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                These Terms of Service may be updated periodically. We will notify users of significant 
                changes via email or platform notifications. Continued use after changes constitutes 
                acceptance of the updated terms.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}