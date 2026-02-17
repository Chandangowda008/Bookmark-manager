-- ============================================
-- Smart Bookmark Manager - Database Schema
-- ============================================
-- 
-- This file contains all SQL commands needed to set up your Supabase database.
-- Run these commands in the Supabase SQL Editor (https://app.supabase.com)
-- 
-- What this does:
-- 1. Creates the bookmarks table
-- 2. Enables Row Level Security (RLS)
-- 3. Creates security policies to protect user data
-- 4. Enables Realtime subscriptions
--
-- ============================================

-- Step 1: Create the bookmarks table
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  -- Unique identifier for each bookmark (auto-generated)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key: links to auth.users table
  -- This identifies which user owns this bookmark
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Bookmark title (required)
  title TEXT NOT NULL,
  
  -- Bookmark URL (required)
  url TEXT NOT NULL,
  
  -- Timestamp when bookmark was created (auto-set)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.bookmarks IS 'Stores user bookmarks with real-time sync support';

-- Step 2: Create index for better query performance
-- ============================================
-- This speeds up queries that filter by user_id (which is every query)
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);

-- This speeds up queries that sort by created_at
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);

-- Step 3: Enable Row Level Security (RLS)
-- ============================================
-- This is CRITICAL for security!
-- Without RLS, any authenticated user could see all bookmarks.
-- With RLS, users can ONLY access their own data.
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies
-- ============================================

-- Policy 1: SELECT (Read) - Users can only read their own bookmarks
-- ============================================
-- This policy allows:
-- - Authenticated users to SELECT rows where user_id matches their auth.uid()
-- 
-- auth.uid() returns the ID of the currently authenticated user
-- If no user is authenticated, auth.uid() returns NULL and no rows are returned
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: INSERT (Create) - Users can only insert bookmarks for themselves
-- ============================================
-- This policy allows:
-- - Authenticated users to INSERT rows where user_id matches their auth.uid()
-- 
-- This prevents users from creating bookmarks for other users
CREATE POLICY "Users can create their own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: DELETE - Users can only delete their own bookmarks
-- ============================================
-- This policy allows:
-- - Authenticated users to DELETE rows where user_id matches their auth.uid()
-- 
-- This prevents users from deleting other users' bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy 4: UPDATE (Optional) - Users can only update their own bookmarks
-- ============================================
-- Although not used in the current app, this policy allows:
-- - Authenticated users to UPDATE rows where user_id matches their auth.uid()
-- 
-- This is useful if you want to add edit functionality later
CREATE POLICY "Users can update their own bookmarks"
  ON public.bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Enable Realtime
-- ============================================
-- This allows the app to subscribe to changes in the bookmarks table
-- Required for real-time sync across multiple tabs/devices
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;

-- ============================================
-- Setup Complete!
-- ============================================
-- 
-- Next steps:
-- 1. Go to Supabase Authentication settings
-- 2. Enable Google OAuth provider
-- 3. Configure Google OAuth credentials
-- 4. Set the redirect URL to: https://your-project.supabase.co/auth/v1/callback
-- 5. Copy your Supabase URL and Anon Key to .env.local
-- 
-- Test RLS:
-- You can test that RLS is working by:
-- 1. Creating two different Google accounts
-- 2. Logging in as User A and adding bookmarks
-- 3. Logging in as User B (different browser/incognito)
-- 4. Verifying User B cannot see User A's bookmarks
-- 
-- Verify in Supabase Dashboard:
-- - Go to Table Editor to see the bookmarks table
-- - Go to Database > Policies to see the RLS policies
-- - Go to Database > Replication to verify Realtime is enabled
-- 
-- ============================================
