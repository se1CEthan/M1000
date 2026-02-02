// =============================================
// FREELANCING SERVICE
// Complete service layer for freelancing platform
// =============================================

import { supabase } from '@/integrations/supabase/clients';
import type {
  FreelancerProfile,
  BusinessProfile,
  Project,
  Proposal,
  Contract,
  EscrowPayment,
  TimeEntry,
  Conversation,
  Message,
  Review,
  Notification,
  PortfolioItem,
  ProjectCategory,
  FreelancerSearchFilters,
  ProjectSearchFilters,
  PaginatedResponse,
  CreateProjectForm,
  CreateProposalForm,
  FreelancerProfileForm,
  BusinessProfileForm,
  DashboardStats
} from '@/types/freelancing';

// =============================================
// FREELANCER PROFILE SERVICE
// =============================================

export class FreelancerProfileService {
  static async create(data: FreelancerProfileForm): Promise<FreelancerProfile> {
    const { data: profile, error } = await supabase
      .from('freelancer_profiles')
      .insert([{
        ...data,
        user_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  static async getById(id: string): Promise<FreelancerProfile | null> {
    const { data, error } = await supabase
      .from('freelancer_profiles')
      .select(`
        *,
        portfolio_items(*),
        reviews:reviews!reviewee_id(*)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  static async getByUserId(userId: string): Promise<FreelancerProfile | null> {
    const { data, error } = await supabase
      .from('freelancer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  }

  static async update(id: string, data: Partial<FreelancerProfileForm>): Promise<FreelancerProfile> {
    const { data: profile, error } = await supabase
      .from('freelancer_profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  static async search(
    filters: FreelancerSearchFilters,
    page = 1,
    perPage = 20
  ): Promise<PaginatedResponse<FreelancerProfile>> {
    let query = supabase
      .from('freelancer_profiles')
      .select(`
        *,
        reviews:reviews!reviewee_id(rating)
      `, { count: 'exact' });

    // Apply filters
    if (filters.skills?.length) {
      query = query.overlaps('skills', filters.skills);
    }
    if (filters.experience_level?.length) {
      query = query.in('experience_level', filters.experience_level);
    }
    if (filters.hourly_rate_min) {
      query = query.gte('hourly_rate', filters.hourly_rate_min);
    }
    if (filters.hourly_rate_max) {
      query = query.lte('hourly_rate', filters.hourly_rate_max);
    }
    if (filters.availability?.length) {
      query = query.in('availability', filters.availability);
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters.rating_min) {
      query = query.gte('rating', filters.rating_min);
    }
    if (filters.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified);
    }
    if (filters.languages?.length) {
      query = query.overlaps('languages', filters.languages);
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage)
    };
  }

  static async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const { error } = await supabase
      .from('freelancer_profiles')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  static async getFeatured(limit = 10): Promise<FreelancerProfile[]> {
    const { data, error } = await supabase
      .from('freelancer_profiles')
      .select('*')
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

// =============================================
// BUSINESS PROFILE SERVICE
// =============================================

export class BusinessProfileService {
  static async create(data: BusinessProfileForm): Promise<BusinessProfile> {
    const { data: profile, error } = await supabase
      .from('business_profiles')
      .insert([{
        ...data,
        user_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return profile;
  }

  static async getById(id: string): Promise<BusinessProfile | null> {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  static async getByUserId(userId: string): Promise<BusinessProfile | null> {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  }

  static async update(id: string, data: Partial<BusinessProfileForm>): Promise<BusinessProfile> {
    const { data: profile, error } = await supabase
      .from('business_profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return profile;
  }
}

// =============================================
// PROJECT SERVICE
// =============================================

export class ProjectService {
  static async create(data: CreateProjectForm): Promise<Project> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Get business profile
    const businessProfile = await BusinessProfileService.getByUserId(user.id);
    if (!businessProfile) throw new Error('Business profile not found');

    const { data: project, error } = await supabase
      .from('projects')
      .insert([{
        ...data,
        business_id: businessProfile.id
      }])
      .select(`
        *,
        business:business_profiles(*),
        category:project_categories(*)
      `)
      .single();

    if (error) throw error;
    return project;
  }

  static async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        business:business_profiles(*),
        category:project_categories(*),
        proposals:proposals(
          *,
          freelancer:freelancer_profiles(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  static async search(
    filters: ProjectSearchFilters,
    page = 1,
    perPage = 20
  ): Promise<PaginatedResponse<Project>> {
    let query = supabase
      .from('projects')
      .select(`
        *,
        business:business_profiles(*),
        category:project_categories(*)
      `, { count: 'exact' })
      .eq('status', 'open');

    // Apply filters
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.skills_required?.length) {
      query = query.overlaps('skills_required', filters.skills_required);
    }
    if (filters.budget_type) {
      query = query.eq('budget_type', filters.budget_type);
    }
    if (filters.budget_min) {
      query = query.gte('budget_min', filters.budget_min);
    }
    if (filters.budget_max) {
      query = query.lte('budget_max', filters.budget_max);
    }
    if (filters.experience_level?.length) {
      query = query.in('experience_level', filters.experience_level);
    }
    if (filters.project_type?.length) {
      query = query.in('project_type', filters.project_type);
    }
    if (filters.remote_ok !== undefined) {
      query = query.eq('remote_ok', filters.remote_ok);
    }
    if (filters.location) {
      query = query.ilike('location_required', `%${filters.location}%`);
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count || 0) / perPage)
    };
  }

  static async update(id: string, data: Partial<CreateProjectForm>): Promise<Project> {
    const { data: project, error } = await supabase
      .from('projects')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        business:business_profiles(*),
        category:project_categories(*)
      `)
      .single();

    if (error) throw error;
    return project;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async incrementViews(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ views_count: supabase.sql`views_count + 1` })
      .eq('id', id);

    if (error) throw error;
  }

  static async getByBusinessId(businessId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        category:project_categories(*)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getFeatured(limit = 10): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        business:business_profiles(*),
        category:project_categories(*)
      `)
      .eq('featured', true)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

// =============================================
// PROPOSAL SERVICE
// =============================================

export class ProposalService {
  static async create(projectId: string, data: CreateProposalForm): Promise<Proposal> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const freelancerProfile = await FreelancerProfileService.getByUserId(user.id);
    if (!freelancerProfile) throw new Error('Freelancer profile not found');

    const { data: proposal, error } = await supabase
      .from('proposals')
      .insert([{
        ...data,
        project_id: projectId,
        freelancer_id: freelancerProfile.id
      }])
      .select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*)
      `)
      .single();

    if (error) throw error;
    return proposal;
  }

  static async getById(id: string): Promise<Proposal | null> {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  static async getByProjectId(projectId: string): Promise<Proposal[]> {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        freelancer:freelancer_profiles(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getByFreelancerId(freelancerId: string): Promise<Proposal[]> {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        project:projects(
          *,
          business:business_profiles(*)
        )
      `)
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async update(id: string, data: Partial<CreateProposalForm>): Promise<Proposal> {
    const { data: proposal, error } = await supabase
      .from('proposals')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*)
      `)
      .single();

    if (error) throw error;
    return proposal;
  }

  static async updateStatus(id: string, status: 'accepted' | 'rejected' | 'withdrawn'): Promise<Proposal> {
    const { data: proposal, error } = await supabase
      .from('proposals')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*)
      `)
      .single();

    if (error) throw error;
    return proposal;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

// =============================================
// CONTRACT SERVICE
// =============================================

export class ContractService {
  static async create(proposalId: string): Promise<Contract> {
    const proposal = await ProposalService.getById(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const { data: contract, error } = await supabase
      .from('contracts')
      .insert([{
        project_id: proposal.project_id,
        freelancer_id: proposal.freelancer_id,
        business_id: proposal.project?.business_id,
        proposal_id: proposalId,
        title: proposal.project?.title || '',
        description: proposal.project?.description || '',
        contract_type: proposal.project?.budget_type || 'fixed',
        total_amount: proposal.proposed_budget,
        hourly_rate: proposal.proposed_hourly_rate,
        estimated_hours: proposal.estimated_hours,
        milestones: proposal.milestones
      }])
      .select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*),
        business:business_profiles(*)
      `)
      .single();

    if (error) throw error;

    // Update proposal status
    await ProposalService.updateStatus(proposalId, 'accepted');

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'in_progress' })
      .eq('id', proposal.project_id);

    return contract;
  }

  static async getById(id: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*),
        business:business_profiles(*),
        escrow_payments(*),
        time_entries(*)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  static async getByFreelancerId(freelancerId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        project:projects(*),
        business:business_profiles(*)
      `)
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getByBusinessId(businessId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateStatus(id: string, status: Contract['status']): Promise<Contract> {
    const { data: contract, error } = await supabase
      .from('contracts')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*),
        business:business_profiles(*)
      `)
      .single();

    if (error) throw error;
    return contract;
  }
}

// =============================================
// MESSAGING SERVICE
// =============================================

export class MessagingService {
  static async createConversation(
    participants: string[],
    subject?: string,
    projectId?: string,
    contractId?: string
  ): Promise<Conversation> {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert([{
        participants,
        subject,
        project_id: projectId,
        contract_id: contractId
      }])
      .select()
      .single();

    if (error) throw error;
    return conversation;
  }

  static async sendMessage(
    conversationId: string,
    content: string,
    attachments: any[] = []
  ): Promise<Message> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        attachments
      }])
      .select()
      .single();

    if (error) throw error;

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return message;
  }

  static async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages(
          *,
          sender:auth.users(*)
        )
      `)
      .contains('participants', [userId])
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:auth.users(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async markAsRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) throw error;
  }
}

// =============================================
// REVIEW SERVICE
// =============================================

export class ReviewService {
  static async create(
    contractId: string,
    revieweeId: string,
    rating: number,
    comment: string,
    skillsRating: Record<string, number> = {}
  ): Promise<Review> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Determine reviewer type
    const freelancerProfile = await FreelancerProfileService.getByUserId(user.id);
    const businessProfile = await BusinessProfileService.getByUserId(user.id);
    
    const reviewerType = freelancerProfile ? 'freelancer' : 'business';

    const { data: review, error } = await supabase
      .from('reviews')
      .insert([{
        contract_id: contractId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        reviewer_type: reviewerType,
        rating,
        comment,
        skills_rating: skillsRating
      }])
      .select()
      .single();

    if (error) throw error;

    // Update reviewee's rating
    await this.updateProfileRating(revieweeId);

    return review;
  }

  static async getByRevieweeId(revieweeId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:auth.users(*)
      `)
      .eq('reviewee_id', revieweeId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private static async updateProfileRating(userId: string): Promise<void> {
    // Get all reviews for this user
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', userId);

    if (!reviews || reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const ratingCount = reviews.length;

    // Update freelancer profile if exists
    await supabase
      .from('freelancer_profiles')
      .update({
        rating: avgRating,
        rating_count: ratingCount
      })
      .eq('user_id', userId);

    // Update business profile if exists
    await supabase
      .from('business_profiles')
      .update({
        avg_rating: avgRating,
        rating_count: ratingCount
      })
      .eq('user_id', userId);
  }
}

// =============================================
// CATEGORY SERVICE
// =============================================

export class CategoryService {
  static async getAll(): Promise<ProjectCategory[]> {
    const { data, error } = await supabase
      .from('project_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<ProjectCategory | null> {
    const { data, error } = await supabase
      .from('project_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }
}

// =============================================
// DASHBOARD SERVICE
// =============================================

export class DashboardService {
  static async getFreelancerStats(freelancerId: string): Promise<DashboardStats['freelancer']> {
    const [contracts, proposals, profile] = await Promise.all([
      supabase
        .from('contracts')
        .select('status, total_amount')
        .eq('freelancer_id', freelancerId),
      supabase
        .from('proposals')
        .select('status')
        .eq('freelancer_id', freelancerId),
      supabase
        .from('freelancer_profiles')
        .select('rating, total_earnings')
        .eq('id', freelancerId)
        .single()
    ]);

    const activeContracts = contracts.data?.filter(c => c.status === 'active').length || 0;
    const pendingProposals = proposals.data?.filter(p => p.status === 'pending').length || 0;
    const totalEarnings = profile.data?.total_earnings || 0;
    const avgRating = profile.data?.rating || 0;

    return {
      active_contracts: activeContracts,
      pending_proposals: pendingProposals,
      total_earnings: totalEarnings,
      avg_rating: avgRating,
      profile_views: 0 // TODO: Implement profile views tracking
    };
  }

  static async getBusinessStats(businessId: string): Promise<DashboardStats['business']> {
    const [projects, contracts, profile] = await Promise.all([
      supabase
        .from('projects')
        .select('status')
        .eq('business_id', businessId),
      supabase
        .from('contracts')
        .select('status, total_amount')
        .eq('business_id', businessId),
      supabase
        .from('business_profiles')
        .select('total_spent, avg_rating')
        .eq('id', businessId)
        .single()
    ]);

    const activeProjects = projects.data?.filter(p => p.status === 'open' || p.status === 'in_progress').length || 0;
    const totalSpent = profile.data?.total_spent || 0;
    const hiredFreelancers = contracts.data?.filter(c => c.status !== 'cancelled').length || 0;
    const avgProjectRating = profile.data?.avg_rating || 0;

    return {
      active_projects: activeProjects,
      total_spent: totalSpent,
      hired_freelancers: hiredFreelancers,
      avg_project_rating: avgProjectRating
    };
  }
}

// =============================================
// NOTIFICATION SERVICE
// =============================================

export class NotificationService {
  static async create(
    userId: string,
    type: string,
    title: string,
    message: string,
    data: Record<string, any> = {}
  ): Promise<Notification> {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        title,
        message,
        data
      }])
      .select()
      .single();

    if (error) throw error;
    return notification;
  }

  static async getByUserId(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }
}

// =============================================
// PORTFOLIO SERVICE
// =============================================

export class PortfolioService {
  static async create(freelancerId: string, data: Omit<PortfolioItem, 'id' | 'freelancer_id' | 'created_at' | 'updated_at'>): Promise<PortfolioItem> {
    const { data: item, error } = await supabase
      .from('portfolio_items')
      .insert([{
        ...data,
        freelancer_id: freelancerId
      }])
      .select()
      .single();

    if (error) throw error;
    return item;
  }

  static async getByFreelancerId(freelancerId: string): Promise<PortfolioItem[]> {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('freelancer_id', freelancerId)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  }

  static async update(id: string, data: Partial<PortfolioItem>): Promise<PortfolioItem> {
    const { data: item, error } = await supabase
      .from('portfolio_items')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return item;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('portfolio_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export default {
  FreelancerProfileService,
  BusinessProfileService,
  ProjectService,
  ProposalService,
  ContractService,
  MessagingService,
  ReviewService,
  CategoryService,
  DashboardService,
  NotificationService,
  PortfolioService
};