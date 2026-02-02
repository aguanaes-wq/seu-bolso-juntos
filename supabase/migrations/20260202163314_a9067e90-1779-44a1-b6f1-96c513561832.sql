-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  person TEXT NOT NULL DEFAULT 'Você',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('savings', 'limit')),
  category TEXT,
  period TEXT NOT NULL DEFAULT 'month',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for MVP - no auth yet)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create public access policies (MVP without auth)
CREATE POLICY "Allow public read transactions" 
ON public.transactions FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update transactions" 
ON public.transactions FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete transactions" 
ON public.transactions FOR DELETE 
USING (true);

CREATE POLICY "Allow public read goals" 
ON public.goals FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert goals" 
ON public.goals FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update goals" 
ON public.goals FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete goals" 
ON public.goals FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;