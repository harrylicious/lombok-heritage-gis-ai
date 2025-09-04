-- Fix RLS policies for conservation_projects table
-- Add missing INSERT, UPDATE, and DELETE policies

-- Allow authenticated users to create conservation projects
CREATE POLICY "Authenticated users can create conservation projects"
ON public.conservation_projects
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow project creators and admins to update conservation projects
CREATE POLICY "Project creators and admins can update conservation projects"
ON public.conservation_projects
FOR UPDATE
USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'cultural_expert'))
);

-- Allow project creators and admins to delete conservation projects
CREATE POLICY "Project creators and admins can delete conservation projects"
ON public.conservation_projects
FOR DELETE
USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'cultural_expert'))
);