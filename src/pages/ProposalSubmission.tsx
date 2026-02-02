import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, DollarSign, Clock, FileText, Plus, X, Upload,
  Calendar, AlertCircle, CheckCircle, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ProjectService, ProposalService, FreelancerProfileService } from '@/lib/freelancing-service';
import type { Project, CreateProposalForm, Milestone, FreelancerProfile } from '@/types/freelancing';
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

export default function ProposalSubmission() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('proposal');

  const [formData, setFormData] = useState<CreateProposalForm>({
    cover_letter: '',
    proposed_budget: undefined,
    proposed_timeline: undefined,
    proposed_hourly_rate: undefined,
    estimated_hours: undefined,
    milestones: [],
    attachments: []
  });

  const [newMilestone, setNewMilestone] = useState<Omit<Milestone, 'id' | 'status' | 'completed_at'>>({
    title: '',
    description: '',
    amount: 0,
    due_date: ''
  });

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectData, profileData] = await Promise.all([
        ProjectService.getById(projectId!),
        FreelancerProfileService.getByUserId((await supabase.auth.getUser()).data.user?.id || '')
      ]);

      if (!projectData) {
        toast({
          title: 'Error',
          description: 'Project not found',
          variant: 'destructive'
        });
        navigate('/freelancer/projects');
        return;
      }

      if (!profileData) {
        toast({
          title: 'Profile Required',
          description: 'Please complete your freelancer profile first',
          variant: 'destructive'
        });
        navigate('/freelancer/profile/setup');
        return;
      }

      setProject(projectData);
      setProfile(profileData);

      // Pre-fill form based on project type
      if (projectData.budget_type === 'hourly') {
        setFormData(prev => ({
          ...prev,
          proposed_hourly_rate: profileData.hourly_rate || projectData.hourly_rate_min
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          proposed_budget: projectData.budget_min
        }));
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateProposalForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addMilestone = () => {
    if (newMilestone.title && newMilestone.amount > 0) {
      setFormData(prev => ({
        ...prev,
        milestones: [...prev.milestones, { 
          ...newMilestone, 
          id: Date.now().toString(),
          status: 'pending' as const
        }]
      }));
      setNewMilestone({
        title: '',
        description: '',
        amount: 0,
        due_date: ''
      });
    }
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await ProposalService.create(projectId!, formData);
      
      toast({
        title: 'Success!',
        description: 'Your proposal has been submitted successfully.',
      });
      
      navigate('/freelancer/proposals');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit proposal',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!formData.cover_letter.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Cover letter is required',
        variant: 'destructive'
      });
      return false;
    }

    if (project?.budget_type === 'fixed' && !formData.proposed_budget) {
      toast({
        title: 'Validation Error',
        description: 'Proposed budget is required for fixed-price projects',
        variant: 'destructive'
      });
      return false;
    }

    if (project?.budget_type === 'hourly' && !formData.proposed_hourly_rate) {
      toast({
        title: 'Validation Error',
        description: 'Hourly rate is required for hourly projects',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const getTotalMilestoneAmount = () => {
    return formData.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
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

  if (!project) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">Project Not Found</h3>
              <p className="text-muted-foreground">The project you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={item} className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/freelancer/projects/${projectId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Submit Proposal</h1>
              <p className="text-muted-foreground mt-2">
                Create a compelling proposal to win this project
              </p>
            </div>
          </motion.div>

          {/* Project Summary */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{project.title}</span>
                  <Badge variant="secondary">{project.category?.name}</Badge>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <p className="font-medium">
                      {project.budget_type === 'fixed' 
                        ? `$${project.budget_min?.toLocaleString()}-${project.budget_max?.toLocaleString()}` 
                        : `$${project.hourly_rate_min}-${project.hourly_rate_max}/hr`
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">{project.duration_value} {project.duration_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Proposals:</span>
                    <p className="font-medium">{project.proposals_count} submitted</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Experience:</span>
                    <p className="font-medium capitalize">{project.experience_level}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Proposal Form */}
          <motion.div variants={item}>
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="proposal">Proposal Details</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Timeline</TabsTrigger>
                <TabsTrigger value="review">Review & Submit</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Proposal Details Tab */}
                <TabsContent value="proposal" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Cover Letter
                      </CardTitle>
                      <CardDescription>
                        Introduce yourself and explain why you're the best fit for this project
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cover_letter">Your Proposal *</Label>
                        <Textarea
                          id="cover_letter"
                          placeholder="Dear Client,

I'm excited about your project and believe I'm the perfect fit because...

Here's how I would approach your project:
1. [Step 1]
2. [Step 2]
3. [Step 3]

I have [X years] of experience in [relevant skills] and have successfully completed similar projects...

I'm available to start immediately and can deliver within your timeline.

Best regards,
[Your name]"
                          value={formData.cover_letter}
                          onChange={(e) => handleInputChange('cover_letter', e.target.value)}
                          rows={12}
                          className="resize-none"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formData.cover_letter.length}/2000 characters</span>
                          <span>Be specific about your approach and relevant experience</span>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100">Tips for a winning proposal:</h4>
                            <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                              <li>• Address the client's specific needs and requirements</li>
                              <li>• Highlight relevant experience and past work</li>
                              <li>• Ask clarifying questions to show engagement</li>
                              <li>• Be professional but personable</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="button" onClick={() => setCurrentTab('pricing')}>
                          Next: Pricing & Timeline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pricing & Timeline Tab */}
                <TabsContent value="pricing" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Pricing & Timeline
                      </CardTitle>
                      <CardDescription>
                        Set your price and delivery timeline for this project
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {project.budget_type === 'fixed' ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="proposed_budget">Your Bid Amount *</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="proposed_budget"
                                type="number"
                                placeholder="5000"
                                value={formData.proposed_budget || ''}
                                onChange={(e) => handleInputChange('proposed_budget', parseFloat(e.target.value) || undefined)}
                                className="pl-10"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Client's budget: ${project.budget_min?.toLocaleString()} - ${project.budget_max?.toLocaleString()}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="proposed_timeline">Delivery Timeline *</Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="proposed_timeline"
                                type="number"
                                placeholder="14"
                                value={formData.proposed_timeline || ''}
                                onChange={(e) => handleInputChange('proposed_timeline', parseInt(e.target.value) || undefined)}
                                className="pl-10"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Number of days to complete the project
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="proposed_hourly_rate">Your Hourly Rate *</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="proposed_hourly_rate"
                                type="number"
                                placeholder="50"
                                value={formData.proposed_hourly_rate || ''}
                                onChange={(e) => handleInputChange('proposed_hourly_rate', parseFloat(e.target.value) || undefined)}
                                className="pl-10"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Client's budget: ${project.hourly_rate_min} - ${project.hourly_rate_max}/hr
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="estimated_hours">Estimated Hours</Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="estimated_hours"
                                type="number"
                                placeholder="40"
                                value={formData.estimated_hours || ''}
                                onChange={(e) => handleInputChange('estimated_hours', parseInt(e.target.value) || undefined)}
                                className="pl-10"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Your estimate for total hours needed
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Milestones Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Project Milestones (Optional)</Label>
                          <span className="text-sm text-muted-foreground">
                            Total: ${getTotalMilestoneAmount().toLocaleString()}
                          </span>
                        </div>

                        {/* Add Milestone Form */}
                        <div className="p-4 border rounded-lg space-y-4">
                          <h4 className="font-medium">Add Milestone</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="Milestone title"
                              value={newMilestone.title}
                              onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                            />
                            <Input
                              type="number"
                              placeholder="Amount"
                              value={newMilestone.amount || ''}
                              onChange={(e) => setNewMilestone(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <Textarea
                            placeholder="Milestone description"
                            value={newMilestone.description}
                            onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                          />
                          <div className="flex items-center justify-between">
                            <Input
                              type="date"
                              value={newMilestone.due_date}
                              onChange={(e) => setNewMilestone(prev => ({ ...prev, due_date: e.target.value }))}
                              className="w-auto"
                            />
                            <Button type="button" onClick={addMilestone} size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Milestone
                            </Button>
                          </div>
                        </div>

                        {/* Existing Milestones */}
                        {formData.milestones.map((milestone, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{milestone.title}</h4>
                                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="font-medium">${milestone.amount.toLocaleString()}</span>
                                  {milestone.due_date && (
                                    <span className="text-muted-foreground">
                                      Due: {new Date(milestone.due_date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMilestone(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setCurrentTab('proposal')}>
                          Previous
                        </Button>
                        <Button type="button" onClick={() => setCurrentTab('review')}>
                          Next: Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Review & Submit Tab */}
                <TabsContent value="review" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Review Your Proposal
                      </CardTitle>
                      <CardDescription>
                        Double-check everything before submitting your proposal
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Proposal Summary */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Cover Letter Preview</h4>
                          <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                            {formData.cover_letter || 'No cover letter written'}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Your Pricing</h4>
                            <div className="space-y-2 text-sm">
                              {project.budget_type === 'fixed' ? (
                                <>
                                  <div className="flex justify-between">
                                    <span>Bid Amount:</span>
                                    <span className="font-medium">${formData.proposed_budget?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Timeline:</span>
                                    <span className="font-medium">{formData.proposed_timeline} days</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between">
                                    <span>Hourly Rate:</span>
                                    <span className="font-medium">${formData.proposed_hourly_rate}/hr</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Estimated Hours:</span>
                                    <span className="font-medium">{formData.estimated_hours} hours</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Estimated Total:</span>
                                    <span className="font-medium">
                                      ${((formData.proposed_hourly_rate || 0) * (formData.estimated_hours || 0)).toLocaleString()}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Milestones</h4>
                            {formData.milestones.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No milestones added</p>
                            ) : (
                              <div className="space-y-2 text-sm">
                                {formData.milestones.map((milestone, index) => (
                                  <div key={index} className="flex justify-between">
                                    <span>{milestone.title}</span>
                                    <span className="font-medium">${milestone.amount.toLocaleString()}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between font-medium border-t pt-2">
                                  <span>Total:</span>
                                  <span>${getTotalMilestoneAmount().toLocaleString()}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Before you submit:</h4>
                            <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1">
                              <li>• Make sure your proposal addresses the client's specific needs</li>
                              <li>• Double-check your pricing and timeline</li>
                              <li>• Ensure your profile is complete and professional</li>
                              <li>• You can edit your proposal until the client responds</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setCurrentTab('pricing')}>
                          Previous
                        </Button>
                        <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
                          {submitting ? 'Submitting...' : 'Submit Proposal'}
                          <CheckCircle className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </form>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}