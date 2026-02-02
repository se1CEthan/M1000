import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  Building2, Users, DollarSign, Clock, Plus, Search, MessageSquare,
  TrendingUp, Award, Eye, Calendar, Filter, Bell, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { BusinessProfileService, DashboardService, ProjectService, ContractService } from '@/lib/freelancing-service';
import type { BusinessProfile, Project, Contract, DashboardStats } from '@/types/freelancing';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';

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

export default function BusinessDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats['business'] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get business profile
      const businessProfile = await BusinessProfileService.getByUserId(user!.id);
      if (!businessProfile) {
        // Redirect to profile creation
        navigate('/business/profile/setup');
        return;
      }
      
      setProfile(businessProfile);

      // Load dashboard data in parallel
      const [dashboardStats, userProjects, userContracts] = await Promise.all([
        DashboardService.getBusinessStats(businessProfile.id),
        ProjectService.getByBusinessId(businessProfile.id),
        ContractService.getByBusinessId(businessProfile.id)
      ]);

      setStats(dashboardStats);
      setProjects(userProjects);
      setContracts(userContracts);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getProfileCompletionPercentage = () => {
    if (!profile) return 0;
    
    let completed = 0;
    const total = 8;
    
    if (profile.company_name) completed++;
    if (profile.company_description) completed++;
    if (profile.industry) completed++;
    if (profile.company_size) completed++;
    if (profile.website_url) completed++;
    if (profile.location) completed++;
    if (profile.logo_url) completed++;
    if (profile.payment_verified) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const dashboardStats = [
    { 
      label: 'Active Projects', 
      value: stats?.active_projects || 0, 
      icon: Building2, 
      color: 'text-blue-500',
      change: '+3 this month'
    },
    { 
      label: 'Total Spent', 
      value: `$${stats?.total_spent?.toLocaleString() || '0'}`, 
      icon: DollarSign, 
      color: 'text-green-500',
      change: '+25% this month'
    },
    { 
      label: 'Hired Freelancers', 
      value: stats?.hired_freelancers || 0, 
      icon: Users, 
      color: 'text-purple-500',
      change: 'Across all projects'
    },
    { 
      label: 'Avg. Project Rating', 
      value: stats?.avg_project_rating?.toFixed(1) || 'New', 
      icon: Award, 
      color: 'text-yellow-500',
      change: 'From freelancers'
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={item} className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {profile?.company_name || 'Business'}!
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your projects and find the perfect freelancers for your business needs.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={profile?.payment_verified ? 'default' : 'secondary'}>
                {profile?.payment_verified ? '✅ Payment Verified' : '⏳ Verify Payment'}
              </Badge>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                      </div>
                      <Icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div variants={item}>
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="projects">My Projects</TabsTrigger>
                <TabsTrigger value="freelancers">Find Talent</TabsTrigger>
                <TabsTrigger value="contracts">Active Work</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Profile Completion */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company Profile
                      </CardTitle>
                      <CardDescription>
                        Complete your profile to attract top freelancers
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Profile completion</span>
                          <span className="text-muted-foreground">{getProfileCompletionPercentage()}%</span>
                        </div>
                        <Progress value={getProfileCompletionPercentage()} className="h-2" />
                      </div>
                      <Button asChild className="w-full">
                        <Link to="/business/profile/setup">
                          <Plus className="mr-2 h-4 w-4" />
                          Complete Profile
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Quick Actions
                      </CardTitle>
                      <CardDescription>
                        Common tasks to manage your projects
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/business/projects/create">
                          <Plus className="mr-2 h-4 w-4" />
                          Post New Project
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/business/freelancers">
                          <Search className="mr-2 h-4 w-4" />
                          Browse Freelancers
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/business/messages">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Check Messages
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest projects and freelancer interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projects.length === 0 && contracts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent activity</p>
                        <p className="text-sm">Start by posting your first project!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {projects.slice(0, 3).map((project) => (
                          <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{project.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {project.proposals_count} proposals • {project.status}
                              </p>
                            </div>
                            <Badge variant={
                              project.status === 'open' ? 'default' :
                              project.status === 'in_progress' ? 'secondary' : 'outline'
                            }>
                              {project.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Projects</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button asChild>
                      <Link to="/business/projects/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Post Project
                      </Link>
                    </Button>
                  </div>
                </div>

                {projects.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Post your first project to start finding talented freelancers
                      </p>
                      <Button asChild>
                        <Link to="/business/projects/create">
                          <Plus className="mr-2 h-4 w-4" />
                          Post Your First Project
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <Card key={project.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                              <p className="text-muted-foreground mb-4 line-clamp-2">
                                {project.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  {project.budget_type === 'fixed' 
                                    ? `$${project.budget_min}-$${project.budget_max}` 
                                    : `$${project.hourly_rate_min}-$${project.hourly_rate_max}/hr`
                                  }
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {project.proposals_count} proposals
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  {project.views_count} views
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={
                                project.status === 'open' ? 'default' :
                                project.status === 'in_progress' ? 'secondary' : 'outline'
                              }>
                                {project.status}
                              </Badge>
                              {project.featured && <Badge variant="destructive">Featured</Badge>}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {project.skills_required.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {project.skills_required.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{project.skills_required.length - 3} more
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/business/projects/${project.id}/proposals`}>
                                  View Proposals ({project.proposals_count})
                                </Link>
                              </Button>
                              <Button size="sm" asChild>
                                <Link to={`/business/projects/${project.id}/edit`}>
                                  Edit Project
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Freelancers Tab */}
              <TabsContent value="freelancers" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Find Talent</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Advanced Filters
                    </Button>
                    <Button asChild>
                      <Link to="/business/freelancers/search">
                        <Search className="h-4 w-4 mr-2" />
                        Browse All Freelancers
                      </Link>
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Freelancers</CardTitle>
                    <CardDescription>
                      Top-rated freelancers that match your project requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Post a project to see recommended freelancers</p>
                      <p className="text-sm">Our AI will match you with the best talent for your needs</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contracts Tab */}
              <TabsContent value="contracts" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Active Work</h2>
                  <Badge variant="secondary">{contracts.filter(c => c.status === 'active').length} active</Badge>
                </div>

                {contracts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No active contracts</h3>
                      <p className="text-muted-foreground mb-4">
                        Once you hire a freelancer, their work will appear here
                      </p>
                      <Button asChild>
                        <Link to="/business/projects/create">
                          <Plus className="mr-2 h-4 w-4" />
                          Post a Project
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <Card key={contract.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2">{contract.title}</h3>
                              <p className="text-muted-foreground mb-2">
                                {contract.freelancer?.title} • {contract.freelancer?.location}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>${contract.total_amount || contract.hourly_rate}</span>
                                <span>{contract.contract_type === 'hourly' ? 'Hourly' : 'Fixed Price'}</span>
                                <span>Started {new Date(contract.start_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={
                                contract.status === 'active' ? 'default' :
                                contract.status === 'completed' ? 'secondary' : 'outline'
                              }>
                                {contract.status}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Award className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">{contract.freelancer?.rating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {contract.milestones.length} milestones • {contract.milestones.filter(m => m.status === 'completed').length} completed
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/business/contracts/${contract.id}`}>
                                  View Contract
                                </Link>
                              </Button>
                              <Button size="sm" asChild>
                                <Link to={`/business/contracts/${contract.id}/workspace`}>
                                  Open Workspace
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Business Analytics</h2>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Last 30 Days
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Spending Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Spent</span>
                          <span className="font-semibold">${stats?.total_spent?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Active Projects</span>
                          <span className="font-semibold">{stats?.active_projects || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Avg. Project Cost</span>
                          <span className="font-semibold">
                            ${stats?.active_projects ? Math.round((stats.total_spent || 0) / stats.active_projects).toLocaleString() : '0'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Freelancer Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Hired Freelancers</span>
                          <span className="font-semibold">{stats?.hired_freelancers || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Avg. Rating Given</span>
                          <span className="font-semibold">{stats?.avg_project_rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Repeat Hires</span>
                          <span className="font-semibold">0</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Success Metrics</CardTitle>
                    <CardDescription>
                      Track the performance of your projects over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Analytics will appear here once you have more project data</p>
                      <p className="text-sm">Complete a few projects to see detailed insights</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}