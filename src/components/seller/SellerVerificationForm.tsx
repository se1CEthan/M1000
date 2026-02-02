import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/clients';

const verificationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  phone_number: z.string().min(10, 'Valid phone number is required'),
  address_line1: z.string().min(5, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  postal_code: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  business_type: z.enum(['individual', 'business', 'company']),
  business_name: z.string().optional(),
  business_registration: z.string().optional(),
  tax_id: z.string().optional(),
  selling_reason: z.string().min(50, 'Please provide at least 50 characters explaining why you want to sell'),
  expected_monthly_sales: z.number().min(0, 'Expected sales must be positive'),
  terms_accepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  commission_rate_accepted: z.boolean().refine(val => val === true, 'You must accept the commission rate'),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface SellerVerificationFormProps {
  onSuccess: () => void;
}

export function SellerVerificationForm({ onSuccess }: SellerVerificationFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      business_type: 'individual',
      expected_monthly_sales: 0,
      terms_accepted: false,
      commission_rate_accepted: false,
    },
  });

  const businessType = watch('business_type');

  const categories = [
    'Bots', 'Software', 'Templates', 'Assets', 'APIs', 'Plugins', 'Scripts', 'Tools'
  ];

  const addCategory = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const removeCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category));
  };

  const onSubmit = async (data: VerificationFormData) => {
    if (!profile) return;

    if (selectedCategories.length === 0) {
      toast({
        title: 'Categories Required',
        description: 'Please select at least one product category',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create verification application
      const { error } = await supabase.from('seller_verification_applications').insert({
        user_id: profile.user_id, // Use profile.user_id instead of profile.id
        full_name: data.full_name,
        date_of_birth: data.date_of_birth,
        phone_number: data.phone_number,
        address: {
          line1: data.address_line1,
          line2: data.address_line2 || '',
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country,
        },
        business_type: data.business_type,
        business_name: data.business_name || null,
        business_registration: data.business_registration || null,
        tax_id: data.tax_id || null,
        selling_reason: data.selling_reason,
        product_categories: selectedCategories.map(c => c.toLowerCase()),
        expected_monthly_sales: data.expected_monthly_sales,
        terms_accepted: data.terms_accepted,
        terms_version: '1.0',
        commission_rate_accepted: data.commission_rate_accepted,
        status: 'pending',
      });

      if (error) throw error;

      // Update profile verification status
      await supabase
        .from('profiles')
        .update({
          verification_status: 'under_review',
          verification_submitted_at: new Date().toISOString(),
        })
        .eq('user_id', profile.user_id);

      onSuccess();
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      toast({
        title: 'Submission failed',
        description: error.message || 'Failed to submit verification application',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Provide your personal details for verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Legal Name *</Label>
              <Input
                id="full_name"
                {...register('full_name')}
                placeholder="John Doe"
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
              />
              {errors.date_of_birth && (
                <p className="text-sm text-destructive">{errors.date_of_birth.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input
              id="phone_number"
              {...register('phone_number')}
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone_number && (
              <p className="text-sm text-destructive">{errors.phone_number.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
          <CardDescription>
            Your current residential or business address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line1">Address Line 1 *</Label>
            <Input
              id="address_line1"
              {...register('address_line1')}
              placeholder="123 Main Street"
            />
            {errors.address_line1 && (
              <p className="text-sm text-destructive">{errors.address_line1.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              {...register('address_line2')}
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="New York"
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province *</Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="NY"
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code *</Label>
              <Input
                id="postal_code"
                {...register('postal_code')}
                placeholder="10001"
              />
              {errors.postal_code && (
                <p className="text-sm text-destructive">{errors.postal_code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              {...register('country')}
              placeholder="United States"
            />
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Tell us about your business or selling activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_type">Business Type *</Label>
            <Select onValueChange={(value) => setValue('business_type', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual/Freelancer</SelectItem>
                <SelectItem value="business">Small Business</SelectItem>
                <SelectItem value="company">Company/Corporation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {businessType !== 'individual' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  {...register('business_name')}
                  placeholder="Your Business Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_registration">Business Registration Number</Label>
                <Input
                  id="business_registration"
                  {...register('business_registration')}
                  placeholder="Registration or license number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID / EIN</Label>
                <Input
                  id="tax_id"
                  {...register('tax_id')}
                  placeholder="Tax identification number"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="selling_reason">Why do you want to sell on Seltech? *</Label>
            <Textarea
              id="selling_reason"
              {...register('selling_reason')}
              placeholder="Explain your motivation, experience, and what you plan to sell..."
              rows={4}
            />
            {errors.selling_reason && (
              <p className="text-sm text-destructive">{errors.selling_reason.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_monthly_sales">Expected Monthly Sales (USD)</Label>
            <Input
              id="expected_monthly_sales"
              type="number"
              min="0"
              {...register('expected_monthly_sales', { valueAsNumber: true })}
              placeholder="1000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Product Categories</CardTitle>
          <CardDescription>
            Select the types of products you plan to sell
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={selectedCategories.includes(category) ? "default" : "outline"}
                  size="sm"
                  onClick={() => 
                    selectedCategories.includes(category) 
                      ? removeCategory(category)
                      : addCategory(category)
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                {selectedCategories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms and Conditions</CardTitle>
          <CardDescription>
            Please review and accept our seller terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h4 className="font-semibold">Seltech Seller Agreement</h4>
            <div className="text-sm space-y-2">
              <p>• You will receive 90% of each sale, Seltech keeps 10% as commission</p>
              <p>• All products must be original or properly licensed</p>
              <p>• Products will be reviewed before approval</p>
              <p>• You are responsible for customer support and product quality</p>
              <p>• Payouts are processed weekly to your verified payment method</p>
              <p>• You must comply with all applicable laws and regulations</p>
              <p>• Seltech reserves the right to remove products that violate our policies</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="commission_rate_accepted"
                checked={watch('commission_rate_accepted')}
                onCheckedChange={(checked) => setValue('commission_rate_accepted', !!checked)}
              />
              <Label htmlFor="commission_rate_accepted" className="text-sm">
                I accept the 90/10 commission split (I keep 90%, Seltech keeps 10%) *
              </Label>
            </div>
            {errors.commission_rate_accepted && (
              <p className="text-sm text-destructive">{errors.commission_rate_accepted.message}</p>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms_accepted"
                checked={watch('terms_accepted')}
                onCheckedChange={(checked) => setValue('terms_accepted', !!checked)}
              />
              <Label htmlFor="terms_accepted" className="text-sm">
                I have read and agree to the Seltech Seller Terms and Conditions *
              </Label>
            </div>
            {errors.terms_accepted && (
              <p className="text-sm text-destructive">{errors.terms_accepted.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Submitting Application...' : 'Submit Verification Application'}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
          <div>
            <strong>Review Process:</strong> Your application will be reviewed by our team within 2-5 business days. 
            You'll receive an email notification with the decision. If approved, you'll be able to start uploading products immediately.
          </div>
        </div>
      </div>
    </form>
  );
}