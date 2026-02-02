import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Plus, X, Upload, User, Award, BookOpen, 
  Briefcase, MapPin, Globe, Clock, DollarSign, Camera,
  Star, Shield, CheckCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { FreelancerProfileService } from '@/lib/freelancing-service';
import type { FreelancerProfileForm, Education, WorkExperience, Certification, PortfolioItem } from '@/types/freelancing';
import { useAuth } from '@/hooks/useAuth';
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

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese (Mandarin)', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch'
];

const TIMEZONES = [
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00',
  'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00',
  'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00',
  'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'
];

export default function FreelancerProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState<FreelancerProfileForm>({
    title: '',
    description: '',
    hourly_rate: undefined,
    skills: [],
    languages: [],
    experience_level: 'beginner',
    location: '',
    timezone: '',
    portfolio_items: [],
    certifications: [],
    education: [],
    work_experience: []
  });

  const [newEducation, setNewEducation] = useState<Omit<Education, 'id'>>({
    institution: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    description: ''
  });

  const [newExperience, setNewExperience] = useState<Omit<WorkExperience, 'id'>>({
    company: '',
    position: '',
    start_date: '',
    end_date: '',
    description: '',
    is_current: false
  });

  const [newCertification, setNewCertification] = useState<Omit<Certification, 'id'>>({
    name: '',
    issuer: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    credential_url: ''
  });

  const [newPortfolioItem, setNewPortfolioItem] = useState<Omit<PortfolioItem, 'id' | 'freelancer_id' | 'created_at' | 'updated_at'>>({
    title: '',
    description: '',
    category: '',
    skills_used: [],
    images: [],
    project_url: '',
    completion_date: '',
    is_featured: false,
    sort_order: 0
  });

  const handleInputChange = (field: keyof FreelancerProfileForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addLanguage = (language: string) => {
    if (language && !formData.languages.includes(language)) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, language]
      }));
    }
  };

  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  const addEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, { ...newEducation, id: Date.now().toString() }]
      }));
      setNewEducation({
        institution: '',
        degree: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        description: ''
      });
    }
  };

  const removeEducation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter(e => e.id !== id)
    }));
  };

  const addExperience = () => {
    if (newExperience.company && newExperience.position) {
      setFormData(prev => ({
        ...prev,
        work_experience: [...prev.work_experience, { ...newExperience, id: Date.now().toString() }]
      }));
      setNewExperience({
        company: '',
        position: '',
        start_date: '',
        end_date: '',
        description: '',
        is_current: false
      });
    }
  };

  const removeExperience = (id: string) => {
    setFormData(prev => ({
      ...prev,
      work_experience: prev.work_experience.filter(e => e.id !== id)
    }));
  };

  const addCertification = () => {
    if (newCertification.name && newCertification.issuer) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, { ...newCertification, id: Date.now().toString() }]
      }));
      setNewCertification({
        name: '',
        issuer: '',
        issue_date: '',
        expiry_date: '',
        credential_id: '',
        credential_url: ''
      });
    }
  };

  const removeCertification = (id: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c.id !== id)
    }));
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem.title && newPortfolioItem.description) {
      setFormData(prev => ({
        ...prev,
        portfolio_items: [...prev.portfolio_items, { 
          ...newPortfolioItem, 
          id: Date.now().toString(),
          freelancer_id: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      }));
      setNewPortfolioItem({
        title: '',
        description: '',
        category: '',
        skills_used: [],
        images: [],
        project_url: '',
        completion_date: '',
        is_featured: false,
        sort_order: 0
      });
    }
  };

  const removePortfolioItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      portfolio_items: prev.portfolio_items.filter(p => p.id !== id)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getProfileCompletionPercentage = () => {
    let completed = 0;
    const total = 12;
    
    if (formData.title) completed++;
    if (formData.description) completed++;
    if (formData.hourly_rate) completed++;
    if (formData.skills.length > 0) completed++;
    if (formData.languages.length > 0) completed++;
    if (formData.location) completed++;
    if (formData.timezone) completed++;
    if (profileImagePreview) completed++;
    if (formData.education.length > 0) completed++;
    if (formData.work_experience.length > 0) completed++;
    if (formData.certifications.length > 0) completed++;
    if (formData.portfolio_items.length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const profile = await FreelancerProfileService.create(formData);
      
      toast({
        title: 'Success!',
        description: 'Your freelancer profile has been created successfully.',
      });
      
      navigate('/freelancer-dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create profile',
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
        description: 'Professional title is required',
        variant: 'destructive'
      });
      return false;
    }
    
    if (!formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Profile description is required',
        variant: 'destructive'
      });
      return false;
    }
    
    if (formData.skills.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one skill',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (currentStep < 4) {
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
              <Link to="/freelancer-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">Complete Your Freelancer Profile</h1>
              <p className="text-muted-foreground mt-2">
                Build a compelling profile to attract clients and win projects
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{getProfileCompletionPercentage()}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <motion.div variants={item}>
            <Progress value={getProfileCompletionPercentage()} className="h-2" />
          </motion.div>

          {/* Progress Steps */}
          <motion.div variants={item} className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step}
                </div>
                {step < 4 && (
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
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      Tell clients about yourself and your professional background
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Image */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {profileImagePreview ? (
                            <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">Profile Photo</h3>
                        <p className="text-sm text-muted-foreground">
                          Upload a professional photo to build trust with clients
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Professional Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Full-Stack Developer, UI/UX Designer, Content Writer"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Professional Summary *</Label>
                      <Textarea
                        id="description"
                        placeholder="Write a compelling summary of your experience, skills, and what makes you unique..."
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.description.length}/1000 characters
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="hourly_rate"
                            type="number"
                            placeholder="50"
                            value={formData.hourly_rate || ''}
                            onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value) || undefined)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience_level">Experience Level</Label>
                        <Select value={formData.experience_level} onValueChange={(value: any) => handleInputChange('experience_level', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                            <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                            <SelectItem value="expert">Expert (5+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="location"
                            placeholder="e.g., New York, NY, USA"
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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

            {/* Step 2: Skills & Languages */}
            {currentStep === 2 && (
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Skills & Languages
                    </CardTitle>
                    <CardDescription>
                      Showcase your expertise and language capabilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Skills */}
                    <div className="space-y-4">
                      <Label>Skills *</Label>
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
                      
                      {/* Popular Skills */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Popular Skills:</Label>
                        <div className="flex flex-wrap gap-2">
                          {COMMON_SKILLS.filter(skill => !formData.skills.includes(skill)).slice(0, 15).map((skill) => (
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
                      {formData.skills.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm">Your Skills:</Label>
                          <div className="flex flex-wrap gap-2">
                            {formData.skills.map((skill) => (
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

                    {/* Languages */}
                    <div className="space-y-4">
                      <Label>Languages</Label>
                      <Select onValueChange={addLanguage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Add a language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.filter(lang => !formData.languages.includes(lang)).map((language) => (
                            <SelectItem key={language} value={language}>{language}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {formData.languages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.languages.map((language) => (
                            <Badge key={language} variant="outline" className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {language}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeLanguage(language)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
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

            {/* Step 3: Experience & Education */}
            {currentStep === 3 && (
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Experience & Education
                    </CardTitle>
                    <CardDescription>
                      Add your work experience, education, and certifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="experience" className="space-y-6">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="experience">Work Experience</TabsTrigger>
                        <TabsTrigger value="education">Education</TabsTrigger>
                        <TabsTrigger value="certifications">Certifications</TabsTrigger>
                      </TabsList>

                      {/* Work Experience */}
                      <TabsContent value="experience" className="space-y-4">
                        <div className="space-y-4 p-4 border rounded-lg">
                          <h4 className="font-medium">Add Work Experience</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="Company name"
                              value={newExperience.company}
                              onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                            />
                            <Input
                              placeholder="Position/Role"
                              value={newExperience.position}
                              onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))}
                            />
                            <Input
                              type="date"
                              placeholder="Start date"
                              value={newExperience.start_date}
                              onChange={(e) => setNewExperience(prev => ({ ...prev, start_date: e.target.value }))}
                            />
                            <Input
                              type="date"
                              placeholder="End date"
                              value={newExperience.end_date}
                              onChange={(e) => setNewExperience(prev => ({ ...prev, end_date: e.target.value }))}
                              disabled={newExperience.is_current}
                            />
                          </div>
                          <Textarea
                            placeholder="Describe your responsibilities and achievements..."
                            value={newExperience.description}
                            onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={newExperience.is_current}
                                onChange={(e) => setNewExperience(prev => ({ ...prev, is_current: e.target.checked }))}
                              />
                              I currently work here
                            </label>
                            <Button type="button" onClick={addExperience}>
                              Add Experience
                            </Button>
                          </div>
                        </div>

                        {formData.work_experience.map((exp) => (
                          <div key={exp.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{exp.position}</h4>
                                <p className="text-sm text-muted-foreground">{exp.company}</p>
                                <p className="text-xs text-muted-foreground">
                                  {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                                </p>
                                {exp.description && (
                                  <p className="text-sm mt-2">{exp.description}</p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExperience(exp.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </TabsContent>

                      {/* Education */}
                      <TabsContent value="education" className="space-y-4">
                        <div className="space-y-4 p-4 border rounded-lg">
                          <h4 className="font-medium">Add Education</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="Institution name"
                              value={newEducation.institution}
                              onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
                            />
                            <Input
                              placeholder="Degree"
                              value={newEducation.degree}
                              onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
                            />
                            <Input
                              placeholder="Field of study"
                              value={newEducation.field_of_study}
                              onChange={(e) => setNewEducation(prev => ({ ...prev, field_of_study: e.target.value }))}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="date"
                                placeholder="Start date"
                                value={newEducation.start_date}
                                onChange={(e) => setNewEducation(prev => ({ ...prev, start_date: e.target.value }))}
                              />
                              <Input
                                type="date"
                                placeholder="End date"
                                value={newEducation.end_date}
                                onChange={(e) => setNewEducation(prev => ({ ...prev, end_date: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button type="button" onClick={addEducation}>
                              Add Education
                            </Button>
                          </div>
                        </div>

                        {formData.education.map((edu) => (
                          <div key={edu.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{edu.degree}</h4>
                                <p className="text-sm text-muted-foreground">{edu.institution}</p>
                                <p className="text-xs text-muted-foreground">
                                  {edu.field_of_study} • {edu.start_date} - {edu.end_date}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEducation(edu.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </TabsContent>

                      {/* Certifications */}
                      <TabsContent value="certifications" className="space-y-4">
                        <div className="space-y-4 p-4 border rounded-lg">
                          <h4 className="font-medium">Add Certification</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="Certification name"
                              value={newCertification.name}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <Input
                              placeholder="Issuing organization"
                              value={newCertification.issuer}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, issuer: e.target.value }))}
                            />
                            <Input
                              type="date"
                              placeholder="Issue date"
                              value={newCertification.issue_date}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, issue_date: e.target.value }))}
                            />
                            <Input
                              type="date"
                              placeholder="Expiry date (optional)"
                              value={newCertification.expiry_date}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, expiry_date: e.target.value }))}
                            />
                            <Input
                              placeholder="Credential ID (optional)"
                              value={newCertification.credential_id}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, credential_id: e.target.value }))}
                            />
                            <Input
                              placeholder="Credential URL (optional)"
                              value={newCertification.credential_url}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, credential_url: e.target.value }))}
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button type="button" onClick={addCertification}>
                              Add Certification
                            </Button>
                          </div>
                        </div>

                        {formData.certifications.map((cert) => (
                          <div key={cert.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{cert.name}</h4>
                                <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                                <p className="text-xs text-muted-foreground">
                                  Issued: {cert.issue_date}
                                  {cert.expiry_date && ` • Expires: ${cert.expiry_date}`}
                                </p>
                                {cert.credential_url && (
                                  <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                    View Credential
                                  </a>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCertification(cert.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>

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

            {/* Step 4: Portfolio & Review */}
            {currentStep === 4 && (
              <motion.div variants={item} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Portfolio & Final Review
                    </CardTitle>
                    <CardDescription>
                      Add portfolio items and review your profile before publishing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Portfolio Items */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Portfolio Items (Optional)</h4>
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="Project title"
                            value={newPortfolioItem.title}
                            onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, title: e.target.value }))}
                          />
                          <Input
                            placeholder="Category"
                            value={newPortfolioItem.category}
                            onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, category: e.target.value }))}
                          />
                        </div>
                        <Textarea
                          placeholder="Project description..."
                          value={newPortfolioItem.description}
                          onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="Project URL (optional)"
                            value={newPortfolioItem.project_url}
                            onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, project_url: e.target.value }))}
                          />
                          <Input
                            type="date"
                            placeholder="Completion date"
                            value={newPortfolioItem.completion_date}
                            onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, completion_date: e.target.value }))}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button type="button" onClick={addPortfolioItem}>
                            Add Portfolio Item
                          </Button>
                        </div>
                      </div>

                      {formData.portfolio_items.map((item) => (
                        <div key={item.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{item.title}</h4>
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                              <p className="text-sm mt-2">{item.description}</p>
                              {item.project_url && (
                                <a href={item.project_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                  View Project
                                </a>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePortfolioItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Profile Summary */}
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Profile Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Title:</span>
                          <p className="font-medium">{formData.title || 'Not set'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hourly Rate:</span>
                          <p className="font-medium">${formData.hourly_rate || 'Not set'}/hr</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Skills:</span>
                          <p className="font-medium">{formData.skills.length} skills</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Languages:</span>
                          <p className="font-medium">{formData.languages.length} languages</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Experience:</span>
                          <p className="font-medium">{formData.work_experience.length} positions</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Education:</span>
                          <p className="font-medium">{formData.education.length} degrees</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={prevStep}>
                        Previous
                      </Button>
                      <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading ? 'Creating Profile...' : 'Complete Profile'}
                        <CheckCircle className="ml-2 h-4 w-4" />
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