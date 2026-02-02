import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, X, Upload, DollarSign, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ProjectService, CategoryService } from '@/lib/freelancing-service';
import type { CreateProjectForm, ProjectCategory } from '@/types/freelancing';
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

const COMMON_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'PHP', 'Java', 'C++',
  'HTML/CSS', 'Vue.js', 'Angular', 'Django', 'Laravel', 'WordPress', 'Shopify',
  'UI/UX Design', 'Graphic Design', 'Logo Design', 'Figma', 'Adobe Creative Suite',
  'Content Writing', 'Copywriting', 'SEO', 'Social Media Marketing', 'Google Ads',
  'Data Analysis', 'Machine Learning', 'AI', 'Excel', 'SQL', 'Tableau',
  'Video Editing', 'Motion Graphics', 'After Effects', 'Premiere Pro',
  'Project Management', 'Business Analysis', 'Consulting', 'Strategy'
];

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  
  const [formData, setFormData] = useState<CreateProjectForm>({
    title: '',
    description: '',
    category_id: '',
    budget_type: 'fixed',
    budget_min: undefined,
    budget_max: undefined,
    hourly_rate_min: undefined,
    hourly_rate_max: undefined,
    estimated_hours: undefined,
    duration_type: 'weeks',
    duration_value: undefined,
    skills_required: [],
    experience_level: 'any',
    project_type: 'one-time',
    remote_ok: true,
    location_required: '',
    requirements: '',
    deadline: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (field: keyof CreateProjectForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skills_required.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills_required: [...prev.skills_required, skill]
      }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills_required: prev.skills_required.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const project = await ProjectService.create(formData);
      
      toast({
        title: 'Success!',
        description: 'Your project has been posted successfully.',
      });
      
      navigate(`/business/projects/${project.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Project title is required',
        variant: 'destructive'
      });
      return false;
    }
    
    if (!formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Project description is required',
        variant: 'destructive'
      });
      return false;
    }
    
    if (!formData.category_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a category',
        variant: 'destructive'
      });
      return false;
    }
    
    if (formData.skills_required.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one required skill',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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
              <Link to="/business-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Post a New Project</h1>
              <p className="text-muted-foreground mt-2">
                Find the perfect freelancer for your project
              </p>
            </div>
          </motion.div>

          {/* Progress Steps */}
          <motion.div variants={item} className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>
                      Tell us about your project and what you need
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Project Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Build a responsive e-commerce website"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Project Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your project in detail. What do you want to achieve? What are the key requirements?"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requirements">Additional Requirements</Label>
                      <Textarea
                        id="requirements"
                        placeholder="Any specific requirements, preferences, or constraints?"
                        value={formData.requirements}
                        onChange={(e) => handleInputChange('requirements', e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="button" onClick={nextStep}>
                        Next Step
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Budget and Timeline */}
            {currentStep === 2 && (
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle>Budget & Timeline</CardTitle>
                    <CardDescription>
                      Set your budget and project timeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Budget Type *</Label>
                      <RadioGroup
                        value={formData.budget_type}
                        onValueChange={(value: 'fixed' | 'hourly') => handleInputChange('budget_type', value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixed" id="fixed" />
                          <Label htmlFor="fixed" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Fixed Price - Pay a set amount for the entire project
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hourly" id="hourly" />
                          <Label htmlFor="hourly" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Hourly Rate - Pay for time worked
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {formData.budget_type === 'fixed' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="budget_min">Minimum Budget ($)</Label>
                          <Input
                            id="budget_min"
                            type="number"
                            placeholder="1000"
                            value={formData.budget_min || ''}
                            onChange={(e) => handleInputChange('budget_min', parseFloat(e.target.value) || undefined)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="budget_max">Maximum Budget ($)</Label>
                          <Input
                            id="budget_max"
                            type="number"
                            placeholder="5000"
                            value={formData.budget_max || ''}
                            onChange={(e) => handleInputChange('budget_max', parseFloat(e.target.value) || undefined)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="hourly_min">Min Hourly Rate ($)</Label>
                          <Input
                            id="hourly_min"
                            type="number"
                            placeholder="25"
                            value={formData.hourly_rate_min || ''}
                            onChange={(e) => handleInputChange('hourly_rate_min', parseFloat(e.target.value) || undefined)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hourly_max">Max Hourly Rate ($)</Label>
                          <Input
                            id="hourly_max"
                            type="number"
                            placeholder="75"
                            value={formData.hourly_rate_max || ''}
                            onChange={(e) => handleInputChange('hourly_rate_max', parseFloat(e.target.value) || undefined)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration_value">Project Duration</Label>
                        <Input
                          id="duration_value"
                          type="number"
                          placeholder="4"
                          value={formData.duration_value || ''}
                          onChange={(e) => handleInputChange('duration_value', parseInt(e.target.value) || undefined)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration_type">Duration Unit</Label>
                        <Select value={formData.duration_type} onValueChange={(value: 'days' | 'weeks' | 'months') => handleInputChange('duration_type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deadline">Project Deadline (Optional)</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => handleInputChange('deadline', e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Previous
                      </Button>
                      <Button type="button" onClick={nextStep}>
                        Next Step
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Skills and Preferences */}
            {currentStep === 3 && (
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Preferences</CardTitle>
                    <CardDescription>
                      Specify the skills and experience level you need
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Required Skills *</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a skill and press Enter"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill(skillInput);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addSkill(skillInput)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Common Skills */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Popular Skills:</Label>
                        <div className="flex flex-wrap gap-2">
                          {COMMON_SKILLS.filter(skill => !formData.skills_required.includes(skill)).slice(0, 12).map((skill) => (
                            <Button
                              key={skill}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSkill(skill)}
                              className="text-xs"
                            >
                              {skill}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Selected Skills */}
                      {formData.skills_required.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm">Selected Skills:</Label>
                          <div className="flex flex-wrap gap-2">
                            {formData.skills_required.map((skill) => (
                              <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                                {skill}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => removeSkill(skill)}
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Experience Level</Label>
                      <Select value={formData.experience_level} onValueChange={(value: any) => handleInputChange('experience_level', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Experience Level</SelectItem>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Project Type</Label>
                      <Select value={formData.project_type} onValueChange={(value: 'one-time' | 'ongoing') => handleInputChange('project_type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-time">One-time Project</SelectItem>
                          <SelectItem value="ongoing">Ongoing Work</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remote_ok"
                        checked={formData.remote_ok}
                        onCheckedChange={(checked) => handleInputChange('remote_ok', checked)}
                      />
                      <Label htmlFor="remote_ok">Remote work is acceptable</Label>
                    </div>

                    {!formData.remote_ok && (
                      <div className="space-y-2">
                        <Label htmlFor="location_required">Required Location</Label>
                        <Input
                          id="location_required"
                          placeholder="e.g., New York, NY or United States"
                          value={formData.location_required}
                          onChange={(e) => handleInputChange('location_required', e.target.value)}
                        />
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Previous
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Posting Project...' : 'Post Project'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </MainLayout>
  );
}