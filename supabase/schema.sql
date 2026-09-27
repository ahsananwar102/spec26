-- ====================================================================
-- SPEC'26 STUDENTS' PROJECT EXHIBITION & COMPETITION
-- Complete Supabase PostgreSQL Schema, RLS Policies, and Initial Seed
-- Department of Electronic Engineering, NED University
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 2. TABLES DEFINITIONS
-- ====================================================================

-- 2.1 Profiles Table (Tied to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  university TEXT DEFAULT 'NED University of Engineering & Technology',
  department TEXT DEFAULT 'Electronic Engineering',
  student_id TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 Competitions Table
CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_number TEXT NOT NULL, -- e.g., '01', '02'
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('electronics', 'robotics', 'programming', 'projects', 'esports')),
  description TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'BOTH' CHECK (format IN ('SOLO', 'TEAM', 'BOTH')),
  min_members INT NOT NULL DEFAULT 1,
  max_members INT NOT NULL DEFAULT 1,
  solo_fee NUMERIC NOT NULL DEFAULT 0,
  team_fee NUMERIC NOT NULL DEFAULT 0,
  rules_summary TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id TEXT UNIQUE, -- e.g., 'SPEC26-NED-88421'
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  participation_model TEXT NOT NULL CHECK (participation_model IN ('individual', 'team')),
  team_name TEXT,
  leader_name TEXT NOT NULL,
  leader_student_id TEXT NOT NULL,
  university TEXT NOT NULL,
  department TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  payment_channel TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  receipt_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  calculated_fee NUMERIC NOT NULL DEFAULT 0,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4 Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  member_number INT NOT NULL CHECK (member_number IN (2, 3, 4)),
  full_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_competitions_slug ON public.competitions(slug);
CREATE INDEX IF NOT EXISTS idx_competitions_category ON public.competitions(category);
CREATE INDEX IF NOT EXISTS idx_competitions_is_active ON public.competitions(is_active);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_competition_id ON public.registrations(competition_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_team_members_registration_id ON public.team_members(registration_id);

-- ====================================================================
-- 4. AUTOMATIC PROFILE TRIGGER ON SUPABASE AUTH SIGNUP
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    university,
    department,
    student_id,
    phone
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', CASE WHEN NEW.email LIKE '%admin%' THEN 'admin' ELSE 'user' END),
    COALESCE(NEW.raw_user_meta_data->>'university', 'NED University of Engineering & Technology'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Electronic Engineering'),
    COALESCE(NEW.raw_user_meta_data->>'student_id', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if needed and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper function to check if current authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 5.1 Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- 5.2 Competitions Policies
DROP POLICY IF EXISTS "Active competitions are viewable by everyone" ON public.competitions;
CREATE POLICY "Active competitions are viewable by everyone"
  ON public.competitions FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can insert competitions" ON public.competitions;
CREATE POLICY "Only admins can insert competitions"
  ON public.competitions FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update competitions" ON public.competitions;
CREATE POLICY "Only admins can update competitions"
  ON public.competitions FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete competitions" ON public.competitions;
CREATE POLICY "Only admins can delete competitions"
  ON public.competitions FOR DELETE
  USING (public.is_admin());

-- 5.3 Registrations Policies
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;
CREATE POLICY "Users can view own registrations"
  ON public.registrations FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own registrations" ON public.registrations;
CREATE POLICY "Users can insert own registrations"
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;
CREATE POLICY "Admins can update registrations"
  ON public.registrations FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
CREATE POLICY "Admins can delete registrations"
  ON public.registrations FOR DELETE
  USING (public.is_admin());

-- 5.4 Team Members Policies
DROP POLICY IF EXISTS "Users can view team members of their registrations" ON public.team_members;
CREATE POLICY "Users can view team members of their registrations"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations
      WHERE registrations.id = team_members.registration_id
        AND (registrations.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Users can insert team members for their registrations" ON public.team_members;
CREATE POLICY "Users can insert team members for their registrations"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.registrations
      WHERE registrations.id = team_members.registration_id
        AND (registrations.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins can update team members" ON public.team_members;
CREATE POLICY "Admins can update team members"
  ON public.team_members FOR ALL
  USING (public.is_admin());

-- ====================================================================
-- 6. STORAGE BUCKET CONFIGURATION FOR PAYMENT VOUCHERS
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: allow authenticated users to upload receipts
DROP POLICY IF EXISTS "Allow authenticated users to upload payment receipts" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload payment receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-receipts' AND
    auth.role() = 'authenticated'
  );

-- Storage RLS: allow anyone with URL to view receipts
DROP POLICY IF EXISTS "Allow viewing payment receipts" ON storage.objects;
CREATE POLICY "Allow viewing payment receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-receipts');

-- Storage RLS: allow admins to delete/update receipts
DROP POLICY IF EXISTS "Allow admins to manage receipts" ON storage.objects;
CREATE POLICY "Allow admins to manage receipts"
  ON storage.objects FOR ALL
  USING (bucket_id = 'payment-receipts' AND public.is_admin());

-- ====================================================================
-- 7. INITIAL DATA SEED (11 SPEC'26 COMPETITION TRACKS)
-- ====================================================================
INSERT INTO public.competitions (
  track_number,
  title,
  slug,
  category,
  description,
  format,
  min_members,
  max_members,
  solo_fee,
  team_fee,
  rules_summary,
  is_active
) VALUES
(
  '01',
  'Project & Poster Exhibition',
  'project-poster',
  'projects',
  'Showcase capstone hardware and research prototypes evaluated by senior faculty and industry engineering panels.',
  'TEAM',
  2,
  4,
  0,
  2500,
  'Working hardware prototype or simulation testbed alongside standard A1 research poster presentation. Display bench & AC power outlet provided.',
  true
),
(
  '02',
  'Circuit Designing',
  'circuit-designing',
  'electronics',
  'Analyze circuit schematics, calculate operational bias points, and assemble discrete prototypes on breadboards under timed constraints.',
  'BOTH',
  1,
  2,
  1000,
  1800,
  'Components and breadboard provided on-site. Graded on circuit accuracy, stability, and speed of assembly.',
  true
),
(
  '03',
  'Circuit Simulation',
  'circuit-simulation',
  'electronics',
  'Model transient, frequency response, and stability characteristics for complex analog and digital circuits using SPICE suites.',
  'BOTH',
  1,
  2,
  1000,
  1800,
  'Conducted in Proteus / Multisim / LTspice environments. Evaluated on convergence, parameter sweep depth, and output accuracy.',
  true
),
(
  '04',
  'Speedy Soldering',
  'speedy-soldering',
  'electronics',
  'Precision through-hole and SMD soldering tested for IPC joint reliability, alignment accuracy, and thermal control under clock pressure.',
  'SOLO',
  1,
  1,
  1000,
  0,
  'Kit provided at station. Assessed on joint wetting, no cold bridges, pad integrity, and circuit continuity.',
  true
),
(
  '05',
  'Brainvolt (Tech Quiz)',
  'brainvolt',
  'electronics',
  'Rapid-fire technical buzzer challenge testing foundational mastery across semiconductor physics, circuit theory, and logic design.',
  'TEAM',
  2,
  2,
  0,
  1500,
  '3 knockout rounds: Written Qualifier, Rapid Conceptual Fire, and Final Hardware Buzzer round.',
  true
),
(
  '06',
  'Speed Programming',
  'speed-programming',
  'programming',
  'Solve complex algorithmic challenges, data structure problems, and optimizations under stringent time and memory constraints.',
  'BOTH',
  1,
  2,
  1000,
  1800,
  'Supported languages: C++, Python, Java. Automated testbench evaluation with instant leaderboard ranking.',
  true
),
(
  '07',
  'Hackathon',
  'hackathon',
  'programming',
  'An intensive prototyping sprint engineering functional software and embedded firmware solutions tailored to concrete industry prompts.',
  'TEAM',
  2,
  4,
  0,
  3000,
  '24-hour sprint. Prompt announced at opening ceremony. Requires live product demo, public repository, and architecture pitch.',
  true
),
(
  '08',
  'Line Following Robot',
  'line-following-robot',
  'robotics',
  'Autonomous navigation through high-speed curves, line inversions, and grid intersections using tuned PID loops and IR sensor arrays.',
  'TEAM',
  2,
  4,
  0,
  2500,
  'Dimensions max 25cm x 25cm. Fully autonomous; manual restart penalties apply. Official track specs published in guide.',
  true
),
(
  '09',
  'Robo Soccer',
  'robo-soccer',
  'robotics',
  'Radio-controlled tactical soccer match testing bot drivetrain agility, mechanical defense shields, and responsive ball control.',
  'TEAM',
  2,
  4,
  0,
  2500,
  'Max bot weight 5kg, voltage limit 12V DC. 1v1 match play in 5-minute halves with standardized tennis ball.',
  true
),
(
  '10',
  'Robo Race',
  'robo-race',
  'robotics',
  'High-octane obstacle circuit race requiring fast torque regulation across ramps, gravel bridges, and sharp mechanical chicanes.',
  'TEAM',
  2,
  4,
  0,
  2500,
  'Wireless radio or bluetooth control. 2 attempts allowed; fastest clean lap without course skips decides final ranking.',
  true
),
(
  '11',
  'Gaming Competitions',
  'gaming',
  'esports',
  'Inter-university tactical esports tournament staged in the department computing facilities. Games: To Be Announced.',
  'BOTH',
  1,
  4,
  800,
  2400,
  'Official esports rulebooks apply. Bring your own peripherals (keyboards/mice/headsets). Specific titles announced 1 week prior.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  track_number = EXCLUDED.track_number,
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  format = EXCLUDED.format,
  min_members = EXCLUDED.min_members,
  max_members = EXCLUDED.max_members,
  solo_fee = EXCLUDED.solo_fee,
  team_fee = EXCLUDED.team_fee,
  rules_summary = EXCLUDED.rules_summary,
  is_active = EXCLUDED.is_active;

-- ====================================================================
-- SUCCESS NOTICE
-- ====================================================================
COMMENT ON TABLE public.competitions IS 'SPEC26 active engineering tracks and fee matrices';
COMMENT ON TABLE public.registrations IS 'SPEC26 participant and squad registration submissions';
COMMENT ON TABLE public.team_members IS 'SPEC26 additional team members linked to registrations';
COMMENT ON TABLE public.profiles IS 'SPEC26 user profiles linked to auth.users';
