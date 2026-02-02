import { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/notifications';
import { ArrowLeft } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showNotifications?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  actions, 
  showNotifications = false,
  showBackButton = false,
  onBack 
}: DashboardLayoutProps) {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button variant="outline" size="icon" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
                {subtitle && (
                  <p className="text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {showNotifications && <NotificationBell />}
              {actions}
            </div>
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </MainLayout>
  );
}