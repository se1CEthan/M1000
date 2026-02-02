-- =============================================
-- COMPLETE FREELANCING SYSTEM DATABASE SCHEMA
-- Features: Profiles, Projects, Proposals, Contracts, Payments, Reviews, Messaging
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- FREELANCER PROFILES
-- =============================================
CREATE TABLE freelancer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    hourly_rate DECIMAL(10,2),
    availability VARCHAR(20) DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'unavailable')),
    skills TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    experience_level VARCHAR(20) DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
    profile_image_url TEXT,
    portfolio_items JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    work_experience JSONB DEFAULT '[]',
    location VARCHAR(100),
    timezone VARCHAR(50),
    response_time INTEGER DEFAULT 24, -- hours
    completion_rate DECIMAL(5,2) DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BUSINESS PROFILES
-- =============================================
CREATE TABLE business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name VARCHAR(100) NOT NULL,
    company_description TEXT,
    industry VARCHAR(50),
    company_size VARCHAR(20) CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
    website_url TEXT,
    logo_url TEXT,
    location VARCHAR(100),
    timezone VARCHAR(50),
    total_spent DECIMAL(12,2) DEFAULT 0,
    total_projects INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    payment_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PROJECT CATEGORIES
-- =============================================
CREATE TABLE project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    parent_id UUID REFERENCES project_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO project_categories (name, description, icon) VALUES
('Web Development', 'Frontend, backend, and full-stack development', 'code'),
('Mobile Development', 'iOS, Android, and cross-platform apps', 'smartphone'),
('Design & Creative', 'UI/UX, graphic design, branding', 'palette'),
('Writing & Translation', 'Content writing, copywriting, translation', 'pen-tool'),
('Digital Marketing', 'SEO, social media, advertising', 'trending-up'),
('Data & Analytics', 'Data analysis, machine learning, AI', 'bar-chart'),
('Video & Animation', 'Video editing, motion graphics, 3D', 'video'),
('Music & Audio', 'Audio editing, voice over, music production', 'music'),
('Business', 'Consulting, project management, strategy', 'briefcase'),
('Engineering', 'Software architecture, DevOps, QA', 'settings');

-- =============================================
-- PROJECTS
-- =============================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES project_categories(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('fixed', 'hourly')),
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    hourly_rate_min DECIMAL(10,2),
    hourly_rate_max DECIMAL(10,2),
    estimated_hours INTEGER,
    duration_type VARCHAR(20) CHECK (duration_type IN ('days', 'weeks', 'months')),
    duration_value INTEGER,
    skills_required TEXT[] DEFAULT '{}',
    experience_level VARCHAR(20) DEFAULT 'any' CHECK (experience_level IN ('any', 'beginner', 'intermediate', 'expert')),
    project_type VARCHAR(20) DEFAULT 'one-time' CHECK (project_type IN ('one-time', 'ongoing')),
    remote_ok BOOLEAN DEFAULT TRUE,
    location_required VARCHAR(100),
    attachments JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled', 'paused')),
    proposals_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    urgent BOOLEAN DEFAULT FALSE,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PROPOSALS
-- =============================================
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL,
    proposed_budget DECIMAL(10,2),
    proposed_timeline INTEGER, -- in days
    proposed_hourly_rate DECIMAL(10,2),
    estimated_hours INTEGER,
    milestones JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, freelancer_id)
);

-- =============================================
-- CONTRACTS
-- =============================================
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('fixed', 'hourly')),
    total_amount DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),
    estimated_hours INTEGER,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled', 'disputed')),
    milestones JSONB DEFAULT '[]',
    terms TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ESCROW PAYMENTS
-- =============================================
CREATE TABLE escrow_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(20) DEFAULT 'crypto',
    transaction_id VARCHAR(100),
    milestone_id UUID,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'funded', 'released', 'refunded', 'disputed')),
    funded_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TIME TRACKING
-- =============================================
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (hours_worked * hourly_rate) STORED,
    work_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    screenshots JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MESSAGES
-- =============================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    participants UUID[] NOT NULL,
    subject VARCHAR(200),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEWS & RATINGS
-- =============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewer_type VARCHAR(20) NOT NULL CHECK (reviewer_type IN ('business', 'freelancer')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(100),
    comment TEXT,
    skills_rating JSONB DEFAULT '{}', -- {"communication": 5, "quality": 4, "timeliness": 5}
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contract_id, reviewer_id)
);

-- =============================================
-- SAVED ITEMS
-- =============================================
CREATE TABLE saved_freelancers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, freelancer_id)
);

CREATE TABLE saved_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(freelancer_id, project_id)
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DISPUTES
-- =============================================
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    initiated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount_disputed DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed', 'escalated')),
    resolution TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    escalation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DISPUTE RESPONSES
-- =============================================
CREATE TABLE dispute_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DISPUTE EVIDENCE
-- =============================================
CREATE TABLE dispute_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PORTFOLIO ITEMS
-- =============================================
CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    skills_used TEXT[] DEFAULT '{}',
    images JSONB DEFAULT '[]',
    project_url TEXT,
    completion_date DATE,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Freelancer profiles
CREATE INDEX idx_freelancer_profiles_user_id ON freelancer_profiles(user_id);
CREATE INDEX idx_freelancer_profiles_skills ON freelancer_profiles USING GIN(skills);
CREATE INDEX idx_freelancer_profiles_rating ON freelancer_profiles(rating DESC);
CREATE INDEX idx_freelancer_profiles_availability ON freelancer_profiles(availability);

-- Business profiles
CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);

-- Projects
CREATE INDEX idx_projects_business_id ON projects(business_id);
CREATE INDEX idx_projects_category_id ON projects(category_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_skills ON projects USING GIN(skills_required);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_budget ON projects(budget_min, budget_max);

-- Proposals
CREATE INDEX idx_proposals_project_id ON proposals(project_id);
CREATE INDEX idx_proposals_freelancer_id ON proposals(freelancer_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- Contracts
CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_freelancer_id ON contracts(freelancer_id);
CREATE INDEX idx_contracts_business_id ON contracts(business_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- Messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Reviews
CREATE INDEX idx_reviews_contract_id ON reviews(contract_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Freelancer profiles policies
CREATE POLICY "Users can view all freelancer profiles" ON freelancer_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own freelancer profile" ON freelancer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own freelancer profile" ON freelancer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own freelancer profile" ON freelancer_profiles FOR DELETE USING (auth.uid() = user_id);

-- Business profiles policies
CREATE POLICY "Users can view all business profiles" ON business_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own business profile" ON business_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own business profile" ON business_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own business profile" ON business_profiles FOR DELETE USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Anyone can view open projects" ON projects FOR SELECT USING (status = 'open' OR EXISTS (
    SELECT 1 FROM business_profiles WHERE business_profiles.id = projects.business_id AND business_profiles.user_id = auth.uid()
));
CREATE POLICY "Business owners can manage their projects" ON projects FOR ALL USING (EXISTS (
    SELECT 1 FROM business_profiles WHERE business_profiles.id = projects.business_id AND business_profiles.user_id = auth.uid()
));

-- Proposals policies
CREATE POLICY "Freelancers can view their own proposals" ON proposals FOR SELECT USING (EXISTS (
    SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = proposals.freelancer_id AND freelancer_profiles.user_id = auth.uid()
));
CREATE POLICY "Business owners can view proposals for their projects" ON proposals FOR SELECT USING (EXISTS (
    SELECT 1 FROM projects p JOIN business_profiles bp ON p.business_id = bp.id 
    WHERE p.id = proposals.project_id AND bp.user_id = auth.uid()
));
CREATE POLICY "Freelancers can manage their own proposals" ON proposals FOR ALL USING (EXISTS (
    SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = proposals.freelancer_id AND freelancer_profiles.user_id = auth.uid()
));

-- Disputes policies
CREATE POLICY "Users can view disputes they are involved in" ON disputes FOR SELECT USING (
    initiated_by = auth.uid() OR EXISTS (
        SELECT 1 FROM contracts c 
        JOIN freelancer_profiles fp ON c.freelancer_id = fp.id 
        JOIN business_profiles bp ON c.business_id = bp.id
        WHERE c.id = disputes.contract_id 
        AND (fp.user_id = auth.uid() OR bp.user_id = auth.uid())
    )
);
CREATE POLICY "Users can create disputes for their contracts" ON disputes FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM contracts c 
        JOIN freelancer_profiles fp ON c.freelancer_id = fp.id 
        JOIN business_profiles bp ON c.business_id = bp.id
        WHERE c.id = contract_id 
        AND (fp.user_id = auth.uid() OR bp.user_id = auth.uid())
    )
);
CREATE POLICY "Users can update disputes they initiated" ON disputes FOR UPDATE USING (initiated_by = auth.uid());

-- Dispute responses policies
CREATE POLICY "Users can view responses for disputes they are involved in" ON dispute_responses FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM disputes d
        JOIN contracts c ON d.contract_id = c.id
        JOIN freelancer_profiles fp ON c.freelancer_id = fp.id 
        JOIN business_profiles bp ON c.business_id = bp.id
        WHERE d.id = dispute_responses.dispute_id 
        AND (d.initiated_by = auth.uid() OR fp.user_id = auth.uid() OR bp.user_id = auth.uid())
    )
);
CREATE POLICY "Users can add responses to disputes they are involved in" ON dispute_responses FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM disputes d
        JOIN contracts c ON d.contract_id = c.id
        JOIN freelancer_profiles fp ON c.freelancer_id = fp.id 
        JOIN business_profiles bp ON c.business_id = bp.id
        WHERE d.id = dispute_id 
        AND (d.initiated_by = auth.uid() OR fp.user_id = auth.uid() OR bp.user_id = auth.uid())
    )
);

-- Dispute evidence policies
CREATE POLICY "Users can view evidence for disputes they are involved in" ON dispute_evidence FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM disputes d
        JOIN contracts c ON d.contract_id = c.id
        JOIN freelancer_profiles fp ON c.freelancer_id = fp.id 
        JOIN business_profiles bp ON c.business_id = bp.id
        WHERE d.id = dispute_evidence.dispute_id 
        AND (d.initiated_by = auth.uid() OR fp.user_id = auth.uid() OR bp.user_id = auth.uid())
    )
);
CREATE POLICY "Users can upload evidence for disputes they are involved in" ON dispute_evidence FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND EXISTS (
        SELECT 1 FROM disputes d
        JOIN contracts c ON d.contract_id = c.id
        JOIN freelancer_profiles fp ON c.freelancer_id = fp.id 
        JOIN business_profiles bp ON c.business_id = bp.id
        WHERE d.id = dispute_id 
        AND (d.initiated_by = auth.uid() OR fp.user_id = auth.uid() OR bp.user_id = auth.uid())
    )
);

-- Add more policies for other tables...
-- (Similar pattern for contracts, messages, reviews, etc.)

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_freelancer_profiles_updated_at BEFORE UPDATE ON freelancer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update proposal count when proposals are added/removed
CREATE OR REPLACE FUNCTION update_project_proposals_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE projects SET proposals_count = proposals_count + 1 WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE projects SET proposals_count = proposals_count - 1 WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proposals_count_trigger
    AFTER INSERT OR DELETE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_project_proposals_count();

-- Function to update freelancer stats
CREATE OR REPLACE FUNCTION update_freelancer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update completion rate, total earnings, etc.
        UPDATE freelancer_profiles 
        SET 
            total_jobs = (SELECT COUNT(*) FROM contracts WHERE freelancer_id = NEW.freelancer_id AND status = 'completed'),
            total_earnings = (SELECT COALESCE(SUM(total_amount), 0) FROM contracts WHERE freelancer_id = NEW.freelancer_id AND status = 'completed')
        WHERE id = NEW.freelancer_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_freelancer_stats_trigger
    AFTER INSERT OR UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_freelancer_stats();

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Note: Sample data would be inserted here for testing purposes
-- This includes sample freelancers, businesses, projects, etc.

COMMIT;