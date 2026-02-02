import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  User, Briefcase, DollarSign, Star, Plus, Search, MessageSquare, 
  Clock, TrendingUp, Award, Eye, Calendar, Filter, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { FreelancerProfileService, DashboardService, ProjectService, ProposalService, ContractService } from '@/lib/freelancing-service';
import type { FreelancerProfile, Project, Proposal, Contract, DashboardStats } from '@/types/freelancing';
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

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats['freelancer'] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
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
      
      // Get freelancer profile
      const freelancerProfile = await FreelancerProfileService.getByUserId(user!.id);
      if (!freelancerProfile) {
        // Redirect to profile creation
        navigate('/freelancer/profile/setup');
        return;
      }
      
      setProfile(freelancerProfile);

      // Load dashboard data in parallel
      const [dashboardStats, featuredProjects, userProposals, userContracts] = await Promise.all([
        DashboardService.getFreelancerStats(freelancerProfile.id),
        ProjectService.getFeatured(10),
        ProposalService.getByFreelancerId(freelancerProfile.id),
        ContractService.getByFreelancerId(freelancerProfile.id)
      ]);

      setStats(dashboardStats);
      setProjects(featuredProjects);
      setProposals(userProposals);
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
    const total = 10;
    
    if (profile.title) completed++;
    if (profile.description) completed++;
    if (profile.hourly_rate) completed++;
    if (profile.skills.length > 0) completed++;
    if (profile.languages.length > 0) completed++;
    if (profile.profile_image_url) completed++;
    if (profile.location) completed++;
    if (profile.portfolio_items.length > 0) completed++;
    if (profile.education.length > 0) completed++;
    if (profile.work_experience.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const dashboardStats = [
    { 
      label: 'Active Contracts', 
      value: stats?.active_contracts || 0, 
      icon: Briefcase, 
      color: 'text-blue-500',
      change: '+2 this month'
    },
    { 
      label: 'Total Earnings', 
      value: `$${stats?.total_earnings?.toLocaleString() || '0'}`, 
      icon: DollarSign, 
      color: 'text-green-500',
      change: '+15% this month'
    },
    { 
      label: 'Profile Rating', 
      value: stats?.avg_rating?.toFixed(1) || 'New', 
      icon: Star, 
      color: 'text-yellow-500',
      change: 'Based on reviews'
    },
    { 
      label: 'Pending Proposals', 
      value: stats?.pending_proposals || 0, 
      icon: User, 
      color: 'text-purple-500',
      change: 'Awaiting response'
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
                Welcome back, {profile?.title?.split(' ')[0] || 'Freelancer'}!
              </h1>
              <p className="text-muted-foreground mt-2">
                Here's what's happening with your freelancing business today.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={profile?.availability === 'available' ? 'default' : 'secondary'}>
                {profile?.availability === 'available' ? '🟢 Available' : '🔴 Busy'}
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
                <TabsTrigger value="projects">Find Work</TabsTrigger>
                <TabsTrigger value="proposals">My Proposals</TabsTrigger>
                <TabsTrigger value="contracts">Active Work</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Profile Completion */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Completion
                      </CardTitle>
                      <CardDescription>
                        Complete your profile to attract more clients
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
                        <Link to="/freelancer/profile/setup">
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
                        Common tasks to grow your business
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/freelancer/projects">
                          <Search className="mr-2 h-4 w-4" />
                          Browse Projects
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/freelancer/portfolio">
                          <Award className="mr-2 h-4 w-4" />
                          Update Portfolio
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/freelancer/messages">
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
                    <CardDescription>Your latest proposals and contract updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {proposals.length === 0 && contracts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent activity</p>
                        <p className="text-sm">Start by browsing projects and submitting proposals!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {proposals.slice(0, 3).map((proposal) => (
                          <div key={proposal.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{proposal.project?.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Proposal submitted • ${proposal.proposed_budget}
                              </p>
                            </div>
                            <Badge variant={
                              proposal.status === 'accepted' ? 'default' :
                              proposal.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {proposal.status}
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
                  <h2 className="text-2xl font-bold">Find Work</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                    <Button asChild>
                      <Link to="/freelancer/projects/search">
                        <Search className="h-4 w-4 mr-2" />
                        Advanced Search
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6">
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
                                <Clock className="h-4 w-4" />
                                {project.duration_value} {project.duration_type}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {project.proposals_count} proposals
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="secondary">{project.category?.name}</Badge>
                            {project.urgent && <Badge variant="destructive">Urgent</Badge>}
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
                          <Button asChild>
                            <Link to={`/freelancer/projects/${project.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Proposals Tab */}
              <TabsContent value="proposals" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Proposals</h2>
                  <Badge variant="secondary">{proposals.length} total</Badge>
                </div>

                {proposals.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start browsing projects and submit your first proposal
                      </p>
                      <Button asChild>
                        <Link to="/freelancer/projects">
                          <Search className="mr-2 h-4 w-4" />
                          Find Projects
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((proposal) => (
                      <Card key={proposal.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2">
                                {proposal.project?.title}
                              </h3>
                              <p className="text-muted-foreground mb-2">
                                Proposed: ${proposal.proposed_budget} • {proposal.proposed_timeline} days
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {proposal.cover_letter}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={
                                proposal.status === 'accepted' ? 'default' :
                                proposal.status === 'rejected' ? 'destructive' : 'secondary'
                              }>
                                {proposal.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(proposal.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {proposal.project?.proposals_count} total proposals
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/freelancer/proposals/${proposal.id}`}>
                                  View Details
                                </Link>
                              </Button>
                              {proposal.status === 'pending' && (
                                <Button variant="outline" size="sm">
                                  Edit Proposal
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No active contracts</h3>
                      <p className="text-muted-foreground mb-4">
                        Once you win a project, it will appear here
                      </p>
                      <Button asChild>
                        <Link to="/freelancer/projects">
                          <Search className="mr-2 h-4 w-4" />
                          Find Projects
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
                                {contract.business?.company_name}
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
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {contract.milestones.length} milestones
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/freelancer/contracts/${contract.id}`}>
                                  View Contract
                                </Link>
                              </Button>
                              <Button size="sm" asChild>
                                <Link to={`/freelancer/contracts/${contract.id}/workspace`}>
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

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Profile Management</h2>
                  <Button asChild>
                    <Link to="/freelancer/profile/edit">
                      Edit Profile
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{profile?.title}</h3>
                          <p className="text-sm text-muted-foreground">{profile?.location}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm">{profile?.rating.toFixed(1)} ({profile?.rating_count} reviews)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Hourly Rate:</span>
                          <span className="font-medium">${profile?.hourly_rate}/hr</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total Jobs:</span>
                          <span className="font-medium">{profile?.total_jobs}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate:</span>
                          <span className="font-medium">{profile?.completion_rate}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Skills & Expertise</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Top Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {profile?.skills.slice(0, 6).map((skill) => (
                              <Badge key={skill} variant="secondary">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Languages</h4>
                          <div className="flex flex-wrap gap-2">
                            {profile?.languages.map((language) => (
                              <Badge key={language} variant="outline">{language}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}