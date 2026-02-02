import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface SmartSellerButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SmartSellerButton({ children, className, variant = "outline", size = "lg" }: SmartSellerButtonProps) {
  const { user, profile } = useAuth();

  // If not logged in, go to seller signup
  if (!user || !profile) {
    return (
      <Button variant={variant} size={size} asChild className={className}>
        <Link to="/auth?mode=signup&role=seller">
          {children}
        </Link>
      </Button>
    );
  }

  // If already a seller or admin, go to seller dashboard
  if (profile.role === 'seller' || profile.role === 'admin') {
    return (
      <Button variant={variant} size={size} asChild className={className}>
        <Link to="/seller-dashboard">
          {children}
        </Link>
      </Button>
    );
  }

  // If logged in as buyer, show verification option
  return (
    <Button variant={variant} size={size} asChild className={className}>
      <Link to="/seller-verification">
        {children}
      </Link>
    </Button>
  );
}