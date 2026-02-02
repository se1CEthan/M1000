import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Clock, DollarSign, CheckCircle, AlertCircle, 
  FileText, MessageSquare, Upload, Download, Play, Pause,
  Calendar, User, Award, Settings, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ContractService } from '@/lib/freelancing-service';
import type { Contract, TimeEntry, Milestone } from '@/types/freelancing';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

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

export default function ContractWorkspace() {
  const { contractId } = useParams<{ contractId: string }>();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    startTime: null as Date | null,
    description: '',
    elapsedTime: 0
  });

  const [newTimeEntry, setNewTimeEntry] = useState({
    description: '',
    hours_worked: 0,
    work_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (contractId) {
      loadContract();
    }
  }, [contractId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && currentSession.startTime) {
      interval = setInterval(() => {
        setCurrentSession(prev => ({
          ...prev,
          elapsedTime: Math.floor((Date.now() - prev.startTime!.getTime()) / 1000)
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, currentSession.startTime]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const data = await ContractService.getById(contractId!);
      if (!data) {
        toast({
          title: 'Error',
          description: 'Contract not found',
          variant: 'destructive'
        });
        return;
      }
      setContract(data);
    } catch (error) {
      console.error('Error loading contract:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contract',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const startTimeTracking = () => {
    setIsTracking(true);
    setCurrentSession({
      startTime: new Date(),
      description: '',
      elapsedTime: 0
    });
  };

  const stopTimeTracking = () => {
    if (currentSession.startTime) {
      const hoursWorked = currentSession.elapsedTime / 3600;
      setNewTimeEntry(prev => ({
        ...prev,
        hours_worked: Math.round(hoursWorked * 100) / 100,
        description: currentSession.description
      }));
    }
    setIsTracking(false);
    setCurrentSession({
      startTime: null,
      description: '',
      elapsedTime: 0
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCompletedMilestones = () => {
    return contract?.milestones.filter(m => m.status === 'completed').length || 0;
  };

  const getTotalMilestones = () => {
    return contract?.milestones.length || 0;
  };

  const getProjectProgress = () => {
    const total = getTotalMilestones();
    if (total === 0) return 0;
    return Math.round((getCompletedMilestones() / total) * 100);
  };

  const getTotalEarnings = () => {
    if (contract?.contract_type === 'fixed') {
      return contract.total_amount || 0;
    } else {
      // Calculate from time entries
      const totalHours = contract?.time_entries?.reduce((sum, entry) => sum + entry.hours_worked, 0) || 0;
      return totalHours * (contract?.hourly_rate || 0);
    }
  };

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

  if (!contract) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">Contract Not Found</h3>
              <p className="text-muted-foreground">The contract you're looking for doesn't exist or you don't have access to it.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={item} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/freelancer/contracts">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Contracts
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{contract.title}</h1>
                <p className="text-muted-foreground mt-2">
                  Contract with {contract.business?.company_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={
                contract.status === 'active' ? 'default' :
                contract.status === 'completed' ? 'secondary' : 'outline'
              }>
                {contract.status}
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="text-2xl font-bold">{getProjectProgress()}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={getProjectProgress()} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Earnings</p>
                    <p className="text-2xl font-bold">${getTotalEarnings().toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Milestones</p>
                    <p className="text-2xl font-bold">{getCompletedMilestones()}/{getTotalMilestones()}</p>
                  </div>
                  <Award className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Time Tracked</p>
                    <p className="text-2xl font-bold">
                      {contract.time_entries?.reduce((sum, entry) => sum + entry.hours_worked, 0).toFixed(1) || '0'}h
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div variants={item}>
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contract Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contract Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium capitalize">{contract.contract_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Value:</span>
                          <span className="font-medium">
                            {contract.contract_type === 'fixed' 
                              ? `$${contract.total_amount?.toLocaleString()}` 
                              : `$${contract.hourly_rate}/hr`
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span className="font-medium">
                            {new Date(contract.start_date).toLocaleDateString()}
                          </span>
                        </div>
                        {contract.end_date && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">End Date:</span>
                            <span className="font-medium">
                              {new Date(contract.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">{contract.description}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Client Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Client Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={contract.business?.logo_url} />
                          <AvatarFallback>
                            {contract.business?.company_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{contract.business?.company_name}</h3>
                          <p className="text-sm text-muted-foreground">{contract.business?.location}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">
                              {contract.business?.avg_rating?.toFixed(1)} ({contract.business?.rating_count} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Spent:</span>
                          <span className="font-medium">${contract.business?.total_spent?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Projects Posted:</span>
                          <span className="font-medium">{contract.business?.total_projects}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 border rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div className="flex-1">
                          <p className="font-medium">Contract started</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(contract.start_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {contract.milestones.filter(m => m.status === 'completed').map((milestone) => (
                        <div key={milestone.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div className="flex-1">
                            <p className="font-medium">Milestone completed: {milestone.title}</p>
                            <p className="text-sm text-muted-foreground">
                              ${milestone.amount.toLocaleString()} earned
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Milestones Tab */}
              <TabsContent value="milestones" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Milestones</CardTitle>
                    <CardDescription>
                      Track progress and manage milestone deliverables
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contract.milestones.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No milestones defined</p>
                        <p className="text-sm">Milestones help track project progress and payments</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {contract.milestones.map((milestone, index) => (
                          <div key={milestone.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    #{index + 1}
                                  </span>
                                  <h4 className="font-semibold">{milestone.title}</h4>
                                  <Badge variant={
                                    milestone.status === 'completed' ? 'default' :
                                    milestone.status === 'in_progress' ? 'secondary' : 'outline'
                                  }>
                                    {milestone.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {milestone.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    ${milestone.amount.toLocaleString()}
                                  </span>
                                  {milestone.due_date && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      Due: {new Date(milestone.due_date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                {milestone.status === 'pending' && (
                                  <Button size="sm">
                                    Start Milestone
                                  </Button>
                                )}
                                {milestone.status === 'in_progress' && (
                                  <Button size="sm">
                                    Submit for Review
                                  </Button>
                                )}
                                {milestone.status === 'completed' && (
                                  <Button size="sm" variant="outline" disabled>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Completed
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Time Tracking Tab */}
              <TabsContent value="time-tracking" className="space-y-6">
                {contract.contract_type === 'hourly' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Time Tracker</CardTitle>
                      <CardDescription>
                        Track your work time for accurate billing
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Active Timer */}
                      <div className="text-center p-6 border rounded-lg">
                        <div className="text-4xl font-mono font-bold mb-4">
                          {formatTime(currentSession.elapsedTime)}
                        </div>
                        
                        {isTracking && (
                          <div className="mb-4">
                            <Input
                              placeholder="What are you working on?"
                              value={currentSession.description}
                              onChange={(e) => setCurrentSession(prev => ({ ...prev, description: e.target.value }))}
                              className="text-center"
                            />
                          </div>
                        )}
                        
                        <div className="flex justify-center gap-2">
                          {!isTracking ? (
                            <Button onClick={startTimeTracking} className="bg-green-600 hover:bg-green-700">
                              <Play className="h-4 w-4 mr-2" />
                              Start Timer
                            </Button>
                          ) : (
                            <Button onClick={stopTimeTracking} variant="destructive">
                              <Pause className="h-4 w-4 mr-2" />
                              Stop Timer
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Manual Time Entry */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Manual Time Entry</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="work_date">Date</Label>
                              <Input
                                id="work_date"
                                type="date"
                                value={newTimeEntry.work_date}
                                onChange={(e) => setNewTimeEntry(prev => ({ ...prev, work_date: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="hours_worked">Hours</Label>
                              <Input
                                id="hours_worked"
                                type="number"
                                step="0.25"
                                placeholder="8.5"
                                value={newTimeEntry.hours_worked || ''}
                                onChange={(e) => setNewTimeEntry(prev => ({ ...prev, hours_worked: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              placeholder="Describe what you worked on..."
                              value={newTimeEntry.description}
                              onChange={(e) => setNewTimeEntry(prev => ({ ...prev, description: e.target.value }))}
                              rows={3}
                            />
                          </div>
                          
                          <Button className="w-full">
                            Add Time Entry
                          </Button>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                )}

                {/* Time Entries History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Time Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!contract.time_entries || contract.time_entries.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No time entries yet</p>
                        <p className="text-sm">Start tracking your work time</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {contract.time_entries.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{entry.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(entry.work_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{entry.hours_worked}h</p>
                              <p className="text-sm text-muted-foreground">
                                ${entry.total_amount.toLocaleString()}
                              </p>
                            </div>
                            <Badge variant={
                              entry.status === 'approved' ? 'default' :
                              entry.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {entry.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Files Tab */}
              <TabsContent value="files" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Files</CardTitle>
                    <CardDescription>
                      Share files and deliverables with your client
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
                      <p className="text-muted-foreground mb-4">
                        Drag and drop files here or click to browse
                      </p>
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Communication Tab */}
              <TabsContent value="communication" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Communication</CardTitle>
                    <CardDescription>
                      Messages and updates related to this contract
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Communication will appear here</p>
                      <Button className="mt-4">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Start Conversation
                      </Button>
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