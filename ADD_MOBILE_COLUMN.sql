-- ADD MOBILE COLUMN TO PROFILES TABLE
-- Run this script if you need to add the mobile column to an existing profiles table

-- Check if mobile column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'mobile'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN mobile TEXT;
        RAISE NOTICE 'Added mobile column to profiles table';
    ELSE
        RAISE NOTICE 'Mobile column already exists in profiles table';
    END IF;
END $$;

-- Update the create_profile_for_user function to include mobile
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

-- Update the trigger function to handle mobile
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

-- Test the updated function
SELECT public.create_profile_for_user(
    '00000000-0000-0000-0000-000000000000'::UUID,
    'test@example.com',
    'Test User',
    '+1234567890'
);