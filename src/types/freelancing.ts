// =============================================
// FREELANCING SYSTEM TYPES
// Complete type definitions for the freelancing platform
// =============================================

export interface FreelancerProfile {
  id: string;
  user_id: string;
  title: string;
  description: string;
  hourly_rate?: number;
  availability: 'available' | 'busy' | 'unavailable';
  skills: string[];
  languages: string[];
  experience_level: 'beginner' | 'intermediate' | 'expert';
  profile_image_url?: string;
  portfolio_items: PortfolioItem[];
  certifications: Certification[];
  education: Education[];
  work_experience: WorkExperience[];
  location?: string;
  timezone?: string;
  response_time: number; // hours
  completion_rate: number;
  total_earnings: number;
  total_jobs: number;
  rating: number;
  rating_count: number;
  is_verified: boolean;
  is_featured: boolean;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_description?: string;
  industry?: string;
  company_size?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  website_url?: string;
  logo_url?: string;
  location?: string;
  timezone?: string;
  total_spent: number;
  total_projects: number;
  avg_rating: number;
  rating_count: number;
  is_verified: boolean;
  payment_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  business_id: string;
  category_id: string;
  title: string;
  description: string;
  requirements?: string;
  budget_type: 'fixed' | 'hourly';
  budget_min?: number;
  budget_max?: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  estimated_hours?: number;
  duration_type?: 'days' | 'weeks' | 'months';
  duration_value?: number;
  skills_required: string[];
  experience_level: 'any' | 'beginner' | 'intermediate' | 'expert';
  project_type: 'one-time' | 'ongoing';
  remote_ok: boolean;
  location_required?: string;
  attachments: Attachment[];
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled' | 'paused';
  proposals_count: number;
  views_count: number;
  featured: boolean;
  urgent: boolean;
  deadline?: string;
  created_at: string;
  updated_at: string;
  // Relations
  business?: BusinessProfile;
  category?: ProjectCategory;
  proposals?: Proposal[];
}

export interface Proposal {
  id: string;
  project_id: string;
  freelancer_id: string;
  cover_letter: string;
  proposed_budget?: number;
  proposed_timeline?: number; // days
  proposed_hourly_rate?: number;
  estimated_hours?: number;
  milestones: Milestone[];
  attachments: Attachment[];
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  project?: Project;
  freelancer?: FreelancerProfile;
}

export interface Contract {
  id: string;
  project_id: string;
  freelancer_id: string;
  business_id: string;
  proposal_id?: string;
  title: string;
  description: string;
  contract_type: 'fixed' | 'hourly';
  total_amount?: number;
  hourly_rate?: number;
  estimated_hours?: number;
  start_date: string;
  end_date?: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled' | 'disputed';
  milestones: Milestone[];
  terms?: string;
  created_at: string;
  updated_at: string;
  // Relations
  project?: Project;
  freelancer?: FreelancerProfile;
  business?: BusinessProfile;
  escrow_payments?: EscrowPayment[];
  time_entries?: TimeEntry[];
}

export interface EscrowPayment {
  id: string;
  contract_id: string;
  business_id: string;
  freelancer_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id?: string;
  milestone_id?: string;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
  funded_at?: string;
  released_at?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  contract_id: string;
  freelancer_id: string;
  description: string;
  hours_worked: number;
  hourly_rate: number;
  total_amount: number;
  work_date: string;
  status: 'pending' | 'approved' | 'rejected';
  screenshots: string[];
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  project_id?: string;
  contract_id?: string;
  participants: string[];
  subject?: string;
  last_message_at: string;
  created_at: string;
  // Relations
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: Attachment[];
  message_type: 'text' | 'file' | 'image' | 'system';
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Review {
  id: string;
  contract_id: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewer_type: 'business' | 'freelancer';
  rating: number; // 1-5
  title?: string;
  comment?: string;
  skills_rating: Record<string, number>;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  reviewer?: FreelancerProfile | BusinessProfile;
  reviewee?: FreelancerProfile | BusinessProfile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  contract_id: string;
  initiated_by: string;
  reason: string;
  description: string;
  amount_disputed?: number;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  freelancer_id: string;
  title: string;
  description?: string;
  category?: string;
  skills_used: string[];
  images: string[];
  project_url?: string;
  completion_date?: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// =============================================
// SUPPORTING TYPES
// =============================================

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  completed_at?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  description?: string;
  is_current: boolean;
}

// =============================================
// SEARCH AND FILTER TYPES
// =============================================

export interface FreelancerSearchFilters {
  skills?: string[];
  experience_level?: string[];
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  availability?: string[];
  location?: string;
  rating_min?: number;
  is_verified?: boolean;
  languages?: string[];
  sort_by?: 'rating' | 'hourly_rate' | 'total_earnings' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface ProjectSearchFilters {
  category_id?: string;
  skills_required?: string[];
  budget_type?: 'fixed' | 'hourly';
  budget_min?: number;
  budget_max?: number;
  experience_level?: string[];
  project_type?: string[];
  remote_ok?: boolean;
  location?: string;
  duration_type?: string[];
  sort_by?: 'created_at' | 'budget_max' | 'proposals_count';
  sort_order?: 'asc' | 'desc';
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface FreelancerStats {
  total_freelancers: number;
  active_freelancers: number;
  avg_hourly_rate: number;
  top_skills: Array<{ skill: string; count: number }>;
}

export interface ProjectStats {
  total_projects: number;
  open_projects: number;
  avg_budget: number;
  top_categories: Array<{ category: string; count: number }>;
}

export interface DashboardStats {
  freelancer?: {
    active_contracts: number;
    pending_proposals: number;
    total_earnings: number;
    avg_rating: number;
    profile_views: number;
  };
  business?: {
    active_projects: number;
    total_spent: number;
    hired_freelancers: number;
    avg_project_rating: number;
  };
}

// =============================================
// FORM TYPES
// =============================================

export interface CreateProjectForm {
  title: string;
  description: string;
  category_id: string;
  budget_type: 'fixed' | 'hourly';
  budget_min?: number;
  budget_max?: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  estimated_hours?: number;
  duration_type?: 'days' | 'weeks' | 'months';
  duration_value?: number;
  skills_required: string[];
  experience_level: 'any' | 'beginner' | 'intermediate' | 'expert';
  project_type: 'one-time' | 'ongoing';
  remote_ok: boolean;
  location_required?: string;
  requirements?: string;
  deadline?: string;
  attachments?: File[];
}

export interface CreateProposalForm {
  cover_letter: string;
  proposed_budget?: number;
  proposed_timeline?: number;
  proposed_hourly_rate?: number;
  estimated_hours?: number;
  milestones: Omit<Milestone, 'id' | 'status' | 'completed_at'>[];
  attachments?: File[];
}

export interface FreelancerProfileForm {
  title: string;
  description: string;
  hourly_rate?: number;
  skills: string[];
  languages: string[];
  experience_level: 'beginner' | 'intermediate' | 'expert';
  location?: string;
  timezone?: string;
  portfolio_items: Omit<PortfolioItem, 'id' | 'freelancer_id' | 'created_at' | 'updated_at'>[];
  certifications: Omit<Certification, 'id'>[];
  education: Omit<Education, 'id'>[];
  work_experience: Omit<WorkExperience, 'id'>[];
}

export interface BusinessProfileForm {
  company_name: string;
  company_description?: string;
  industry?: string;
  company_size?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  website_url?: string;
  location?: string;
  timezone?: string;
}

// =============================================
// REAL-TIME TYPES
// =============================================

export interface RealtimeEvent {
  type: 'message' | 'proposal' | 'contract_update' | 'payment' | 'notification';
  data: any;
  timestamp: string;
}

export interface ChatMessage extends Message {
  sender_name?: string;
  sender_avatar?: string;
}

// =============================================
// PAYMENT INTEGRATION TYPES
// =============================================

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  payment_method: 'crypto' | 'card' | 'bank_transfer';
  metadata: Record<string, any>;
}

export interface CryptoPayment {
  address: string;
  amount: number;
  currency: string;
  network: string;
  transaction_hash?: string;
  confirmations: number;
  required_confirmations: number;
}

export default {};