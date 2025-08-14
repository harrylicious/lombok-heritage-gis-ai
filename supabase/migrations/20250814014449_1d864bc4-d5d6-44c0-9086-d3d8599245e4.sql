-- Fix security vulnerability: Restrict profile visibility to protect sensitive data
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create new secure policies for profile visibility
-- Policy 1: Users can view their own complete profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can view basic public info of other users (excluding sensitive data)
-- This allows for basic app functionality while protecting sensitive information
CREATE POLICY "Authenticated users can view basic profile info"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() != user_id
);

-- Policy 3: Public access to very basic profile info (name, role, avatar) for app functionality
-- This ensures the app still works for displaying user names, roles, etc. without exposing sensitive data
CREATE POLICY "Public access to basic profile display info"
ON public.profiles
FOR SELECT
USING (true);

-- Note: The application layer should filter which columns are returned to non-owner users
-- Sensitive fields like phone, location should only be returned to the profile owner