import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { 
  Star, ArrowLeft, User, Award, MessageSquare, ThumbsUp,
  Calendar, CheckCircle, AlertCircle, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { ContractService, ReviewService } from '@/lib/freelancing-service';
import type { Contract, Review } from '@/types/freelancing';
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

const SKILL_CATEGORIES = [
  { key: 'communication', label: 'Communication' },
  { key: 'quality', label: 'Quality of Work' },
  { key: 'timeliness', label: 'Timeliness' },
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'expertise', label: 'Technical Expertise' }
];

export default function ReviewSystem() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    skillsRating: {} as Record<string, number>
  });

  useEffect(() => {
    if (contractId) {
      loadContractAndReviews();
    }
  }, [contractId]);

  const loadContractAndReviews = async () => {
    try {
      setLoading(true);
      const contractData = await ContractService.getById(contractId!);
      if (!contractData) {
        toast({
          title: 'Error',
          description: 'Contract not found',
          variant: 'destructive'
        });
        navigate('/freelancer/contracts');
        return;
      }
      
      setContract(contractData);
      
      // Initialize skills rating
      const initialSkillsRating: Record<string, number> = {};
      SKILL_CATEGORIES.forEach(skill => {
        initialSkillsRating[skill.key] = 5;
      });
      setReviewForm(prev => ({ ...prev, skillsRating: initialSkillsRating }));

      // Load existing reviews (if any)
      // This would typically load reviews for the other party
      // For now, we'll just set an empty array
      setReviews([]);
    } catch (error) {
      console.error('Error loading contract:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contract details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract) return;

    try {
      setSubmitting(true);
      
      // Determine reviewee ID (the other party in the contract)
      const revieweeId = contract.business_id; // Assuming freelancer is reviewing business
      
      await ReviewService.create(
        contract.id,
        revieweeId,
        reviewForm.rating,
        reviewForm.comment,
        reviewForm.skillsRating
      );
      
      toast({
        title: 'Success!',
        description: 'Your review has been submitted successfully.',
      });
      
      setShowReviewForm(false);
      // Optionally reload reviews or navigate away
      navigate('/freelancer/contracts');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'text-yellow-500 fill-current' 
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderInteractiveStarRating = (
    rating: number, 
    onChange: (rating: number) => void,
    size: 'sm' | 'md' | 'lg' = 'md'
  ) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} cursor-pointer transition-colors ${
              star <= rating 
                ? 'text-yellow-500 fill-current hover:text-yellow-600' 
                : 'text-muted-foreground hover:text-yellow-400'
            }`}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    );
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
              <Link to={`/freelancer/contracts/${contractId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contract
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Review & Feedback</h1>
              <p className="text-muted-foreground mt-2">
                Share your experience working on "{contract.title}"
              </p>
            </div>
          </motion.div>

          {/* Contract Summary */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Contract Summary</span>
                  <Badge variant={
                    contract.status === 'completed' ? 'default' : 'secondary'
                  }>
                    {contract.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Project:</span>
                      <p className="font-medium">{contract.title}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Client:</span>
                      <p className="font-medium">{contract.business?.company_name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Duration:</span>
                      <p className="font-medium">
                        {new Date(contract.start_date).toLocaleDateString()} - 
                        {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Ongoing'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Contract Value:</span>
                      <p className="font-medium">
                        {contract.contract_type === 'fixed' 
                          ? `$${contract.total_amount?.toLocaleString()}` 
                          : `$${contract.hourly_rate}/hr`
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Milestones:</span>
                      <p className="font-medium">
                        {contract.milestones.filter(m => m.status === 'completed').length} / {contract.milestones.length} completed
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Review Form */}
          {!showReviewForm ? (
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Leave a Review
                  </CardTitle>
                  <CardDescription>
                    Help other freelancers by sharing your experience with this client
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Review?</h3>
                    <p className="text-muted-foreground mb-6">
                      Your honest feedback helps build trust in our community
                    </p>
                    <Button onClick={() => setShowReviewForm(true)} size="lg">
                      <Star className="h-4 w-4 mr-2" />
                      Write Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>Write Your Review</CardTitle>
                  <CardDescription>
                    Rate your experience and provide feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    {/* Overall Rating */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Overall Rating</Label>
                      <div className="flex items-center gap-4">
                        {renderInteractiveStarRating(
                          reviewForm.rating,
                          (rating) => setReviewForm(prev => ({ ...prev, rating })),
                          'lg'
                        )}
                        <span className="text-lg font-medium">{reviewForm.rating}/5</span>
                      </div>
                    </div>

                    {/* Skills Rating */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Rate Specific Areas</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SKILL_CATEGORIES.map((skill) => (
                          <div key={skill.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">{skill.label}</Label>
                              <span className="text-sm font-medium">
                                {reviewForm.skillsRating[skill.key]}/5
                              </span>
                            </div>
                            <Slider
                              value={[reviewForm.skillsRating[skill.key]]}
                              onValueChange={(value) => 
                                setReviewForm(prev => ({
                                  ...prev,
                                  skillsRating: { ...prev.skillsRating, [skill.key]: value[0] }
                                }))
                              }
                              max={5}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Written Review */}
                    <div className="space-y-2">
                      <Label htmlFor="comment" className="text-base font-medium">
                        Your Review
                      </Label>
                      <Textarea
                        id="comment"
                        placeholder="Share your experience working with this client. What went well? What could be improved? Your honest feedback helps other freelancers make informed decisions."
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        rows={6}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        {reviewForm.comment.length}/1000 characters
                      </p>
                    </div>

                    {/* Review Guidelines */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Review Guidelines
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Be honest and constructive in your feedback</li>
                        <li>• Focus on professional aspects of the working relationship</li>
                        <li>• Avoid personal attacks or inappropriate language</li>
                        <li>• Your review will be public and help other freelancers</li>
                      </ul>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReviewForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || !reviewForm.comment.trim()}
                        className="flex-1"
                      >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Existing Reviews */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Client Reviews
                </CardTitle>
                <CardDescription>
                  See what other freelancers have said about this client
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet</p>
                    <p className="text-sm">Be the first to review this client</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6 last:border-b-0">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {review.reviewer?.title?.charAt(0) || 'F'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-medium">Anonymous Freelancer</h4>
                                <div className="flex items-center gap-2">
                                  {renderStarRating(review.rating)}
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              
                              <Badge variant="outline">
                                Verified Project
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">
                              {review.comment}
                            </p>
                            
                            {Object.keys(review.skills_rating).length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                {Object.entries(review.skills_rating).map(([skill, rating]) => (
                                  <div key={skill} className="flex items-center justify-between">
                                    <span className="capitalize">{skill}:</span>
                                    {renderStarRating(rating, 'sm')}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Review Impact */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Why Reviews Matter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <ThumbsUp className="h-8 w-8 mx-auto mb-3 text-green-500" />
                    <h4 className="font-medium mb-2">Build Trust</h4>
                    <p className="text-sm text-muted-foreground">
                      Help other freelancers make informed decisions
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <Award className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                    <h4 className="font-medium mb-2">Improve Quality</h4>
                    <p className="text-sm text-muted-foreground">
                      Encourage better client-freelancer relationships
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <User className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                    <h4 className="font-medium mb-2">Community Growth</h4>
                    <p className="text-sm text-muted-foreground">
                      Strengthen our freelancing community
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}