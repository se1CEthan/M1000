import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Building2, Globe, MapPin, Users, 
  Upload, Camera, CheckCircle, Shield, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { BusinessProfileService } from '@/lib/freelancing-service';
import type { BusinessProfileForm } from '@/types/freelancing';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'Marketing',
  'Real Estate', 'Manufacturing', 'Consulting', 'Media & Entertainment',
  'Non-profit', 'Government', 'Automotive', 'Travel & Tourism', 'Food & Beverage',
  'Fashion', 'Sports', 'Energy', 'Agriculture', 'Other'
];

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' }
];

export default function BusinessProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoImagePreview, setLogoImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState<BusinessProfileForm>({
    company_name: '',
    company_description: '',
    industry: '',
    company_size: undefined,
    website_url: '',
    location: '',
    timezone: ''
  });

  const handleInputChange = (field: keyof BusinessProfileForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getProfileCompletionPercentage = () => {
    let completed = 0;
    const total = 8;
    
    if (formData.company_name) completed++;
    if (formData.company_description) completed++;
    if (formData.industry) completed++;
    if (formData.company_size) completed++;
    if (formData.website_url) completed++;
    if (formData.location) completed++;
    if (formData.timezone) completed++;
    if (logoImagePreview) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const profile = await BusinessProfileService.create(formData);
      
      toast({
        title: 'Success!',
        description: 'Your business profile has been created successfully.',
      });
      
      navigate('/business-dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.company_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Company name is required',
        variant: 'destructive'
      });
      return false;
    }
    
    if (!formData.company_description?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Company description is required',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={item} className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/business-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">Complete Your Business Profile</h1>
              <p className="text-muted-foreground mt-2">
                Build trust with freelancers by showcasing your company
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{getProfileCompletionPercentage()}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <motion.div variants={item}>
            <Progress value={getProfileCompletionPercentage()} className="h-2" />
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Tell freelancers about your company and what you do
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Company Logo */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25">
                        {logoImagePreview ? (
                          <img src={logoImagePreview} alt="Company Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">Company Logo</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload your company logo to build brand recognition
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: Square image, at least 200x200px
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      placeholder="e.g., Acme Corporation"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_description">Company Description *</Label>
                    <Textarea
                      id="company_description"
                      placeholder="Describe what your company does, your mission, and what makes you unique..."
                      value={formData.company_description}
                      onChange={(e) => handleInputChange('company_description', e.target.value)}
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.company_description?.length || 0}/500 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_size">Company Size</Label>
                      <Select value={formData.company_size} onValueChange={(value: any) => handleInputChange('company_size', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_SIZES.map((size) => (
                            <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website_url">Company Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website_url"
                        placeholder="https://www.yourcompany.com"
                        value={formData.website_url}
                        onChange={(e) => handleInputChange('website_url', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Company Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="e.g., San Francisco, CA, USA"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC-12:00">UTC-12:00</SelectItem>
                        <SelectItem value="UTC-11:00">UTC-11:00</SelectItem>
                        <SelectItem value="UTC-10:00">UTC-10:00</SelectItem>
                        <SelectItem value="UTC-09:00">UTC-09:00</SelectItem>
                        <SelectItem value="UTC-08:00">UTC-08:00</SelectItem>
                        <SelectItem value="UTC-07:00">UTC-07:00</SelectItem>
                        <SelectItem value="UTC-06:00">UTC-06:00</SelectItem>
                        <SelectItem value="UTC-05:00">UTC-05:00</SelectItem>
                        <SelectItem value="UTC-04:00">UTC-04:00</SelectItem>
                        <SelectItem value="UTC-03:00">UTC-03:00</SelectItem>
                        <SelectItem value="UTC-02:00">UTC-02:00</SelectItem>
                        <SelectItem value="UTC-01:00">UTC-01:00</SelectItem>
                        <SelectItem value="UTC+00:00">UTC+00:00</SelectItem>
                        <SelectItem value="UTC+01:00">UTC+01:00</SelectItem>
                        <SelectItem value="UTC+02:00">UTC+02:00</SelectItem>
                        <SelectItem value="UTC+03:00">UTC+03:00</SelectItem>
                        <SelectItem value="UTC+04:00">UTC+04:00</SelectItem>
                        <SelectItem value="UTC+05:00">UTC+05:00</SelectItem>
                        <SelectItem value="UTC+06:00">UTC+06:00</SelectItem>
                        <SelectItem value="UTC+07:00">UTC+07:00</SelectItem>
                        <SelectItem value="UTC+08:00">UTC+08:00</SelectItem>
                        <SelectItem value="UTC+09:00">UTC+09:00</SelectItem>
                        <SelectItem value="UTC+10:00">UTC+10:00</SelectItem>
                        <SelectItem value="UTC+11:00">UTC+11:00</SelectItem>
                        <SelectItem value="UTC+12:00">UTC+12:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Profile Summary */}
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Profile Summary
                  </CardTitle>
                  <CardDescription>
                    Review your business profile before publishing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Company Name:</span>
                        <p className="font-medium">{formData.company_name || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Industry:</span>
                        <p className="font-medium">{formData.industry || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Company Size:</span>
                        <p className="font-medium">
                          {formData.company_size ? COMPANY_SIZES.find(s => s.value === formData.company_size)?.label : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Website:</span>
                        <p className="font-medium">{formData.website_url || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <p className="font-medium">{formData.location || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Timezone:</span>
                        <p className="font-medium">{formData.timezone || 'Not set'}</p>
                      </div>
                    </div>
                  </div>

                  {formData.company_description && (
                    <div>
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">{formData.company_description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Trust & Security */}
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Trust & Security
                  </CardTitle>
                  <CardDescription>
                    Build trust with freelancers through verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <h4 className="font-medium">Identity Verification</h4>
                      <p className="text-sm text-muted-foreground">Verify your business identity</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Verify Later
                      </Button>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Award className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <h4 className="font-medium">Payment Method</h4>
                      <p className="text-sm text-muted-foreground">Add a payment method</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Add Later
                      </Button>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <h4 className="font-medium">Team Members</h4>
                      <p className="text-sm text-muted-foreground">Invite team members</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Invite Later
                      </Button>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    You can complete these steps later from your dashboard
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={item} className="flex justify-center">
              <Button 
                type="submit" 
                disabled={loading} 
                size="lg"
                className="bg-green-600 hover:bg-green-700 px-8"
              >
                {loading ? 'Creating Profile...' : 'Complete Business Profile'}
                <CheckCircle className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </MainLayout>
  );
}