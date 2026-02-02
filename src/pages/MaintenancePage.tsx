import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Clock, 
  RefreshCw, 
  Home,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

export default function MaintenancePage() {
  const { isMaintenanceMode, maintenanceMessage, estimatedTime, loading } = useMaintenanceMode();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Auto-refresh page every 5 minutes to check if maintenance is over
  useEffect(() => {
    if (isMaintenanceMode) {
      const refreshTimer = setInterval(() => {
        window.location.reload();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(refreshTimer);
    }
  }, [isMaintenanceMode]);

  // If not in maintenance mode, redirect to home
  useEffect(() => {
    if (!loading && !isMaintenanceMode) {
      window.location.href = '/';
    }
  }, [loading, isMaintenanceMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Checking system status...</p>
        </div>
      </div>
    );
  }

  const estimatedDate = estimatedTime ? new Date(estimatedTime) : null;
  const isEstimatedTimePassed = estimatedDate && estimatedDate < currentTime;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <Settings className="h-10 w-10 text-yellow-600 animate-pulse" />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Under Maintenance</h1>
                <p className="text-gray-600">
                  We're making some improvements to serve you better
                </p>
              </div>

              {/* Message */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">
                  {maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon!'}
                </p>
              </div>

              {/* Estimated Time */}
              {estimatedDate && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Expected completion:</span>
                  </div>
                  <div className={`text-lg font-medium ${isEstimatedTimePassed ? 'text-orange-600' : 'text-blue-600'}`}>
                    {estimatedDate.toLocaleString()}
                  </div>
                  {isEstimatedTimePassed && (
                    <div className="flex items-center justify-center gap-1 text-sm text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Maintenance is taking longer than expected</span>
                    </div>
                  )}
                </div>
              )}

              {/* Current Time */}
              <div className="text-sm text-gray-500">
                Current time: {currentTime.toLocaleString()}
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Again
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.location.href = '/'} 
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = 'mailto:support@seltech.online'} 
                    variant="outline"
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Thank you for your patience. We'll be back online shortly!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto-refresh notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            This page automatically refreshes every 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
}