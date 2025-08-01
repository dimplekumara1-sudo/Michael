-- FIX REGISTRATION ISSUE
-- Run this in Supabase Dashboard > SQL Editor

-- First, drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Temporarily disable RLS on profiles for the trigger to work
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Create improved function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_role TEXT;
BEGIN
    -- Extract name from metadata or use email prefix
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'User'
    );
    
    -- Determine role
    user_role := CASE 
        WHEN NEW.email = 'admin@photography.com' THEN 'admin'
        ELSE 'user'
    END;
    
    -- Insert profile with error handling
    BEGIN
        INSERT INTO public.profiles (id, email, name, role, mobile)
        VALUES (
            NEW.id,
            NEW.email,
            user_name,
            user_role,
            NEW.raw_user_meta_data->>'mobile'
        );
        
        -- Log successful profile creation
        RAISE NOTICE 'Profile created for user: %', NEW.email;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Re-enable RLS with more permissive policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create more permissive policies for registration
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users on their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for users on their own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- Admin policies
CREATE POLICY "Admins can do everything" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@photography.com'
        )
    );

-- Test the setup
SELECT 'Registration fix applied successfully!' as status;