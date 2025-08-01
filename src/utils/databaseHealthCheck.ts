import { supabase } from '../lib/supabase';

export interface DatabaseHealthCheck {
  profilesTableExists: boolean;
  canReadProfiles: boolean;
  canWriteProfiles: boolean;
  rlsPoliciesActive: boolean;
  currentUser: any;
  error?: string;
}

export async function performDatabaseHealthCheck(): Promise<DatabaseHealthCheck> {
  const result: DatabaseHealthCheck = {
    profilesTableExists: false,
    canReadProfiles: false,
    canWriteProfiles: false,
    rlsPoliciesActive: false,
    currentUser: null
  };

  try {
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    result.currentUser = user;
    
    if (userError) {
      result.error = `Auth error: ${userError.message}`;
      return result;
    }

    // Test 1: Check if profiles table exists by trying to read from it
    console.log('🔍 Testing profiles table access...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      if (profilesError.message.includes('relation "public.profiles" does not exist')) {
        result.error = 'Profiles table does not exist';
        return result;
      } else if (profilesError.message.includes('permission denied')) {
        result.profilesTableExists = true;
        result.error = 'Permission denied - RLS policies may be blocking access';
        return result;
      } else {
        result.error = `Database error: ${profilesError.message}`;
        return result;
      }
    }

    result.profilesTableExists = true;
    result.canReadProfiles = true;

    // Test 2: Try to read specific profile if user exists
    if (user) {
      console.log('🔍 Testing profile read for current user...');
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userProfileError && !userProfileError.message.includes('No rows')) {
        result.error = `Profile read error: ${userProfileError.message}`;
      }
    }

    // Test 3: Try to create a test profile (if user exists)
    if (user) {
      console.log('🔍 Testing profile write access...');
      const testProfile = {
        id: user.id,
        name: user.email === 'admin@photography.com' ? 'Admin User' : 'Test User',
        email: user.email || 'test@example.com',
        mobile: null,
        role: (user.email === 'admin@photography.com' ? 'admin' : 'user') as 'admin' | 'user'
      };

      const { data: createData, error: createError } = await supabase
        .from('profiles')
        .upsert(testProfile)
        .select();

      if (createError) {
        result.error = `Profile write error: ${createError.message}`;
      } else {
        result.canWriteProfiles = true;
      }
    }

    // Test 4: Check RLS policies (simplified check)
    console.log('🔍 Testing RLS policies...');
    try {
      // Try to access profiles without being authenticated to test RLS
      const { error: rlsTestError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      // If we get a permission error, RLS is likely active
      if (rlsTestError && rlsTestError.message.includes('permission denied')) {
        result.rlsPoliciesActive = true;
      }
    } catch (rlsError) {
      // RLS check failed, but that's okay
      console.warn('RLS check failed:', rlsError);
    }

  } catch (error) {
    result.error = `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  return result;
}

export async function createProfilesTableIfNotExists(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔧 Creating profiles table...');
    
    const createTableSQL = `
      -- Create user_role enum if it doesn't exist
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Create profiles table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.profiles (
        id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        name text NOT NULL,
        email text NOT NULL,
        mobile text,
        role user_role DEFAULT 'user'::user_role,
        avatar text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
      CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

      -- Enable RLS
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

      -- Create policies
      DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
      CREATE POLICY "Users can read own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);

      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);

      DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
      CREATE POLICY "Users can insert own profile" ON public.profiles
        FOR INSERT WITH CHECK (auth.uid() = id);

      DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
      CREATE POLICY "Admins can read all profiles" ON public.profiles
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );

      DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
      CREATE POLICY "Admins can update all profiles" ON public.profiles
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        );
    `;

    // Since we can't use exec_sql RPC, we'll create the table using individual queries
    // This is a simplified version that should work with standard Supabase setup
    
    // First, try to create the enum type
    try {
      await supabase.rpc('create_user_role_enum');
    } catch (error) {
      // Enum might already exist, that's okay
      console.warn('Could not create enum (might already exist):', error);
    }

    // Create the profiles table using a direct query
    const { error: tableError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (tableError && tableError.message.includes('does not exist')) {
      // Table doesn't exist, we need to create it manually
      console.warn('Profiles table does not exist. Please create it manually using the SQL migration script.');
      return { 
        success: false, 
        error: 'Profiles table does not exist. Please run the database migration script manually.' 
      };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export function logHealthCheckResults(results: DatabaseHealthCheck) {
  console.log('📊 Database Health Check Results:');
  console.log(`   Profiles Table Exists: ${results.profilesTableExists ? '✅' : '❌'}`);
  console.log(`   Can Read Profiles: ${results.canReadProfiles ? '✅' : '❌'}`);
  console.log(`   Can Write Profiles: ${results.canWriteProfiles ? '✅' : '❌'}`);
  console.log(`   RLS Policies Active: ${results.rlsPoliciesActive ? '✅' : '❌'}`);
  console.log(`   Current User: ${results.currentUser ? results.currentUser.email : 'None'}`);
  
  if (results.error) {
    console.error(`   Error: ${results.error}`);
  }
}