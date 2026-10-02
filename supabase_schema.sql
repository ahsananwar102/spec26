-- ==============================================================================
-- SPEC'26 — NED University Department of Electronic Engineering
-- Production Database Schema & Seed Script (Supabase / PostgreSQL)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 0. SCHEMA MIGRATIONS & CONSTRAINT CLEANUP
-- Safely drop restrictive constraints and apply updates for existing databases
-- ==============================================================================
ALTER TABLE IF EXISTS public.competitions DROP CONSTRAINT IF EXISTS competitions_category_check;
ALTER TABLE IF EXISTS public.competitions DROP CONSTRAINT IF EXISTS competitions_format_check;
ALTER TABLE IF EXISTS public.registrations DROP CONSTRAINT IF EXISTS registrations_user_id_fkey;
ALTER TABLE IF EXISTS public.registrations DROP CONSTRAINT IF EXISTS registrations_competition_id_fkey;
ALTER TABLE IF EXISTS public.registrations DROP CONSTRAINT IF EXISTS registrations_payment_channel_check;
ALTER TABLE IF EXISTS public.registrations DROP CONSTRAINT IF EXISTS registrations_status_check;
ALTER TABLE IF EXISTS public.registrations DROP CONSTRAINT IF EXISTS registrations_participation_model_check;

-- Recent updates: alternate phone, guest submissions, optional transaction & student id
ALTER TABLE IF EXISTS public.registrations ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(64);
ALTER TABLE IF EXISTS public.registrations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.registrations ALTER COLUMN transaction_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.team_members ALTER COLUMN student_id DROP NOT NULL;

-- ==============================================================================
-- TABLE: app_users (User Directory, Authentication, & Administrative Roles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_users (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'USER', -- 'USER', 'ADMIN'
    is_root_admin BOOLEAN NOT NULL DEFAULT false,
    university VARCHAR(255) DEFAULT 'NED University of Engineering & Technology',
    department VARCHAR(255) DEFAULT 'Electronic Engineering',
    student_id VARCHAR(128),
    phone_number VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);

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
    user_id VARCHAR(128),
    competition_id VARCHAR(128) NOT NULL,
    participation_model VARCHAR(32) NOT NULL,   -- 'individual', 'team'
    team_name VARCHAR(255),
    leader_name VARCHAR(255) NOT NULL,
    leader_student_id VARCHAR(128) NOT NULL,
    university VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    academic_year VARCHAR(64) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    alternate_phone VARCHAR(64),
    email VARCHAR(255) NOT NULL,
    payment_channel VARCHAR(64) NOT NULL,       -- 'Bank transfer', 'Easypaisa', 'Jazzcash', 'Nayapay'
    transaction_id VARCHAR(128),
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
    student_id VARCHAR(128),
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
-- DATABASE PERMISSIONS & ROLE GRANTS (Prevents 42501 permission denied)
-- ==============================================================================
-- Grant schema usage and permissions to anon (web visitors) and authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO anon, authenticated, service_role;

-- Grant table privileges across public schema
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Explicit grants for each specific application table
GRANT ALL ON TABLE public.app_users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.event_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.contact_messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.competitions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.registrations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.team_members TO anon, authenticated, service_role;

-- Ensure future tables and sequences created also inherit permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 0. App Users: Full read and write access for registration, login, and admin role sync
DROP POLICY IF EXISTS "Allow full access on app_users" ON public.app_users;
CREATE POLICY "Allow full access on app_users"
    ON public.app_users FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 1. Categories: Full read and write access for app operations
DROP POLICY IF EXISTS "Allow public read on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow write on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow full access on categories" ON public.categories;

CREATE POLICY "Allow full access on categories"
    ON public.categories FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 2. Event Settings: Full read and write access for dynamic timeline & phase sync
DROP POLICY IF EXISTS "Allow public read on event_settings" ON public.event_settings;
DROP POLICY IF EXISTS "Allow write on event_settings" ON public.event_settings;
DROP POLICY IF EXISTS "Allow full access on event_settings" ON public.event_settings;

CREATE POLICY "Allow full access on event_settings"
    ON public.event_settings FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 3. Competitions: Public Read & Admin Manage
DROP POLICY IF EXISTS "Allow public read on active competitions" ON public.competitions;
DROP POLICY IF EXISTS "Allow admin full access on competitions" ON public.competitions;
DROP POLICY IF EXISTS "Allow full access on competitions" ON public.competitions;

CREATE POLICY "Allow full access on competitions"
    ON public.competitions FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 4. Registrations: Submit, View, Update, Delete
DROP POLICY IF EXISTS "Allow anyone to submit registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow users to read their registrations or admin view all" ON public.registrations;
DROP POLICY IF EXISTS "Allow admin to update registration status" ON public.registrations;
DROP POLICY IF EXISTS "Allow admin to delete registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow full access on registrations" ON public.registrations;

CREATE POLICY "Allow full access on registrations"
    ON public.registrations FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 5. Team Members: Insert, View, Update, Delete
DROP POLICY IF EXISTS "Allow insert of squad team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow view of squad team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow update of squad team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow delete of squad team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow full access on team_members" ON public.team_members;

CREATE POLICY "Allow full access on team_members"
    ON public.team_members FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 6. Contact Messages: Public Submit & Admin Read/Manage
DROP POLICY IF EXISTS "Allow public to send contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admin to view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow public read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow public update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow full access on contact_messages" ON public.contact_messages;

CREATE POLICY "Allow full access on contact_messages"
    ON public.contact_messages FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 7. Storage Policies for payment-receipts
DROP POLICY IF EXISTS "Allow public read of receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload of payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update of payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow full access on payment-receipts bucket" ON storage.objects;

CREATE POLICY "Allow full access on payment-receipts bucket"
    ON storage.objects FOR ALL
    TO anon, authenticated, service_role
    USING (bucket_id = 'payment-receipts')
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
-- SEED INITIAL ROOT ADMINISTRATOR
-- ==============================================================================
INSERT INTO public.app_users (
    id, name, email, password, role, is_root_admin, university, department, student_id, phone_number
) VALUES (
    'user-admin-1',
    'Engr. Dr. Hashir Kidwai',
    'admin@neduet.edu.pk',
    'admin123',
    'ADMIN',
    true,
    'NED University of Engineering & Technology',
    'Department of Electronic Engineering',
    'FAC-EE-001',
    '+92 21 99261261'
)
ON CONFLICT (email) DO UPDATE SET
    role = 'ADMIN',
    is_root_admin = true;

-- Output confirmation
SELECT 'SPEC26 Database Schema, Categories, Timeline, App Users & Arenas Initialized Successfully!' AS status;
