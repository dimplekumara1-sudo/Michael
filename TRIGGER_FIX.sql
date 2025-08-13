-- TEMPORARY TRIGGER FIX
-- This script temporarily disables problematic triggers to allow user registration
-- Run this if you're getting "Database error saving new user" errors

-- First, let's check what triggers exist
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Temporarily disable the trigger that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate a safer version of the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create profile if it doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        BEGIN
            INSERT INTO public.profiles (id, name, email, mobile, role)
            VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
                NEW.email,
                NEW.raw_user_meta_data->>'mobile',
                CASE 
                    WHEN NEW.email = 'admin@photography.com' THEN 'admin'::user_role
                    ELSE 'user'::user_role
                END
            );
        EXCEPTION WHEN OTHERS THEN
            -- Log the error but don't fail the user creation
            RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new safer trigger
CREATE TRIGGER on_auth_user_created_safe
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_safe();

-- Alternative: If you want to completely disable automatic profile creation
-- and handle it manually in the application, uncomment the line below:
-- DROP TRIGGER IF EXISTS on_auth_user_created_safe ON auth.users;

-- Ensure the create_profile_for_user function exists and works
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    user_mobile TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    profile_record RECORD;
BEGIN
    -- Try to insert the profile
    BEGIN
        INSERT INTO public.profiles (id, email, name, mobile, role, avatar)
        VALUES (
            user_id,
            user_email,
            user_name,
            user_mobile,
            CASE 
                WHEN user_email = 'admin@photography.com' THEN 'admin'::user_role
                ELSE 'user'::user_role
            END,
            NULL
        )
        RETURNING * INTO profile_record;
        
        -- Return success with profile data
        SELECT json_build_object(
            'success', true,
            'profile', row_to_json(profile_record)
        ) INTO result;
        
        RETURN result;
        
    EXCEPTION WHEN unique_violation THEN
        -- Profile already exists, fetch it
        SELECT * INTO profile_record
        FROM public.profiles
        WHERE id = user_id;
        
        IF FOUND THEN
            SELECT json_build_object(
                'success', true,
                'profile', row_to_json(profile_record),
                'message', 'Profile already exists'
            ) INTO result;
        ELSE
            SELECT json_build_object(
                'success', false,
                'error', 'Profile exists but could not be retrieved'
            ) INTO result;
        END IF;
        
        RETURN result;
        
    EXCEPTION WHEN OTHERS THEN
        -- Other error occurred
        SELECT json_build_object(
            'success', false,
            'error', SQLERRM
        ) INTO result;
        
        RETURN result;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT public.create_profile_for_user(
    '00000000-0000-0000-0000-000000000000'::UUID,
    'test@example.com',
    'Test User'
);