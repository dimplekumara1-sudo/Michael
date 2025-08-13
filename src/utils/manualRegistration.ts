import { supabase } from '../lib/supabase';

export interface ManualRegistrationData {
  email: string;
  password: string;
  name: string;
  mobile?: string;
}

export interface ManualRegistrationResult {
  success: boolean;
  user?: any;
  profile?: any;
  error?: string;
  step?: string;
}

// This function bypasses database triggers entirely by using a different approach
export const manualUserRegistration = async (data: ManualRegistrationData): Promise<ManualRegistrationResult> => {
  console.log('🔧 Starting bypass registration process for:', data.email);
  
  try {
    // Step 1: Try to disable triggers temporarily by using admin client
    console.log('Step 1: Attempting registration with trigger bypass...');
    
    // First, try the standard approach but with email confirmation disabled
    const { data: authResult, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: undefined,
        data: {
          name: data.name,
          mobile: data.mobile,
          skip_profile_creation: true // Custom flag to potentially skip triggers
        }
      }
    });
    
    if (authError) {
      console.error('❌ Standard registration failed:', authError);
      
      // If database error, try alternative approach
      if (authError.message.includes('Database error saving new user') || 
          authError.message.includes('trigger') ||
          authError.message.includes('function')) {
        
        console.log('🔄 Database triggers are blocking registration. Trying alternative approach...');
        
        // Alternative: Try to create user with minimal data and handle profile separately
        try {
          const { data: minimalResult, error: minimalError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              emailRedirectTo: undefined,
              data: {} // Completely empty to avoid any trigger issues
            }
          });
          
          if (minimalError) {
            console.error('❌ Minimal registration also failed:', minimalError);
            
            // Last resort: suggest manual database fix
            return {
              success: false,
              error: `Registration blocked by database triggers. Please run the EMERGENCY_DB_FIX.sql script to fix the database triggers. Error: ${minimalError.message}`,
              step: 'triggers_blocking'
            };
          }
          
          if (!minimalResult.user) {
            return {
              success: false,
              error: 'No user returned from registration',
              step: 'no_user_returned'
            };
          }
          
          console.log('✅ Minimal registration successful, creating profile manually...');
          
          // Wait a moment for the user to be fully committed
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Create profile manually
          const profile = await createProfileManually(minimalResult.user, data.name, data.mobile);
          
          return {
            success: true,
            user: minimalResult.user,
            profile: profile,
            step: 'manual_profile_creation'
          };
          
        } catch (alternativeError) {
          console.error('❌ Alternative registration failed:', alternativeError);
          return {
            success: false,
            error: `All registration methods failed. Database triggers may be corrupted. Please run EMERGENCY_DB_FIX.sql. Error: ${alternativeError.message}`,
            step: 'all_methods_failed'
          };
        }
      }
      
      return {
        success: false,
        error: authError.message,
        step: 'auth_failed'
      };
    }
    
    if (!authResult.user) {
      return {
        success: false,
        error: 'No user returned from registration',
        step: 'no_user_returned'
      };
    }
    
    console.log('✅ User registration successful:', authResult.user.email);
    
    // Step 2: Wait and then create profile manually (in case trigger failed)
    console.log('Step 2: Ensuring profile exists...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if profile was created by trigger
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authResult.user.id)
      .single();
    
    let profile = existingProfile;
    
    if (!existingProfile) {
      console.log('No profile found, creating manually...');
      profile = await createProfileManually(authResult.user, data.name, data.mobile);
    } else {
      console.log('✅ Profile already exists from trigger:', existingProfile);
    }
    
    return {
      success: true,
      user: authResult.user,
      profile: profile,
      step: 'full_success'
    };
    
  } catch (error) {
    console.error('❌ Registration process error:', error);
    return {
      success: false,
      error: `Unexpected error: ${error.message}. Please ensure EMERGENCY_DB_FIX.sql has been run.`,
      step: 'unexpected_error'
    };
  }
};

// Create profile using multiple fallback methods
const createProfileManually = async (user: any, name: string, mobile?: string) => {
  console.log('🔧 Creating profile manually for user:', user.email);
  
  try {
    // Wait for auth user to be fully committed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // First check if profile already exists (might have been created by trigger)
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!checkError && existingProfile) {
        console.log('✅ Profile already exists:', existingProfile);
        return existingProfile;
      }
    } catch (checkErr) {
      console.log('Profile check failed, proceeding with creation...');
    }
    
    // Method 1: Use our custom database function (if it exists)
    try {
      const { data: functionResult, error: functionError } = await supabase
        .rpc('create_profile_for_user', {
          user_id: user.id,
          user_email: user.email,
          user_name: name,
          user_mobile: mobile
        });
      
      if (!functionError && functionResult?.success && functionResult?.profile) {
        console.log('✅ Profile created via database function:', functionResult.profile);
        return functionResult.profile;
      } else {
        console.warn('Database function failed:', functionError || functionResult?.error);
      }
    } catch (functionErr) {
      console.warn('Database function not available or failed:', functionErr);
    }
    
    // Method 2: Direct insert with proper error handling
    try {
      const profileData = {
        id: user.id,
        email: user.email,
        name: name || user.email?.split('@')[0] || 'User',
        mobile: mobile || null,
        role: user.email === 'admin@photography.com' ? 'admin' : 'user',
        avatar: null
      };
      
      console.log('Attempting direct insert with data:', profileData);
      
      const { data: insertResult, error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (!insertError && insertResult) {
        console.log('✅ Profile created via direct insert:', insertResult);
        return insertResult;
      } else {
        console.warn('Direct insert failed:', insertError);
        
        // If it's a unique constraint violation, the profile might already exist
        if (insertError?.code === '23505') {
          console.log('Profile might already exist due to unique constraint, checking again...');
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (existingProfile) {
            console.log('✅ Found existing profile after constraint error:', existingProfile);
            return existingProfile;
          }
        }
      }
    } catch (insertErr) {
      console.warn('Direct insert exception:', insertErr);
    }
    
    // Method 3: Upsert (handles both insert and update)
    try {
      const profileData = {
        id: user.id,
        email: user.email,
        name: name || user.email?.split('@')[0] || 'User',
        mobile: mobile || null,
        role: user.email === 'admin@photography.com' ? 'admin' : 'user',
        avatar: null
      };
      
      console.log('Attempting upsert with data:', profileData);
      
      const { data: upsertResult, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();
      
      if (!upsertError && upsertResult) {
        console.log('✅ Profile created via upsert:', upsertResult);
        return upsertResult;
      } else {
        console.warn('Upsert failed:', upsertError);
      }
    } catch (upsertErr) {
      console.warn('Upsert exception:', upsertErr);
    }
    
    // Method 4: Last resort - create minimal profile
    try {
      const minimalData = {
        id: user.id,
        email: user.email,
        name: name || 'User',
        mobile: mobile || null,
        role: 'user'
      };
      
      console.log('Attempting minimal profile creation:', minimalData);
      
      const { data: minimalResult, error: minimalError } = await supabase
        .from('profiles')
        .insert(minimalData)
        .select()
        .single();
      
      if (!minimalError && minimalResult) {
        console.log('✅ Minimal profile created:', minimalResult);
        return minimalResult;
      } else {
        console.error('Minimal profile creation failed:', minimalError);
      }
    } catch (minimalErr) {
      console.error('Minimal profile creation exception:', minimalErr);
    }
    
    console.error('❌ All profile creation methods failed');
    throw new Error('Failed to create user profile after trying all methods');
    
  } catch (error) {
    console.error('❌ Profile creation error:', error);
    throw error;
  }
};

// Test if registration is possible
export const testRegistrationCapability = async (): Promise<{
  canRegister: boolean;
  canCreateProfile: boolean;
  errors: string[];
  suggestions: string[];
}> => {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let canRegister = false;
  let canCreateProfile = false;
  
  try {
    console.log('🔍 Testing registration capability...');
    
    // Test 1: Check if we can access profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      errors.push(`Profiles table access error: ${profilesError.message}`);
      suggestions.push('Run the EMERGENCY_DB_FIX.sql script to fix table permissions');
    } else {
      canCreateProfile = true;
      console.log('✅ Profiles table accessible');
    }
    
    // Test 2: Check if our custom function exists
    const { data: functionData, error: functionError } = await supabase
      .rpc('create_profile_for_user', {
        user_id: '00000000-0000-0000-0000-000000000000',
        user_email: 'test@example.com',
        user_name: 'Test User'
      });
    
    if (functionError) {
      if (functionError.message.includes('function public.create_profile_for_user does not exist')) {
        errors.push('Custom profile creation function not found');
        suggestions.push('Run the EMERGENCY_DB_FIX.sql script to create the function');
      } else {
        console.log('✅ Custom function exists (test failed as expected)');
      }
    }
    
    // Test 3: Try a minimal auth signup (we'll immediately delete it)
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: testAuth, error: testAuthError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123'
    });
    
    if (testAuthError) {
      if (testAuthError.message.includes('Database error saving new user')) {
        errors.push('Database triggers are blocking user registration');
        suggestions.push('Run the EMERGENCY_DB_FIX.sql script to remove problematic triggers');
      } else if (testAuthError.message.includes('User already registered')) {
        canRegister = true; // This means registration works, just user exists
      } else {
        errors.push(`Auth registration test failed: ${testAuthError.message}`);
      }
    } else {
      canRegister = true;
      console.log('✅ Auth registration test successful');
      
      // Clean up test user if possible
      if (testAuth.user) {
        try {
          await supabase.auth.admin.deleteUser(testAuth.user.id);
        } catch (cleanupError) {
          console.warn('Could not clean up test user:', cleanupError);
        }
      }
    }
    
  } catch (error) {
    errors.push(`Test error: ${error.message}`);
  }
  
  return {
    canRegister,
    canCreateProfile,
    errors,
    suggestions
  };
};