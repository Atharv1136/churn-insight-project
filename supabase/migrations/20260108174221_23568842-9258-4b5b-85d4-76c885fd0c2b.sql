-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL UNIQUE,
  tenure INTEGER NOT NULL DEFAULT 0,
  monthly_charges NUMERIC(10,2) NOT NULL DEFAULT 0,
  contract_type TEXT NOT NULL DEFAULT 'Month-to-month',
  payment_method TEXT NOT NULL DEFAULT 'Electronic check',
  internet_service TEXT NOT NULL DEFAULT 'Fiber optic',
  tech_support BOOLEAN NOT NULL DEFAULT false,
  churn_status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create predictions table
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  churn_probability NUMERIC(5,4) NOT NULL,
  risk_level TEXT NOT NULL,
  prediction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  model_version TEXT NOT NULL DEFAULT 'v1.0',
  features JSONB,
  top_reasons JSONB,
  recommended_actions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create model_metrics table
CREATE TABLE public.model_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  accuracy NUMERIC(5,4) NOT NULL,
  precision_score NUMERIC(5,4) NOT NULL,
  recall NUMERIC(5,4) NOT NULL,
  f1_score NUMERIC(5,4) NOT NULL,
  roc_auc NUMERIC(5,4) NOT NULL,
  trained_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feature_importance table
CREATE TABLE public.feature_importance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  importance_score NUMERIC(5,4) NOT NULL,
  model_version TEXT NOT NULL DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_importance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Users can view their own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for predictions
CREATE POLICY "Users can view their own predictions" ON public.predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own predictions" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own predictions" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own predictions" ON public.predictions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for model_metrics
CREATE POLICY "Users can view their own metrics" ON public.model_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own metrics" ON public.model_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own metrics" ON public.model_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own metrics" ON public.model_metrics FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for feature_importance
CREATE POLICY "Users can view their own feature importance" ON public.feature_importance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own feature importance" ON public.feature_importance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feature importance" ON public.feature_importance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own feature importance" ON public.feature_importance FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for predictions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictions;