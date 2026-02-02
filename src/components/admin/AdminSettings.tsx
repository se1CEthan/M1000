import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Save, 
  AlertTriangle, 
  Shield, 
  DollarSign, 
  Mail, 
  Globe, 
  Upload,
  Lock,
  BarChart3,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/clients';

interface PlatformSettings {
  // System Controls
  maintenance_mode: boolean;
  registration_enabled: boolean;
  seller_registration_enabled: boolean;
  
  // Financial Settings
  commission_rate: number;
  min_payout_amount: number;
  max_payout_amount: number;
  payout_processing_fee: number;
  
  // File Upload Settings
  max_file_size_mb: number;
  max_thumbnail_size_mb: number;
  allowed_file_types: string;
  allowed_image_types: string;
  virus_scanning_enabled: boolean;
  
  // Platform Information
  platform_name: string;
  platform_description: string;
  platform_tagline: string;
  platform_url: string;
  
  // Contact Information
  support_email: string;
  contact_email: string;
  admin_email: string;
  business_email: string;
  
  // Legal
  terms_version: string;
  privacy_version: string;
  cookie_policy_version: string;
  gdpr_compliance: boolean;
  
  // Announcements
  announcement_text: string;
  announcement_enabled: boolean;
  announcement_type: string;
  announcement_dismissible: boolean;
  
  // Security
  two_factor_required: boolean;
  password_min_length: number;
  session_timeout_minutes: number;
  max_login_attempts: number;
  
  // Features
  reviews_enabled: boolean;
  wishlist_enabled: boolean;
  chat_support_enabled: boolean;
  newsletter_enabled: boolean;
}

export function AdminSettings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSettings>({
    // System Controls
    maintenance_mode: false,
    registration_enabled: true,
    seller_registration_enabled: true,
    
    // Financial Settings
    commission_rate: 10,
    min_payout_amount: 50,
    max_payout_amount: 10000,
    payout_processing_fee: 2,
    
    // File Upload Settings
    max_file_size_mb: 500,
    max_thumbnail_size_mb: 10,
    allowed_file_types: '.zip,.rar,.7z,.tar.gz,.exe,.msi,.dmg,.pkg,.deb,.rpm,.jar,.apk',
    allowed_image_types: '.jpg,.jpeg,.png,.gif,.webp,.svg',
    virus_scanning_enabled: false,
    
    // Platform Information
    platform_name: 'Seltech',
    platform_description: 'The premier marketplace for developer tools and digital assets',
    platform_tagline: 'Discover & Sell Developer Tools',
    platform_url: 'https://seltech.online',
    
    // Contact Information
    support_email: 'support@seltech.online',
    contact_email: 'support@seltech.online',
    admin_email: 'se1cethan@gmail.com',
    business_email: 'business@seltech.online',
    
    // Legal
    terms_version: '1.0',
    privacy_version: '1.0',
    cookie_policy_version: '1.0',
    gdpr_compliance: true,
    
    // Announcements
    announcement_text: '',
    announcement_enabled: false,
    announcement_type: 'info',
    announcement_dismissible: true,
    
    // Security
    two_factor_required: false,
    password_min_length: 8,
    session_timeout_minutes: 1440,
    max_login_attempts: 5,
    
    // Features
    reviews_enabled: true,
    wishlist_enabled: true,
    chat_support_enabled: false,
    newsletter_enabled: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value');

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsMap = data.reduce((acc, item) => {
          // Parse boolean values
          if (item.value === 'true') acc[item.key] = true;
          else if (item.value === 'false') acc[item.key] = false;
          // Parse numeric values
          else if (!isNaN(Number(item.value)) && item.value !== '') acc[item.key] = Number(item.value);
          // Keep as string
          else acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, any>);

        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load platform settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Convert settings to array format for upsert
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value), // Convert all values to strings for storage
        updated_at: new Date().toISOString(),
      }));

      // Upsert each setting
      for (const setting of settingsArray) {
        const { error } = await supabase
          .from('platform_settings')
          .upsert(setting, { onConflict: 'key' });

        if (error) throw error;
      }

      // Log admin activity (ignore errors if function doesn't exist)
      try {
        await supabase.rpc('log_admin_activity', {
          p_admin_id: profile?.id,
          p_action_type: 'settings_updated',
          p_target_id: profile?.id,
          p_target_type: 'platform',
          p_details: { updated_settings: Object.keys(settings) },
        });
      } catch (logError) {
        console.warn('Admin activity logging failed:', logError);
      }

      setLastSaved(new Date());
      toast({
        title: 'Settings Saved',
        description: 'Platform settings have been updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PlatformSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      setSettings({
        maintenance_mode: false,
        registration_enabled: true,
        seller_registration_enabled: true,
        commission_rate: 10,
        min_payout_amount: 50,
        max_payout_amount: 10000,
        payout_processing_fee: 2,
        max_file_size_mb: 500,
        max_thumbnail_size_mb: 10,
        allowed_file_types: '.zip,.rar,.7z,.tar.gz,.exe,.msi,.dmg,.pkg,.deb,.rpm,.jar,.apk',
        allowed_image_types: '.jpg,.jpeg,.png,.gif,.webp,.svg',
        virus_scanning_enabled: false,
        platform_name: 'Seltech',
        platform_description: 'The premier marketplace for developer tools and digital assets',
        platform_tagline: 'Discover & Sell Developer Tools',
        platform_url: 'https://seltech.online',
        support_email: 'support@seltech.online',
        contact_email: 'support@seltech.online',
        admin_email: 'se1cethan@gmail.com',
        business_email: 'business@seltech.online',
        terms_version: '1.0',
        privacy_version: '1.0',
        cookie_policy_version: '1.0',
        gdpr_compliance: true,
        announcement_text: '',
        announcement_enabled: false,
        announcement_type: 'info',
        announcement_dismissible: true,
        two_factor_required: false,
        password_min_length: 8,
        session_timeout_minutes: 1440,
        max_login_attempts: 5,
        reviews_enabled: true,
        wishlist_enabled: true,
        chat_support_enabled: false,
        newsletter_enabled: true,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Platform Settings</h2>
          <p className="text-muted-foreground">
            Configure platform-wide settings and policies for production
          </p>
          {lastSaved && (
            <p className="text-sm text-green-600 mt-1">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              Last saved: {lastSaved.toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      {settings.maintenance_mode && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Maintenance Mode Active:</strong> The platform is currently in maintenance mode. 
            Users cannot access the site.
          </AlertDescription>
        </Alert>
      )}

      {/* System Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Controls
          </CardTitle>
          <CardDescription>
            Control platform access and core functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                Maintenance Mode
                {settings.maintenance_mode && <Badge variant="destructive">Active</Badge>}
              </Label>
              <p className="text-sm text-muted-foreground">
                Temporarily disable the platform for maintenance
              </p>
            </div>
            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                User Registration
                {settings.registration_enabled ? 
                  <Badge variant="default">Enabled</Badge> : 
                  <Badge variant="secondary">Disabled</Badge>
                }
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to register accounts
              </p>
            </div>
            <Switch
              checked={settings.registration_enabled}
              onCheckedChange={(checked) => updateSetting('registration_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                Seller Registration
                {settings.seller_registration_enabled ? 
                  <Badge variant="default">Enabled</Badge> : 
                  <Badge variant="secondary">Disabled</Badge>
                }
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow users to apply to become sellers
              </p>
            </div>
            <Switch
              checked={settings.seller_registration_enabled}
              onCheckedChange={(checked) => updateSetting('seller_registration_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Financial Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Settings
          </CardTitle>
          <CardDescription>
            Configure commission rates, payout settings, and financial controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.commission_rate}
                onChange={(e) => updateSetting('commission_rate', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Platform commission on each sale (currently {settings.commission_rate}%)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payout_processing_fee">Payout Processing Fee (%)</Label>
              <Input
                id="payout_processing_fee"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={settings.payout_processing_fee}
                onChange={(e) => updateSetting('payout_processing_fee', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Fee charged for processing payouts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="min_payout_amount">Minimum Payout Amount ($)</Label>
              <Input
                id="min_payout_amount"
                type="number"
                min="1"
                step="1"
                value={settings.min_payout_amount}
                onChange={(e) => updateSetting('min_payout_amount', parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_payout_amount">Maximum Payout Amount ($)</Label>
              <Input
                id="max_payout_amount"
                type="number"
                min="100"
                step="100"
                value={settings.max_payout_amount}
                onChange={(e) => updateSetting('max_payout_amount', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload Settings
          </CardTitle>
          <CardDescription>
            Configure file upload limits, allowed types, and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="max_file_size_mb">Maximum Product File Size (MB)</Label>
              <Input
                id="max_file_size_mb"
                type="number"
                min="1"
                max="5000"
                value={settings.max_file_size_mb}
                onChange={(e) => updateSetting('max_file_size_mb', parseInt(e.target.value) || 500)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_thumbnail_size_mb">Maximum Thumbnail Size (MB)</Label>
              <Input
                id="max_thumbnail_size_mb"
                type="number"
                min="1"
                max="50"
                value={settings.max_thumbnail_size_mb}
                onChange={(e) => updateSetting('max_thumbnail_size_mb', parseInt(e.target.value) || 10)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowed_file_types">Allowed Product File Types</Label>
            <Input
              id="allowed_file_types"
              value={settings.allowed_file_types}
              onChange={(e) => updateSetting('allowed_file_types', e.target.value)}
              placeholder=".zip, .rar, .exe, .dmg"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of allowed file extensions for products
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowed_image_types">Allowed Image Types</Label>
            <Input
              id="allowed_image_types"
              value={settings.allowed_image_types}
              onChange={(e) => updateSetting('allowed_image_types', e.target.value)}
              placeholder=".jpg, .png, .gif, .webp"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of allowed image extensions
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Virus Scanning</Label>
              <p className="text-sm text-muted-foreground">
                Enable virus scanning for uploaded files (requires external service)
              </p>
            </div>
            <Switch
              checked={settings.virus_scanning_enabled}
              onCheckedChange={(checked) => updateSetting('virus_scanning_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Platform Information
          </CardTitle>
          <CardDescription>
            Basic platform branding and information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="platform_name">Platform Name</Label>
              <Input
                id="platform_name"
                value={settings.platform_name}
                onChange={(e) => updateSetting('platform_name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="platform_tagline">Platform Tagline</Label>
              <Input
                id="platform_tagline"
                value={settings.platform_tagline}
                onChange={(e) => updateSetting('platform_tagline', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform_description">Platform Description</Label>
            <Textarea
              id="platform_description"
              value={settings.platform_description}
              onChange={(e) => updateSetting('platform_description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform_url">Platform URL</Label>
            <Input
              id="platform_url"
              type="url"
              value={settings.platform_url}
              onChange={(e) => updateSetting('platform_url', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Platform Announcements
          </CardTitle>
          <CardDescription>
            Display important messages to all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                Show Announcement
                {settings.announcement_enabled && <Badge variant="default">Active</Badge>}
              </Label>
              <p className="text-sm text-muted-foreground">
                Display announcement banner to all users
              </p>
            </div>
            <Switch
              checked={settings.announcement_enabled}
              onCheckedChange={(checked) => updateSetting('announcement_enabled', checked)}
            />
          </div>

          {settings.announcement_enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="announcement_text">Announcement Text</Label>
                <Textarea
                  id="announcement_text"
                  value={settings.announcement_text}
                  onChange={(e) => updateSetting('announcement_text', e.target.value)}
                  placeholder="Enter your announcement message..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="announcement_type">Announcement Type</Label>
                  <select
                    id="announcement_type"
                    value={settings.announcement_type}
                    onChange={(e) => updateSetting('announcement_type', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dismissible</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to dismiss the announcement
                    </p>
                  </div>
                  <Switch
                    checked={settings.announcement_dismissible}
                    onCheckedChange={(checked) => updateSetting('announcement_dismissible', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800">
                Production Environment
              </p>
              <p className="text-sm text-amber-700">
                Changes to these settings will affect all users immediately. 
                Please review carefully before saving. Some changes may require a platform restart.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}