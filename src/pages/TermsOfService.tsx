import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Scale, AlertTriangle, Shield, DollarSign, Users } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Scale className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Please read these terms carefully before using our platform.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                By accessing and using SelTech Online ("the Platform"), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          {/* Platform Description */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                SelTech Online is a digital marketplace that connects buyers and sellers of digital products including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Software applications and tools</li>
                <li>Discord and Telegram bots</li>
                <li>Website templates and themes</li>
                <li>Digital assets and resources</li>
                <li>APIs and plugins</li>
                <li>Other digital products and services</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                User Accounts and Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Requirements</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>You must be at least 13 years old to create an account</li>
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>One person may not maintain multiple accounts</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Responsibilities</h3>
                <p className="text-gray-600">
                  You are responsible for all activities that occur under your account. You must notify us immediately 
                  of any unauthorized use of your account or any other breach of security.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seller Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Seller Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Seller Eligibility</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Must complete seller verification process</li>
                  <li>Must provide valid PesaPal payment method details</li>
                  <li>Must comply with all applicable laws and regulations</li>
                  <li>Must own or have rights to sell listed products</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Product Guidelines</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Products must be original or properly licensed</li>
                  <li>Accurate descriptions and screenshots required</li>
                  <li>No malicious, illegal, or harmful content</li>
                  <li>Must provide adequate customer support</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Commission and Payments</h3>
                <p className="text-gray-600">
                  SelTech Online charges a commission on each sale. Payments are processed automatically to your 
                  configured PesaPal payment method after successful transactions, subject to our payment terms.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Buyer Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Purchase Terms</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>All sales are final unless otherwise specified</li>
                  <li>You receive a license to use, not ownership of products</li>
                  <li>Products are provided "as is" without warranty</li>
                  <li>Support is provided by individual sellers</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment and Delivery</h3>
                <p className="text-gray-600">
                  Payments are processed through PesaPal (MTN, Airtel, Visa, Bank and International Cards). Digital products are delivered immediately 
                  after payment confirmation via download links or email.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Prohibited Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Prohibited Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">The following activities are strictly prohibited:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Selling or distributing malicious software or viruses</li>
                <li>Infringing on intellectual property rights</li>
                <li>Engaging in fraudulent or deceptive practices</li>
                <li>Harassing or threatening other users</li>
                <li>Attempting to circumvent platform security measures</li>
                <li>Creating fake accounts or reviews</li>
                <li>Selling illegal or regulated products</li>
                <li>Spamming or unsolicited marketing</li>
              </ul>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Platform Content</h3>
                <p className="text-gray-600">
                  The SelTech Online platform, including its design, features, and content, is owned by us and 
                  protected by intellectual property laws. You may not copy, modify, or distribute our platform content.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">User Content</h3>
                <p className="text-gray-600">
                  You retain ownership of content you upload, but grant us a license to use, display, and distribute 
                  it on our platform. You represent that you have the right to grant this license.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                Privacy and Data Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Your privacy is important to us. Our collection and use of personal information is governed by our 
                Privacy Policy, which is incorporated into these terms by reference. By using our platform, you 
                consent to the collection and use of information as described in our Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle>Disclaimers and Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Platform Availability</h3>
                <p className="text-gray-600">
                  We strive to maintain platform availability but do not guarantee uninterrupted service. 
                  We may suspend or terminate services for maintenance, updates, or other reasons.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Third-Party Content</h3>
                <p className="text-gray-600">
                  We are not responsible for the quality, accuracy, or legality of products sold by third-party sellers. 
                  Disputes should be resolved directly with sellers, though we may assist in mediation.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
                <p className="text-gray-600">
                  To the maximum extent permitted by law, SelTech Online shall not be liable for any indirect, 
                  incidental, special, or consequential damages arising from your use of the platform.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>Account Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                We reserve the right to suspend or terminate accounts that violate these terms. You may also 
                terminate your account at any time through your account settings.
              </p>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-800 text-sm">
                  <strong>Note:</strong> Termination does not affect existing transactions or obligations. 
                  Certain provisions of these terms survive termination.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle>Governing Law and Disputes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                These terms are governed by the laws of [Your Jurisdiction]. Any disputes arising from these terms 
                or your use of the platform will be resolved through binding arbitration or in the courts of [Your Jurisdiction].
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We may update these terms from time to time. We will notify users of significant changes via email 
                or platform notifications. Continued use of the platform after changes constitutes acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                If you have questions about these terms, please contact us:
              </p>
              
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> legal@seltech.online</p>
                <p><strong>Support:</strong> support@seltech.online</p>
                <p><strong>Address:</strong> [Your Business Address]</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}