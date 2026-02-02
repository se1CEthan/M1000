import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Star, MapPin, Clock, DollarSign, 
  Award, Eye, Heart, MessageSquare, User, TrendingUp,
  Globe, CheckCircle, Bookmark, BookmarkCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FreelancerProfileService } from '@/lib/freelancing-service';
import type { FreelancerProfile, FreelancerSearchFilters } from '@/types/freelancing';
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

const POPULAR_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'PHP', 'Java',
  'UI/UX Design', 'Graphic Design', 'Content Writing', 'SEO', 'WordPress',
  'Data Analysis', 'Machine Learning', 'Video Editing', 'Social Media'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch'
];

export default function FreelancerSearch() {
  const { toast } = useToast();
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [savedFreelancers, setSavedFreelancers] = useState<Set<string>>(new Set());
  
  const [filters, setFilters] = useState<FreelancerSearchFilters>({
    sort_by: 'rating',
    sort_order: 'desc'
  });

  const [hourlyRateRange, setHourlyRateRange] = useState([0, 200]);

  useEffect(() => {
    searchFreelancers();
  }, [filters, searchQuery]);

  const searchFreelancers = async () => {
    try {
      setLoading(true);
      const searchFilters: FreelancerSearchFilters = {
        ...filters,
        hourly_rate_min: hourlyRateRange[0] > 0 ? hourlyRateRange[0] : undefined,
        hourly_rate_max: hourlyRateRange[1] < 200 ? hourlyRateRange[1] : undefined
      };

      const result = await FreelancerProfileService.search(searchFilters, 1, 20);
      setFreelancers(result.data);
    } catch (error) {
      console.error('Error searching freelancers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load freelancers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FreelancerSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSkillFilter = (skill: string) => {
    const currentSkills = filters.skills || [];
    if (currentSkills.includes(skill)) {
      handleFilterChange('skills', currentSkills.filter(s => s !== skill));
    } else {
      handleFilterChange('skills', [...currentSkills, skill]);
    }
  };

  const toggleLanguageFilter = (language: string) => {
    const currentLanguages = filters.languages || [];
    if (currentLanguages.includes(language)) {
      handleFilterChange('languages', currentLanguages.filter(l => l !== language));
    } else {
      handleFilterChange('languages', [...currentLanguages, language]);
    }
  };

  const toggleSaveFreelancer = (freelancerId: string) => {
    setSavedFreelancers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(freelancerId)) {
        newSet.delete(freelancerId);
        toast({
          title: 'Freelancer unsaved',
          description: 'Freelancer removed from your saved list'
        });
      } else {
        newSet.add(freelancerId);
        toast({
          title: 'Freelancer saved',
          description: 'Freelancer added to your saved list'
        });
      }
      return newSet;
    });
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating 
                ? 'text-yellow-500 fill-current' 
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-500';
      case 'busy': return 'text-yellow-500';
      case 'unavailable': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  if (loading && freelancers.length === 0) {
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
            <h1 className="text-4xl font-bold text-foreground">Find Top Freelancers</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover talented professionals ready to bring your projects to life
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div variants={item} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by skills, name, or expertise..."
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
                      <Label>Experience Level</Label>
                      <Select 
                        value={filters.experience_level?.[0] || ''} 
                        onValueChange={(value) => handleFilterChange('experience_level', value ? [value] : undefined)}
                      >
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
                      <Label>Availability</Label>
                      <Select 
                        value={filters.availability?.[0] || ''} 
                        onValueChange={(value) => handleFilterChange('availability', value ? [value] : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any availability" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any availability</SelectItem>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="busy">Busy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="City, Country"
                        value={filters.location || ''}
                        onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Sort By</Label>
                      <Select value={filters.sort_by || 'rating'} onValueChange={(value) => handleFilterChange('sort_by', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Highest Rated</SelectItem>
                          <SelectItem value="total_earnings">Top Earners</SelectItem>
                          <SelectItem value="hourly_rate">Hourly Rate</SelectItem>
                          <SelectItem value="created_at">Newest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Hourly Rate: ${hourlyRateRange[0]} - ${hourlyRateRange[1]}</Label>
                      <Slider
                        value={hourlyRateRange}
                        onValueChange={setHourlyRateRange}
                        max={200}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Skills</Label>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_SKILLS.map((skill) => (
                          <Button
                            key={skill}
                            variant={filters.skills?.includes(skill) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleSkillFilter(skill)}
                            className="text-xs"
                          >
                            {skill}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Languages</Label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.slice(0, 8).map((language) => (
                          <Button
                            key={language}
                            variant={filters.languages?.includes(language) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleLanguageFilter(language)}
                            className="text-xs"
                          >
                            {language}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified_only"
                        checked={filters.is_verified}
                        onCheckedChange={(checked) => handleFilterChange('is_verified', checked)}
                      />
                      <Label htmlFor="verified_only">Verified freelancers only</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Results Summary */}
          <motion.div variants={item} className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {freelancers.length} freelancers found
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Updated {loading ? 'now' : 'just now'}
            </div>
          </motion.div>

          {/* Freelancers Grid */}
          <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freelancers.length === 0 ? (
              <motion.div variants={item} className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No freelancers found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or filters
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              freelancers.map((freelancer) => (
                <motion.div key={freelancer.id} variants={item}>
                  <Card className="hover:shadow-lg transition-all duration-300 h-full">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={freelancer.profile_image_url} />
                              <AvatarFallback>
                                {freelancer.title?.charAt(0) || 'F'}
                              </AvatarFallback>
                            </Avatar>
                            {freelancer.is_online && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{freelancer.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {freelancer.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {freelancer.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {freelancer.is_verified && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSaveFreelancer(freelancer.id)}
                            className="p-1"
                          >
                            {savedFreelancers.has(freelancer.id) ? (
                              <BookmarkCheck className="h-4 w-4 text-primary" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Rating and Stats */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {renderStarRating(freelancer.rating)}
                          <span className="text-sm font-medium">{freelancer.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">
                            ({freelancer.rating_count} reviews)
                          </span>
                        </div>
                        
                        <Badge 
                          variant="outline" 
                          className={getAvailabilityColor(freelancer.availability)}
                        >
                          {freelancer.availability}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {freelancer.description}
                      </p>

                      {/* Skills */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {freelancer.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {freelancer.skills.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{freelancer.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Hourly Rate:</span>
                          <p className="font-medium">${freelancer.hourly_rate}/hr</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Jobs Done:</span>
                          <p className="font-medium">{freelancer.total_jobs}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success Rate:</span>
                          <p className="font-medium">{freelancer.completion_rate}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Response Time:</span>
                          <p className="font-medium">{freelancer.response_time}h</p>
                        </div>
                      </div>

                      {/* Languages */}
                      {freelancer.languages.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            <span>{freelancer.languages.slice(0, 3).join(', ')}</span>
                            {freelancer.languages.length > 3 && (
                              <span>+{freelancer.languages.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                        <Button size="sm" className="flex-1">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </div>

                      {/* Portfolio Preview */}
                      {freelancer.portfolio_items.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Portfolio</span>
                            <span className="text-xs text-muted-foreground">
                              {freelancer.portfolio_items.length} items
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {freelancer.portfolio_items.slice(0, 3).map((item, index) => (
                              <div key={index} className="aspect-square bg-muted rounded overflow-hidden">
                                {item.images.length > 0 ? (
                                  <img 
                                    src={item.images[0]} 
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Load More */}
          {freelancers.length > 0 && (
            <motion.div variants={item} className="text-center">
              <Button variant="outline" size="lg" onClick={searchFreelancers} disabled={loading}>
                {loading ? 'Loading...' : 'Load More Freelancers'}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}