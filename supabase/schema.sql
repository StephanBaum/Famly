-- ==============================================================================
-- FAMLY 🏡 PostgreSQL Database Schema & Storage Setup for Supabase
-- ==============================================================================
-- How to apply:
-- 1. Create a free project at https://supabase.com
-- 2. Open the "SQL Editor" in your Supabase dashboard
-- 3. Paste and run this script
-- 4. Copy your Project URL & Anon Key into Vercel or .env.local:
--    VITE_SUPABASE_URL=https://your-project.supabase.co
--    VITE_SUPABASE_ANON_KEY=your-anon-key
-- ==============================================================================

-- 1. FAMILIES TABLE
CREATE TABLE IF NOT EXISTS public.families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Familie',
    join_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Familie',
    is_child BOOLEAN DEFAULT false,
    avatar TEXT NOT NULL DEFAULT '👤',
    color TEXT NOT NULL DEFAULT '#EC4899',
    pin TEXT,
    birthday DATE,
    notes TEXT,
    child_details JSONB,
    custom_fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location TEXT,
    member_ids JSONB DEFAULT '[]'::jsonb,
    category TEXT NOT NULL DEFAULT 'family',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. RECIPES TABLE
CREATE TABLE IF NOT EXISTS public.recipes (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    prep_time TEXT,
    servings INTEGER DEFAULT 4,
    category TEXT NOT NULL DEFAULT 'quick',
    image_url TEXT,
    notes TEXT,
    ingredients JSONB DEFAULT '[]'::jsonb,
    instructions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. MEAL PLANS TABLE
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES public.families(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    breakfast JSONB,
    lunch JSONB,
    dinner JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(family_id, date)
);

-- 6. GALLERIES & ALBUMS TABLE
CREATE TABLE IF NOT EXISTS public.galleries (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    cover_photo_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'everyday',
    created_by_member_id TEXT,
    is_public_shared BOOLEAN DEFAULT false,
    share_code TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    guest_reactions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. GROCERIES TABLE
CREATE TABLE IF NOT EXISTS public.groceries (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    store TEXT NOT NULL DEFAULT 'Rewe',
    amount TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    checked BOOLEAN DEFAULT false,
    added_by_member_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. CHORES TABLE
CREATE TABLE IF NOT EXISTS public.chores (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    assigned_member_id TEXT,
    frequency TEXT NOT NULL DEFAULT 'daily',
    completed BOOLEAN DEFAULT false,
    stars INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. PINNED NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id TEXT PRIMARY KEY,
    family_id TEXT REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    tag TEXT NOT NULL DEFAULT 'info',
    author_member_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 10. STORAGE BUCKET: family-photos (For real high-resolution photo uploads)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('family-photos', 'family-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to photos
CREATE POLICY "Public Photos Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'family-photos');

-- Allow authenticated and anon inserts for seamless family photo uploads
CREATE POLICY "Public Photos Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'family-photos');

-- ==============================================================================
-- 11. REALTIME REPLICATION (Instant sync across devices)
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.families;
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.galleries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groceries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
