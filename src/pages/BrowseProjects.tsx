import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  Search, Filter, DollarSign, Clock, Users, MapPin, Star, 
  Bookmark, BookmarkCheck, Eye, Calendar, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ProjectService, CategoryService } from '@/lib/freelancing-service';
import type { Project, ProjectCategory, ProjectSearchFilters } from '@/types/freelancing';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function BrowseProjects() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [savedProjects, setSavedProjects] = useState<Set<string>>(new Set());
  
  const [filters, setFilters] = useState<ProjectSearchFilters>({
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const [budgetRange, setBudgetRange] = useState([0, 10000]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    searchProjects();
  }, [filters, searchQuery]);

  const loadInitialData = async () => {
    try {
      const [projectsData, categoriesData] = await Promise.all([
        ProjectService.search({}, 1, 20),
        CategoryService.getAll()
      ]);
      
      setProjects(projectsData.data);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const searchProjects = async () => {
    try {
      setLoading(true);
      const searchFilters: ProjectSearchFilters = {
        ...filters,
        budget_min: budgetRange[0] > 0 ? budgetRange[0] : undefined,
        budget_max: budgetRange[1] < 10000 ? budgetRange[1] : undefined
      };

      const result = await ProjectService.search(searchFilters, 1, 20);
      setProjects(result.data);
    } catch (error) {
      console.error('Error searching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ProjectSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSaveProject = (projectId: string) => {
    setSavedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
        toast({
          title: 'Project unsaved',
          description: 'Project removed from your saved list'
        });
      } else {
        newSet.add(projectId);
        toast({
          title: 'Project saved',
          description: 'Project added to your saved list'
        });
      }
      return newSet;
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just posted';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && projects.length === 0) {
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
          <motion.div variants={item} className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Find Your Next Project</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover opportunities that match your skills and grow your freelancing career
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div variants={item} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search projects by title, description, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={filters.category_id || ''} onValueChange={(value) => handleFilterChange('category_id', value || undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Budget Type</Label>
                      <Select value={filters.budget_type || ''} onValueChange={(value) => handleFilterChange('budget_type', value || undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any budget type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any budget type</SelectItem>
                          <SelectItem value="fixed">Fixed Price</SelectItem>
                          <SelectItem value="hourly">Hourly Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Experience Level</Label>
                      <Select value={filters.experience_level?.[0] || ''} onValueChange={(value) => handleFilterChange('experience_level', value ? [value] : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any level</SelectItem>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Sort By</Label>
                      <Select value={filters.sort_by || 'created_at'} onValueChange={(value) => handleFilterChange('sort_by', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at">Newest First</SelectItem>
                          <SelectItem value="budget_max">Highest Budget</SelectItem>
                          <SelectItem value="proposals_count">Fewest Proposals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Budget Range: ${budgetRange[0]} - ${budgetRange[1]}</Label>
                      <Slider
                        value={budgetRange}
                        onValueChange={setBudgetRange}
                        max={10000}
                        min={0}
                        step={100}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remote_ok"
                        checked={filters.remote_ok}
                        onCheckedChange={(checked) => handleFilterChange('remote_ok', checked)}
                      />
                      <Label htmlFor="remote_ok">Remote work only</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Results Summary */}
          <motion.div variants={item} className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {projects.length} projects found
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Updated {loading ? 'now' : 'just now'}
            </div>
          </motion.div>

          {/* Projects Grid */}
          <motion.div variants={container} className="space-y-6">
            {projects.length === 0 ? (
              <motion.div variants={item}>
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or filters
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              projects.map((project) => (
                <motion.div key={project.id} variants={item}>
                  <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold hover:text-primary cursor-pointer">
                              <Link to={`/freelancer/projects/${project.id}`}>
                                {project.title}
                              </Link>
                            </h3>
                            {project.featured && (
                              <Badge variant="destructive" className="text-xs">
                                Featured
                              </Badge>
                            )}
                            {project.urgent && (
                              <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-muted-foreground mb-4 line-clamp-3">
                            {project.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {project.budget_type === 'fixed' 
                                ? `$${project.budget_min?.toLocaleString()}-$${project.budget_max?.toLocaleString()}` 
                                : `$${project.hourly_rate_min}-$${project.hourly_rate_max}/hr`
                              }
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {project.duration_value} {project.duration_type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {project.proposals_count} proposals
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {project.views_count} views
                            </span>
                            {project.location_required && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {project.location_required}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.skills_required.slice(0, 5).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {project.skills_required.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.skills_required.length - 5} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary">
                                    {project.business?.company_name?.charAt(0) || 'B'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{project.business?.company_name}</p>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    <span className="text-xs text-muted-foreground">
                                      {project.business?.avg_rating?.toFixed(1) || 'New'} 
                                      {project.business?.rating_count ? ` (${project.business.rating_count})` : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <Badge variant="outline" className="text-xs">
                                {project.category?.name}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(project.created_at)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSaveProject(project.id)}
                                className="p-2"
                              >
                                {savedProjects.has(project.id) ? (
                                  <BookmarkCheck className="h-4 w-4 text-primary" />
                                ) : (
                                  <Bookmark className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {project.deadline ? (
                            <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                          ) : (
                            <span>No deadline specified</span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/freelancer/projects/${project.id}`}>
                              View Details
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link to={`/freelancer/projects/${project.id}/proposal`}>
                              Submit Proposal
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Load More */}
          {projects.length > 0 && (
            <motion.div variants={item} className="text-center">
              <Button variant="outline" size="lg" onClick={searchProjects} disabled={loading}>
                {loading ? 'Loading...' : 'Load More Projects'}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}