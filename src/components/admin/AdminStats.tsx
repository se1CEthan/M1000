import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AdminStatsProps {
  applications: any[];
  productReviews: any[];
}

export function AdminStats({ applications, productReviews }: AdminStatsProps) {
  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const approvedApplications = applications.filter(app => app.status === 'approved').length;
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
  
  const pendingProducts = productReviews.filter(review => review.status === 'pending').length;
  const approvedProducts = productReviews.filter(review => review.status === 'approved').length;
  const rejectedProducts = productReviews.filter(review => review.status === 'rejected').length;

  const stats = [
    {
      title: 'Pending Seller Applications',
      value: pendingApplications,
      description: `${applications.length} total applications`,
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Approved Sellers',
      value: approvedApplications,
      description: 'Verified and active',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Product Reviews',
      value: pendingProducts,
      description: `${productReviews.length} total products`,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Approved Products',
      value: approvedProducts,
      description: 'Live on marketplace',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Rejected Applications',
      value: rejectedApplications,
      description: 'Need attention',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Rejected Products',
      value: rejectedProducts,
      description: 'Policy violations',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}