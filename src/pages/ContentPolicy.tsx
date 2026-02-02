import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Ban, Eye, Flag, Users } from 'lucide-react';

export default function ContentPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Content Policy</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our content guidelines ensure a safe, legal, and high-quality marketplace for all users.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Content Policy Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                SelTech Online is committed to maintaining a safe, legal, and trustworthy marketplace. All content, 
                including product listings, descriptions, images, and user communications, must comply with our content 
                policy, applicable laws, and platform guidelines.
              </p>
            </CardContent>
          </Card>

          {/* Prohibited Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Ban className="h-5 w-5 text-red-600" />
                Prohibited Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Illegal Content</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Content that violates any applicable laws or regulations</li>
                  <li>Pirated software, cracked applications, or unauthorized copies</li>
                  <li>Content that infringes on intellectual property rights</li>
                  <li>Stolen or fraudulently obtained digital assets</li>
                  <li>Content that facilitates illegal activities</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Harmful or Malicious Content</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Malware, viruses, trojans, or other malicious software</li>
                  <li>Hacking tools, exploits, or vulnerability scanners</li>
                  <li>Phishing tools or social engineering software</li>
                  <li>Cryptocurrency miners or resource hijacking tools</li>
                  <li>Content designed to harm users or their devices</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Adult and Inappropriate Content</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Sexually explicit content or adult material</li>
                  <li>Content promoting violence or self-harm</li>
                  <li>Hate speech or discriminatory content</li>
                  <li>Content targeting minors inappropriately</li>
                  <li>Graphic or disturbing imagery</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Fraudulent or Deceptive Content</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>False or misleading product descriptions</li>
                  <li>Fake reviews or manipulated ratings</li>
                  <li>Impersonation of other brands or individuals</li>
                  <li>Pyramid schemes or get-rich-quick scams</li>
                  <li>Content that misrepresents functionality or features</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Spam and Low-Quality Content</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Duplicate or repetitive listings</li>
                  <li>Auto-generated or low-effort content</li>
                  <li>Excessive promotional material</li>
                  <li>Content with no clear value proposition</li>
                  <li>Broken or non-functional products</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Content Standards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-600" />
                Content Quality Standards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Product Listings</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Clear, accurate, and detailed product descriptions</li>
                  <li>High-quality screenshots and demonstration materials</li>
                  <li>Proper categorization and tagging</li>
                  <li>Transparent pricing and licensing information</li>
                  <li>Working download links and installation instructions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">User Communications</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Professional and respectful language</li>
                  <li>Constructive feedback and reviews</li>
                  <li>No harassment or abusive behavior</li>
                  <li>Relevant and helpful support responses</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Intellectual Property</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Original work or properly licensed content</li>
                  <li>Clear ownership or usage rights</li>
                  <li>Proper attribution when required</li>
                  <li>Respect for trademarks and copyrights</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Age-Appropriate Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-600" />
                Age-Appropriate Content Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Our platform serves users of various ages. All content must be appropriate for a general audience:
              </p>
              
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>No content specifically targeting children under 13</li>
                <li>Educational and professional content is encouraged</li>
                <li>Gaming content must be rated appropriately</li>
                <li>Business and productivity tools should be clearly described</li>
                <li>Any age restrictions must be clearly stated</li>
              </ul>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> We comply with COPPA (Children's Online Privacy Protection Act) and similar 
                  international regulations regarding children's privacy and safety online.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reporting and Enforcement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Flag className="h-5 w-5 text-orange-600" />
                Reporting and Enforcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How to Report Violations</h3>
                <p className="text-gray-600 mb-2">
                  If you encounter content that violates our policy, please report it immediately:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Use the "Report" button on product pages</li>
                  <li>Contact our support team at <strong>abuse@seltech.online</strong></li>
                  <li>Provide detailed information about the violation</li>
                  <li>Include screenshots or evidence when possible</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Enforcement Actions</h3>
                <p className="text-gray-600 mb-2">
                  Violations of our content policy may result in:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Content removal or modification requirements</li>
                  <li>Account warnings or restrictions</li>
                  <li>Temporary or permanent account suspension</li>
                  <li>Removal from seller program</li>
                  <li>Legal action when appropriate</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Appeals Process</h3>
                <p className="text-gray-600">
                  If you believe your content was incorrectly flagged or removed, you can appeal the decision by 
                  contacting our support team with detailed information about your case.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content Review Process */}
          <Card>
            <CardHeader>
              <CardTitle>Content Review Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Automated Screening</h3>
                <p className="text-gray-600">
                  We use automated systems to detect potentially harmful content, including malware scanning, 
                  content analysis, and pattern recognition to identify policy violations.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Human Review</h3>
                <p className="text-gray-600">
                  Our content moderation team manually reviews flagged content, appeals, and conducts regular 
                  audits to ensure policy compliance and maintain platform quality.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Community Reporting</h3>
                <p className="text-gray-600">
                  We rely on our community to help identify policy violations. User reports are investigated 
                  promptly and appropriate action is taken when violations are confirmed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Policy Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                This content policy may be updated periodically to address new challenges, legal requirements, 
                or platform changes. Users will be notified of significant policy changes via email and platform 
                notifications. Continued use of the platform constitutes acceptance of updated policies.
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
                For questions about our content policy or to report violations:
              </p>
              
              <div className="space-y-2 text-gray-600">
                <p><strong>Content Policy Questions:</strong> policy@seltech.online</p>
                <p><strong>Report Violations:</strong> abuse@seltech.online</p>
                <p><strong>General Support:</strong> support@seltech.online</p>
                <p><strong>Legal Inquiries:</strong> legal@seltech.online</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}