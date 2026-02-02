import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface SmartSellerLinkProps {
  children: React.ReactNode;
  className?: string;
}

export function SmartSellerLink({ children, className }: SmartSellerLinkProps) {
  const { user, profile } = useAuth();

  // If not logged in, go to seller signup
  if (!user || !profile) {
    return (
      <Link to="/auth?mode=signup&role=seller" className={className}>
        {children}
      </Link>
    );
  }

  // If already a seller or admin, go to seller dashboard
  if (profile.role === 'seller' || profile.role === 'admin') {
    return (
      <Link to="/seller-dashboard" className={className}>
        {children}
      </Link>
    );
  }

  // If logged in as buyer, show verification option
  return (
    <Link to="/seller-verification" className={className}>
      {children}
    </Link>
  );
}