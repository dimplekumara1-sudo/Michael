-- Add mobile column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN mobile text NULL;

-- Create index for mobile column for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_mobile 
ON public.profiles USING btree (mobile) TABLESPACE pg_default;

-- Insert admin profile if it doesn't exist
INSERT INTO public.profiles (id, name, email, mobile, role, created_at, updated_at)
SELECT 
    'f9bd45af-0ab3-4f35-b096-bdff6f69bd66'::uuid,
    'Admin User',
    'admin@photography.com',
    NULL,
    'admin'::user_role,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = 'f9bd45af-0ab3-4f35-b096-bdff6f69bd66'::uuid
);

-- Update the profiles table to ensure admin role and name are set correctly
UPDATE public.profiles 
SET role = 'admin'::user_role, name = 'Admin User'
WHERE email = 'admin@photography.com';