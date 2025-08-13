-- CREATE PROPER PROFILES TABLE
-- Run this in Supabase Dashboard > SQL Editor

-- Create the profiles table (similar to your customer_users example)
CREATE TABLE public.profiles (
    id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NULL,
    mobile VARCHAR(20) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    avatar TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_email_key UNIQUE (email),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON public.profiles USING btree (mobile);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles USING btree (is_active);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@photography.com'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@photography.com'
        )
    );

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        CASE 
            WHEN NEW.email = 'admin@photography.com' THEN 'admin'
            ELSE 'user'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert profile for existing admin user if it doesn't exist
INSERT INTO public.profiles (id, email, name, role, mobile)
SELECT 
    id,
    email,
    COALESCE(
        raw_user_meta_data->>'name',
        raw_user_meta_data->>'full_name',
        'Micheal'
    ),
    CASE 
        WHEN email = 'admin@photography.com' THEN 'admin'
        ELSE 'user'
    END,
    raw_user_meta_data->>'mobile'
FROM auth.users
WHERE email = 'admin@photography.com'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

SELECT 'Profiles table created successfully!' as status;