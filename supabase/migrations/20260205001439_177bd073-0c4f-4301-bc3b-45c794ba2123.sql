-- Add INSERT policy for family_members table
CREATE POLICY "Allow public insert family_members" 
ON public.family_members 
FOR INSERT 
WITH CHECK (true);