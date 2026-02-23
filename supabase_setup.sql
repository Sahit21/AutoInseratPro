-- 1. Create user_access table
CREATE TABLE public.user_access (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  plan TEXT CHECK (plan IN ('starter', 'pro', 'business')),
  status TEXT CHECK (status IN ('active', 'trialing', 'canceled', 'past_due')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy (User can read own data)
CREATE POLICY "Users can view own access data" 
ON public.user_access 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Create Trigger Function to create user_access on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_access (user_id, plan, status)
  VALUES (new.id, NULL, NULL);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
