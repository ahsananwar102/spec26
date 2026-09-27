-- ==============================================================================
-- SPEC'26 — NED University Department of Electronic Engineering
-- Production Database Schema & Seed Script (Supabase / PostgreSQL)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLE: categories (Dynamic Competition Streams & Disciplines)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'ELECTRONICS', 'ROBOTICS', etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(64) DEFAULT 'category',
    order_num INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- TABLE: event_settings (Dynamic Timeline & Registration Phase Control)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.event_settings (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'current',
    registration_phase VARCHAR(32) NOT NULL DEFAULT 'OPEN', -- 'NOT_STARTED', 'OPEN', 'CLOSED'
    event_date DATE DEFAULT '2026-04-15',
    registration_start_date DATE DEFAULT '2026-03-01',
    registration_end_date DATE DEFAULT '2026-04-10',
    competition_dates VARCHAR(128) DEFAULT '15–16 April 2026',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- TABLE: competitions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    track_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL, -- Matches slug in categories ('ELECTRONICS', 'ROBOTICS', etc.)
    description TEXT NOT NULL,
    format VARCHAR(32) NOT NULL,   -- 'SOLO', 'TEAM', 'BOTH'
    min_members INTEGER NOT NULL DEFAULT 1,
    max_members INTEGER NOT NULL DEFAULT 4,
    solo_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    team_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    rules_summary TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- TABLE: registrations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id VARCHAR(64) UNIQUE NOT NULL, -- e.g. SPEC26-NED-88421
    user_id VARCHAR(128) NOT NULL,
    competition_id VARCHAR(128) NOT NULL,
    participation_model VARCHAR(32) NOT NULL,   -- 'individual', 'team'
    team_name VARCHAR(255),
    leader_name VARCHAR(255) NOT NULL,
    leader_student_id VARCHAR(128) NOT NULL,
    university VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    academic_year VARCHAR(64) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    payment_channel VARCHAR(64) NOT NULL,       -- 'easypaisa', 'jazzcash', 'bank_transfer', etc.
    transaction_id VARCHAR(128) NOT NULL,
    receipt_url TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    calculated_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning-fast queries in Admin CMS
CREATE INDEX IF NOT EXISTS idx_registrations_reg_id ON public.registrations(registration_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_comp_id ON public.registrations(competition_id);

-- ==============================================================================
-- TABLE: team_members
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    member_number INTEGER NOT NULL, -- 2, 3, 4
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(128) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_reg_id ON public.team_members(registration_id);

-- ==============================================================================
-- TABLE: contact_messages
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    subject_category VARCHAR(128) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'NEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- STORAGE BUCKET: payment-receipts
-- ==============================================================================
-- Insert the public bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 1. Categories: Public Read, Write for All
CREATE POLICY "Allow public read on categories"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Allow write on categories"
    ON public.categories FOR ALL
    USING (true);

-- 2. Event Settings: Public Read, Write for All
CREATE POLICY "Allow public read on event_settings"
    ON public.event_settings FOR SELECT
    USING (true);

CREATE POLICY "Allow write on event_settings"
    ON public.event_settings FOR ALL
    USING (true);

-- 3. Competitions: Public Read Access
CREATE POLICY "Allow public read on active competitions"
    ON public.competitions FOR SELECT
    USING (true);

CREATE POLICY "Allow admin full access on competitions"
    ON public.competitions FOR ALL
    USING (true);

-- 4. Registrations: Public Insert, Admin All
CREATE POLICY "Allow anyone to submit registrations"
    ON public.registrations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow users to read their registrations or admin view all"
    ON public.registrations FOR SELECT
    USING (true);

CREATE POLICY "Allow admin to update registration status"
    ON public.registrations FOR UPDATE
    USING (true);

-- 5. Team Members: Insert & Select
CREATE POLICY "Allow insert of squad team members"
    ON public.team_members FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow view of squad team members"
    ON public.team_members FOR SELECT
    USING (true);

-- 6. Contact Messages: Public Insert
CREATE POLICY "Allow public to send contact messages"
    ON public.contact_messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow admin to view contact messages"
    ON public.contact_messages FOR SELECT
    USING (true);

-- 7. Storage Policies for payment-receipts
CREATE POLICY "Allow public read of receipts"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'payment-receipts');

CREATE POLICY "Allow public upload of payment receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'payment-receipts');

-- ==============================================================================
-- SEED DATA: Categories
-- ==============================================================================
INSERT INTO public.categories (slug, name, description, icon, order_num)
VALUES
('ELECTRONICS', 'Electronics', 'Hardware, circuit design, FPGA, embedded systems, microcontrollers, and PCB prototyping.', 'memory', 1),
('ROBOTICS', 'Robotics', 'Autonomous rovers, combat sumo-bots, line followers, drone navigation, and mechatronic systems.', 'smart_toy', 2),
('PROGRAMMING', 'Programming', 'Algorithmic speed coding, software development sprints, web engineering, and competitive hacking.', 'terminal', 3),
('PROJECTS', 'Projects', 'Final Year Projects (FYP), research showcases, industrial prototypes, and commercial inventions.', 'devices', 4),
('ESPORTS', 'Esports', 'Competitive tactical gaming tournaments, multiplayer team matches, and esports arena showdowns.', 'sports_esports', 5)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    order_num = EXCLUDED.order_num;

-- ==============================================================================
-- SEED DATA: Event Timeline & Phase Settings
-- ==============================================================================
INSERT INTO public.event_settings (
    id, registration_phase, event_date, registration_start_date, registration_end_date, competition_dates
) VALUES (
    'current', 'OPEN', '2026-04-15', '2026-03-01', '2026-04-10', '15–16 April 2026'
)
ON CONFLICT (id) DO UPDATE SET
    registration_phase = EXCLUDED.registration_phase,
    event_date = EXCLUDED.event_date,
    registration_start_date = EXCLUDED.registration_start_date,
    registration_end_date = EXCLUDED.registration_end_date,
    competition_dates = EXCLUDED.competition_dates;

-- ==============================================================================
-- SEED DATA: 11 Official SPEC'26 Technical Arenas
-- ==============================================================================
INSERT INTO public.competitions (
    slug, track_number, title, category, description, format, min_members, max_members, solo_fee, team_fee, rules_summary, is_active
) VALUES
(
    'project-poster', 1, 'Project & Poster Exhibition', 'PROJECTS',
    'Showcase capstone hardware and research prototypes evaluated by senior faculty and industry engineering panels.',
    'TEAM', 2, 4, 0, 2500,
    'Working hardware prototype or simulation testbed alongside standard A1 research poster presentation. Display bench & AC power outlet provided.', true
),
(
    'circuit-designing', 2, 'Circuit Designing', 'ELECTRONICS',
    'Analyze circuit schematics, calculate operational bias points, and assemble discrete prototypes on breadboards under timed constraints.',
    'BOTH', 1, 2, 1000, 1800,
    'Components and breadboard provided on-site. Graded on circuit accuracy, stability, and speed of assembly. Lab bench equipment provided.', true
),
(
    'circuit-simulation', 3, 'Circuit Simulation', 'ELECTRONICS',
    'Model transient, frequency response, and stability characteristics for complex analog and digital circuits using SPICE suites.',
    'BOTH', 1, 2, 1000, 1800,
    'Conducted in Proteus / Multisim / LTspice environments. Evaluated on convergence, parameter sweep depth, and output accuracy.', true
),
(
    'speedy-soldering', 4, 'Speedy Soldering', 'ELECTRONICS',
    'Precision through-hole and SMD soldering tested for IPC joint reliability, alignment accuracy, and thermal control under clock pressure.',
    'SOLO', 1, 1, 1000, 0,
    'Kit provided at station. Assessed on joint wetting, no cold bridges, pad integrity, and circuit continuity. ESD tools provided.', true
),
(
    'brainvolt', 5, 'Brainvolt (Tech Quiz)', 'ELECTRONICS',
    'Rapid-fire technical buzzer challenge testing foundational mastery across semiconductor physics, circuit theory, and logic design.',
    'TEAM', 2, 2, 0, 1500,
    '3 knockout rounds: Written Qualifier, Rapid Conceptual Fire, and Final Hardware Buzzer round.', true
),
(
    'speed-programming', 6, 'Speed Programming', 'PROGRAMMING',
    'Solve complex algorithmic challenges, data structure problems, and optimizations under stringent time and memory constraints.',
    'BOTH', 1, 2, 1000, 1800,
    'Supported languages: C++, Python, Java. Automated testbench evaluation with instant leaderboard ranking.', true
),
(
    'hackathon', 7, 'Hackathon', 'PROGRAMMING',
    'An intensive prototyping sprint engineering functional software and embedded firmware solutions tailored to concrete industry prompts.',
    'TEAM', 2, 4, 0, 3000,
    '24-hour sprint. Code repository and live deployment required. High-speed network, mentoring, and power hub provided.', true
),
(
    'line-following-robot', 8, 'Line Following Robot (LFR)', 'ROBOTICS',
    'High-speed optical path navigation across tight chicanes, gradient elevation ramps, cross-intersections, and line gaps.',
    'TEAM', 2, 4, 0, 2500,
    'Autonomous navigation on 30mm black line. Grid chicanes and elevation ramps. Max footprint 250x250mm, max weight 2kg.', true
),
(
    'robo-soccer', 9, 'Robo Soccer', 'ROBOTICS',
    'High-torque wireless chassis clash in 1v1 and 2v2 tactical ball-control heats within an enclosed arena pitch.',
    'TEAM', 2, 4, 0, 3000,
    'Wireless dual-joystick or RF control. Max weight 4kg, 24V supply cap. Round-robin group qualifiers leading to grand final.', true
),
(
    'tekken-8', 10, 'Tekken 8 Tournament', 'ESPORTS',
    'High-stakes competitive fighting showcase on official PS5/PC tournament stations with zero-latency mechanical arcade monitors.',
    'SOLO', 1, 1, 1000, 0,
    'Double elimination bracket. 60 FPS verified tournament displays. BYO controller permitted upon verification check.', true
),
(
    'e-football', 11, 'eFootball / EA FC 24', 'ESPORTS',
    'Tactical digital football championship conducted under standard FIFA competitive rulesets and knockout brackets.',
    'SOLO', 1, 1, 1000, 0,
    'Knockout tournament rules. Default team ratings and 6-minute halves. PS5 tournament stations provided.', true
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    solo_fee = EXCLUDED.solo_fee,
    team_fee = EXCLUDED.team_fee,
    rules_summary = EXCLUDED.rules_summary;

-- ==============================================================================
-- HELPER QUERY: PROMOTING A REGISTERED USER TO ADMIN
-- ==============================================================================
-- Run this query after creating an account with your desired admin email in Supabase:
--
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "ADMIN"}'::jsonb
-- WHERE email = 'your-admin-email@neduet.edu.pk';
-- ==============================================================================

-- Output confirmation
SELECT 'SPEC26 Database Schema, Categories, Timeline & Arenas Initialized Successfully!' AS status;
