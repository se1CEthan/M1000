import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useToast } from '@/hooks/use-toast';

export function MaintenanceSettings() {
  const { toast } = useToast();
  const { 
    isMaintenanceMode, 
    maintenanceMessage, 
    estimatedTime, 
    loading, 
    error, 
    updateMaintenanceMode,
    refetch
  } = useMaintenanceMode();

  const [localMessage, setLocalMessage] = useState(maintenanceMessage);
  const [localEstimatedTime, setLocalEstimatedTime] = useState(estimatedTime);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Update local state when hook data changes
  useState(() => {
    setLocalMessage(maintenanceMessage);
    setLocalEstimatedTime(estimatedTime);
  });

  const handleToggleMaintenanceMode = async (enabled: boolean) => {
    setSaving(true);
    try {
      const success = await updateMaintenanceMode(enabled, localMessage, localEstimatedTime);
      
      if (success) {
        toast({
          title: enabled ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
          description: enabled 
            ? 'The website is now in maintenance mode. Users will see the maintenance page.'
            : 'The website is now live. Users can access all features.',
        });
      } else {
        throw new Error('Failed to update maintenance mode');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update maintenance mode',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const success = await updateMaintenanceMode(isMaintenanceMode, localMessage, localEstimatedTime);
      
      if (success) {
        toast({
          title: 'Settings Saved',
          description: 'Maintenance settings have been updated successfully.',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Maintenance Mode Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status Alert */}
      <Alert className={isMaintenanceMode ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
        {isMaintenanceMode ? (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <strong className={isMaintenanceMode ? 'text-red-800' : 'text-green-800'}>
                Website Status: {isMaintenanceMode ? 'Under Maintenance' : 'Live'}
              </strong>
              <p className={isMaintenanceMode ? 'text-red-700' : 'text-green-700'}>
                {isMaintenanceMode 
                  ? 'Users will see the maintenance page when visiting the website.'
                  : 'The website is fully operational and accessible to users.'
                }
              </p>
            </div>
            {error && (
              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Maintenance Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Maintenance Mode Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="maintenance-toggle" className="text-base font-medium">
                Enable Maintenance Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, all users will see the maintenance page instead of the website
              </p>
            </div>
            <Switch
              id="maintenance-toggle"
              checked={isMaintenanceMode}
              onCheckedChange={handleToggleMaintenanceMode}
              disabled={saving}
            />
          </div>

          {/* Maintenance Message */}
          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Maintenance Message</Label>
            <Textarea
              id="maintenance-message"
              placeholder="Enter the message users will see during maintenance..."
              value={localMessage}
              onChange={(e) => setLocalMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This message will be displayed to users when maintenance mode is active
            </p>
          </div>

          {/* Estimated Time */}
          <div className="space-y-2">
            <Label htmlFor="estimated-time">Estimated Completion Time (Optional)</Label>
            <Input
              id="estimated-time"
              type="datetime-local"
              value={localEstimatedTime}
              onChange={(e) => setLocalEstimatedTime(e.target.value)}
              placeholder="Select estimated completion time"
            />
            <p className="text-xs text-muted-foreground">
              When will the maintenance be complete? This helps set user expectations
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Button 
              onClick={handleSaveSettings} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Hide Preview' : 'Preview Page'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Maintenance Page Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-8 bg-muted/50">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                  <Settings className="h-8 w-8 text-yellow-600" />
                </div>
                <h1 className="text-2xl font-bold">Under Maintenance</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {localMessage || 'We are currently performing scheduled maintenance. Please check back soon!'}
                </p>
                {localEstimatedTime && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Expected completion: {new Date(localEstimatedTime).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="pt-4">
                  <Button variant="outline" disabled>
                    Check Back Later
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}