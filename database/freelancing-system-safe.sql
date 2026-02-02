-- =============================================
-- SAFE FREELANCING SYSTEM DATABASE SCHEMA
-- Uses IF NOT EXISTS to prevent conflicts
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- FREELANCER PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS freelancer_profiles (
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
CREATE TABLE IF NOT EXISTS business_profiles (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PROJECT CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- hex color
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PROJECTS
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES project_categories(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    skills_required TEXT[] DEFAULT '{}',
    budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('fixed', 'hourly')),
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    hourly_rate_min DECIMAL(10,2),
    hourly_rate_max DECIMAL(10,2),
    estimated_duration VARCHAR(50), -- "1-2 weeks", "1-3 months", etc.
    experience_level VARCHAR(20) DEFAULT 'intermediate' CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
    project_type VARCHAR(20) DEFAULT 'one_time' CHECK (project_type IN ('one_time', 'ongoing', 'contract')),
    remote_ok BOOLEAN DEFAULT TRUE,
    location_required VARCHAR(100),
    attachments JSONB DEFAULT '[]',
    requirements TEXT,
    deliverables TEXT,
    timeline TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
    featured BOOLEAN DEFAULT FALSE,
    urgent BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    proposals_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deadline TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- PROPOSALS
-- =============================================
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL,
    proposed_budget DECIMAL(10,2),
    proposed_hourly_rate DECIMAL(10,2),
    estimated_hours INTEGER,
    estimated_duration VARCHAR(50),
    milestones JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    questions TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, freelancer_id)
);

-- =============================================
-- CONTRACTS
-- =============================================
CREATE TABLE IF NOT EXISTS contracts (
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
    milestones JSONB DEFAULT '[]',
    terms TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'disputed')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ESCROW PAYMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS escrow_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    milestone_id VARCHAR(50), -- reference to milestone in contract
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'funded', 'released', 'disputed', 'refunded')),
    funded_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TIME TRACKING
-- =============================================
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (hours_worked * hourly_rate) STORED,
    work_date DATE NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MESSAGING SYSTEM
-- =============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants UUID[] NOT NULL,
    subject VARCHAR(200),
    project_id UUID REFERENCES projects(id),
    contract_id UUID REFERENCES contracts(id),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEWS & RATINGS
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
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
CREATE TABLE IF NOT EXISTS saved_freelancers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, freelancer_id)
);

CREATE TABLE IF NOT EXISTS saved_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(freelancer_id, project_id)
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
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
-- PORTFOLIO ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    project_url TEXT,
    technologies TEXT[] DEFAULT '{}',
    category VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_user_id ON freelancer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_skills ON freelancer_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_rating ON freelancer_profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_availability ON freelancer_profiles(availability);

CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_business_id ON projects(business_id);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_skills ON projects USING GIN(skills_required);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_freelancer_id ON proposals(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_freelancer_id ON contracts(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_business_id ON contracts(business_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_contract_id ON reviews(contract_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
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
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Freelancer Profiles Policies
CREATE POLICY "Users can view all freelancer profiles" ON freelancer_profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own freelancer profile" ON freelancer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own freelancer profile" ON freelancer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own freelancer profile" ON freelancer_profiles FOR DELETE USING (auth.uid() = user_id);

-- Business Profiles Policies
CREATE POLICY "Users can view all business profiles" ON business_profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own business profile" ON business_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own business profile" ON business_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own business profile" ON business_profiles FOR DELETE USING (auth.uid() = user_id);

-- Projects Policies
CREATE POLICY "Users can view all open projects" ON projects FOR SELECT USING (status = 'open' OR EXISTS (
    SELECT 1 FROM business_profiles WHERE business_profiles.id = projects.business_id AND business_profiles.user_id = auth.uid()
));
CREATE POLICY "Business users can create projects" ON projects FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM business_profiles WHERE business_profiles.id = business_id AND business_profiles.user_id = auth.uid()
));
CREATE POLICY "Business users can update their own projects" ON projects FOR UPDATE USING (EXISTS (
    SELECT 1 FROM business_profiles WHERE business_profiles.id = projects.business_id AND business_profiles.user_id = auth.uid()
));
CREATE POLICY "Business users can delete their own projects" ON projects FOR DELETE USING (EXISTS (
    SELECT 1 FROM business_profiles WHERE business_profiles.id = projects.business_id AND business_profiles.user_id = auth.uid()
));

-- Proposals Policies
CREATE POLICY "Users can view proposals for their projects or their own proposals" ON proposals FOR SELECT USING (
    EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = proposals.freelancer_id AND freelancer_profiles.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM projects JOIN business_profiles ON projects.business_id = business_profiles.id 
               WHERE projects.id = proposals.project_id AND business_profiles.user_id = auth.uid())
);
CREATE POLICY "Freelancers can create proposals" ON proposals FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = freelancer_id AND freelancer_profiles.user_id = auth.uid()
));
CREATE POLICY "Freelancers can update their own proposals" ON proposals FOR UPDATE USING (EXISTS (
    SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = proposals.freelancer_id AND freelancer_profiles.user_id = auth.uid()
));

-- Contracts Policies
CREATE POLICY "Users can view contracts they're involved in" ON contracts FOR SELECT USING (
    EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = contracts.freelancer_id AND freelancer_profiles.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM business_profiles WHERE business_profiles.id = contracts.business_id AND business_profiles.user_id = auth.uid())
);

-- Messages Policies
CREATE POLICY "Users can view messages in conversations they participate in" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND auth.uid() = ANY(conversations.participants))
);
CREATE POLICY "Users can send messages in conversations they participate in" ON messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_id AND auth.uid() = ANY(conversations.participants))
);

-- Reviews Policies
CREATE POLICY "Users can view public reviews" ON reviews FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create reviews for their contracts" ON reviews FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM contracts WHERE contracts.id = contract_id AND 
            (EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = contracts.freelancer_id AND freelancer_profiles.user_id = auth.uid())
             OR EXISTS (SELECT 1 FROM business_profiles WHERE business_profiles.id = contracts.business_id AND business_profiles.user_id = auth.uid())))
);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Portfolio Items Policies
CREATE POLICY "Users can view all portfolio items" ON portfolio_items FOR SELECT USING (true);
CREATE POLICY "Freelancers can manage their own portfolio items" ON portfolio_items FOR ALL USING (
    EXISTS (SELECT 1 FROM freelancer_profiles WHERE freelancer_profiles.id = portfolio_items.freelancer_id AND freelancer_profiles.user_id = auth.uid())
);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample categories
INSERT INTO project_categories (name, description, icon, color) VALUES
('Web Development', 'Frontend and backend web development', 'code', '#3B82F6'),
('Mobile Development', 'iOS and Android app development', 'smartphone', '#10B981'),
('Design', 'UI/UX design, graphic design, branding', 'palette', '#F59E0B'),
('Writing', 'Content writing, copywriting, technical writing', 'edit', '#8B5CF6'),
('Marketing', 'Digital marketing, SEO, social media', 'trending-up', '#EF4444'),
('Data Science', 'Data analysis, machine learning, AI', 'bar-chart', '#06B6D4'),
('Video & Animation', 'Video editing, motion graphics, animation', 'video', '#F97316'),
('Translation', 'Language translation and localization', 'globe', '#84CC16')
ON CONFLICT (name) DO NOTHING;

-- Success message
SELECT 'Freelancing system database schema created successfully!' as message;