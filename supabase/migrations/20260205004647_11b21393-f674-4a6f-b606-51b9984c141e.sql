-- Create sessions table for server-side session management
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS on sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- No direct access to sessions table from client
CREATE POLICY "Deny direct access to sessions"
  ON public.sessions FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create index for faster token lookups
CREATE INDEX idx_sessions_token ON public.sessions(token);
CREATE INDEX idx_sessions_expires ON public.sessions(expires_at);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sessions WHERE expires_at < now();
END;
$$;

-- Update verify_member_pin to use bcrypt comparison (for future migration)
-- For now, we'll handle this in edge function

-- Function to validate session token (used by edge functions)
CREATE OR REPLACE FUNCTION public.validate_session(session_token text)
RETURNS TABLE(member_id uuid, member_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.member_id, fm.name
  FROM public.sessions s
  JOIN public.family_members fm ON s.member_id = fm.id
  WHERE s.token = session_token 
    AND s.expires_at > now();
END;
$$;

-- Function to create session (used by edge functions)
CREATE OR REPLACE FUNCTION public.create_session(p_member_id uuid, p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up old sessions for this member (keep max 5)
  DELETE FROM public.sessions 
  WHERE member_id = p_member_id 
    AND id NOT IN (
      SELECT id FROM public.sessions 
      WHERE member_id = p_member_id 
      ORDER BY created_at DESC 
      LIMIT 4
    );
  
  -- Insert new session
  INSERT INTO public.sessions (member_id, token, expires_at)
  VALUES (p_member_id, p_token, now() + interval '7 days');
END;
$$;

-- Function to delete session (logout)
CREATE OR REPLACE FUNCTION public.delete_session(session_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sessions WHERE token = session_token;
END;
$$;