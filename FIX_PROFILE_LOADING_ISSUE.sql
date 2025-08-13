-- Fix Profile Loading Issue
-- This script addresses the profile loading timeout and creation issues

-- Step 1: Ensure the is_admin function exists
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing RLS policies to recreate them properly
DROP POLICY IF EXISTS "Enable read access for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Step 3: Create comprehensive RLS policies for profiles
-- Allow users to read their own profile and admins to read all profiles
CREATE POLICY "Enable read access for users" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        public.is_admin(auth.uid())
    );

-- Allow users to insert their own profile (important for profile creation)
CREATE POLICY "Enable insert for users" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id
    );

-- Allow users to update their own profile and admins to update any profile
CREATE POLICY "Enable update for users" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id OR 
        public.is_admin(auth.uid())
    );

-- Allow only admins to delete profiles
CREATE POLICY "Enable delete for admins" ON public.profiles
    FOR DELETE USING (
        public.is_admin(auth.uid())
    );

-- Step 4: Ensure the handle_new_user function is properly set up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Insert profile with proper error handling
    INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
    VALUES (
        NEW.id,
        CASE 
            WHEN NEW.email = 'admin@photography.com' THEN 'Micheal'
            ELSE COALESCE(
                NEW.raw_user_meta_data->>'name', 
                NEW.raw_user_meta_data->>'full_name', 
                split_part(NEW.email, '@', 1),
                'User'
            )
        END,
        NEW.email,
        CASE 
            WHEN NEW.email = 'admin@photography.com' THEN 'admin'::user_role
            ELSE 'user'::user_role
        END,
        NEW.created_at,
        NEW.updated_at
    );
    
    -- Log the profile creation
    RAISE NOTICE 'Profile created for user: % with email: %', NEW.id, NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, just log and continue
        RAISE NOTICE 'Profile already exists for user: % with email: %', NEW.id, NEW.email;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE NOTICE 'Error creating profile for user: % with email: %. Error: %', NEW.id, NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Create a function to manually create missing profiles
CREATE OR REPLACE FUNCTION public.create_missing_profile(user_id uuid, user_email text, user_name text DEFAULT NULL)
RETURNS public.profiles AS $$
DECLARE
    new_profile public.profiles;
BEGIN
    -- Try to insert the profile
    INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
    VALUES (
        user_id,
        COALESCE(user_name, split_part(user_email, '@', 1), 'User'),
        user_email,
        CASE 
            WHEN user_email = 'admin@photography.com' THEN 'admin'::user_role
            ELSE 'user'::user_role
        END,
        NOW(),
        NOW()
    )
    RETURNING * INTO new_profile;
    
    RETURN new_profile;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, return it
        SELECT * INTO new_profile FROM public.profiles WHERE id = user_id;
        RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create a function to fix existing users without profiles
CREATE OR REPLACE FUNCTION public.fix_missing_profiles()
RETURNS TABLE(user_id uuid, email text, profile_created boolean) AS $$
DECLARE
    user_record RECORD;
    profile_exists boolean;
BEGIN
    -- Loop through all auth users
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        WHERE au.email IS NOT NULL
    LOOP
        -- Check if profile exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_record.id) INTO profile_exists;
        
        IF NOT profile_exists THEN
            -- Create the missing profile
            BEGIN
                PERFORM public.create_missing_profile(
                    user_record.id, 
                    user_record.email,
                    COALESCE(
                        user_record.raw_user_meta_data->>'name',
                        user_record.raw_user_meta_data->>'full_name'
                    )
                );
                
                RETURN QUERY SELECT user_record.id, user_record.email, true;
            EXCEPTION
                WHEN OTHERS THEN
                    RETURN QUERY SELECT user_record.id, user_record.email, false;
            END;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Run the fix for existing users (optional - uncomment if needed)
-- SELECT * FROM public.fix_missing_profiles();

-- Step 9: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_missing_profile(uuid, text, text) TO authenticated;

-- Step 10: Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup ON public.profiles(email);

-- Step 11: Verify the setup
DO $$
BEGIN
    -- Check if RLS is enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE 'WARNING: RLS is not enabled on profiles table';
    ELSE
        RAISE NOTICE 'SUCCESS: RLS is enabled on profiles table';
    END IF;
    
    -- Check if trigger exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE 'WARNING: on_auth_user_created trigger does not exist';
    ELSE
        RAISE NOTICE 'SUCCESS: on_auth_user_created trigger exists';
    END IF;
END $$;

-- Step 12: Test the profile creation function (optional)
/*
-- Uncomment to test profile creation for a specific user
-- Replace 'test@example.com' with the actual email having issues
DO $$
DECLARE
    test_user_id uuid;
    test_profile public.profiles;
BEGIN
    -- Get the user ID for the test email
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'dimplekumara1@gmail.com';
    
    IF test_user_id IS NOT NULL THEN
        -- Try to create/get the profile
        SELECT * INTO test_profile FROM public.create_missing_profile(test_user_id, 'dimplekumara1@gmail.com');
        RAISE NOTICE 'Profile for dimplekumara1@gmail.com: %', test_profile;
    ELSE
        RAISE NOTICE 'User dimplekumara1@gmail.com not found in auth.users';
    END IF;
END $$;
*/

COMMIT;