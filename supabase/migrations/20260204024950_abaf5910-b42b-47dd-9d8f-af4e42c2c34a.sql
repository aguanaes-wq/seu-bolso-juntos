-- Create family_members table for PIN-based authentication
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Allow public read for authentication purposes
CREATE POLICY "Allow public read family_members" 
ON public.family_members 
FOR SELECT 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create categories table for custom categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'MoreHorizontal',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public access for categories
CREATE POLICY "Allow public read categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (true);

-- Insert default categories
INSERT INTO public.categories (name, icon, is_default) VALUES
('Alimentação', 'Utensils', true),
('Transporte', 'Car', true),
('Casa', 'Home', true),
('Contas', 'Receipt', true),
('Saúde', 'Heart', true),
('Educação', 'GraduationCap', true),
('Lazer', 'Gamepad2', true),
('Compras', 'ShoppingBag', true),
('Assinaturas', 'Tv', true),
('Outros', 'MoreHorizontal', true),
('Receita', 'Receipt', true);

-- Add new columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN member_id UUID REFERENCES public.family_members(id),
ADD COLUMN payment_method TEXT,
ADD COLUMN location TEXT;

-- Add member_id to goals table
ALTER TABLE public.goals 
ADD COLUMN member_id UUID REFERENCES public.family_members(id);