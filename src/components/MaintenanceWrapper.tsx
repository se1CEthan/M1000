import { useEffect, useState } from 'react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import MaintenancePage from '@/pages/MaintenancePage';

interface MaintenanceWrapperProps {
  children: React.ReactNode;
}

export function MaintenanceWrapper({ children }: MaintenanceWrapperProps) {
  const { isMaintenanceMode, loading } = useMaintenanceMode();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current user is admin (allow admin access during maintenance)
    const checkAdminStatus = () => {
      try {
        const userStr = localStorage.getItem('sb-rtsaarapvlzzinmpjdys-auth-token');
        if (userStr) {
          const userData = JSON.parse(userStr);
          const profile = userData?.user?.user_metadata?.profile;
          setIsAdmin(profile?.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  // Show loading while checking maintenance status
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show maintenance page if maintenance mode is enabled and user is not admin
  if (isMaintenanceMode && !isAdmin) {
    return <MaintenancePage />;
  }

  // Show normal app
  return <>{children}</>;
}