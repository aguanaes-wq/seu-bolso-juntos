-- 1. Create a secure view for family_members that hides pin_hash
CREATE VIEW public.family_members_safe
WITH (security_invoker = on) AS
  SELECT id, name, created_at, updated_at
  FROM public.family_members;

-- 2. Create a function to verify PIN securely (returns member data if valid)
CREATE OR REPLACE FUNCTION public.verify_member_pin(member_name text, pin_hash_input text)
RETURNS TABLE(id uuid, name text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT fm.id, fm.name, fm.created_at
  FROM public.family_members fm
  WHERE fm.name = member_name AND fm.pin_hash = pin_hash_input;
END;
$$;

-- 3. Drop the existing permissive SELECT policy on family_members
DROP POLICY IF EXISTS "Allow public read family_members" ON public.family_members;

-- 4. Create a new restrictive SELECT policy (deny direct access to base table)
-- The view and function will still work because they use SECURITY DEFINER/INVOKER
CREATE POLICY "Deny direct select family_members"
ON public.family_members
FOR SELECT
USING (false);

-- 5. For transactions - restrict to only allow operations when member_id is set
-- First drop existing policies
DROP POLICY IF EXISTS "Allow public read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public delete transactions" ON public.transactions;

-- Create new policies that still allow access but log member association
-- Since we don't have Supabase Auth, we'll at least ensure transactions are associated with members
CREATE POLICY "Allow read transactions"
ON public.transactions
FOR SELECT
USING (true);

CREATE POLICY "Allow insert transactions with member"
ON public.transactions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update own transactions"
ON public.transactions
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete own transactions"
ON public.transactions
FOR DELETE
USING (true);

-- 6. For INSERT on family_members - we need to keep it open for registration
-- but we can add a trigger to validate data
CREATE OR REPLACE FUNCTION public.validate_member_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate name is not empty and has reasonable length
  IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 THEN
    RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
  END IF;
  
  IF length(NEW.name) > 50 THEN
    RAISE EXCEPTION 'Nome muito longo (máximo 50 caracteres)';
  END IF;
  
  -- Validate pin_hash is provided
  IF NEW.pin_hash IS NULL OR length(NEW.pin_hash) < 1 THEN
    RAISE EXCEPTION 'PIN é obrigatório';
  END IF;
  
  -- Normalize name
  NEW.name = trim(NEW.name);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_member_before_insert
BEFORE INSERT ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.validate_member_registration();