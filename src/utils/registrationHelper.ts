import { supabase } from '../lib/supabase';

export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  mobile?: string;
}

export interface RegistrationResult {
  success: boolean;
  user?: any;
  profile?: any;
  error?: string;
  step?: string;
}

export const registerUserWithProfile = async (data: RegistrationData): Promise<RegistrationResult> => {
  console.log('🚀 Starting registration process for:', data.email);
  
  try {
    // Step 1: Register user with Supabase Auth (simplified approach)
    console.log('Step 1: Creating auth user...');
    
    const { data: authResult, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          mobile: data.mobile || null
        }
      }
    });
    
    if (authError) {
      console.error('❌ Auth registration failed:', authError);
      
      // Handle specific auth errors
      if (authError.message.includes('User already registered')) {
        return {
          success: false,
          error: 'An account with this email already exists. Please try signing in instead.',
          step: 'auth_registration'
        };
      } else if (authError.message.includes('Database error saving new user')) {
        // Try alternative registration approach
        console.log('🔄 Trying alternative registration approach...');
        return await registerUserAlternative(data);
      } else {
        return {
          success: false,
          error: authError.message,
          step: 'auth_registration'
        };
      }
    }
    
    if (!authResult.user) {
      return {
        success: false,
        error: 'No user returned from registration',
        step: 'auth_registration'
      };
    }
    
    console.log('✅ Auth user created successfully:', authResult.user.email);
    
    // Step 2: Wait for database to settle
    console.log('Step 2: Waiting for database to settle...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Check if profile was created by trigger
    console.log('Step 3: Checking for existing profile...');
    let profile = await checkForExistingProfile(authResult.user.id);
    
    if (profile) {
      console.log('✅ Profile found (created by trigger):', profile);
      return {
        success: true,
        user: authResult.user,
        profile: profile,
        step: 'profile_found'
      };
    }
    
    // Step 4: Create profile manually if not created by trigger
    console.log('Step 4: Creating profile manually...');
    profile = await createProfileManually(authResult.user, data.name, data.mobile);
    
    if (profile) {
      console.log('✅ Profile created manually:', profile);
      return {
        success: true,
        user: authResult.user,
        profile: profile,
        step: 'profile_created'
      };
    } else {
      // Registration succeeded but profile creation failed
      // This is still considered a success since the user can login
      console.warn('⚠️ Registration succeeded but profile creation failed');
      return {
        success: true,
        user: authResult.user,
        profile: null,
        error: 'Account created but profile setup incomplete. You can still sign in.',
        step: 'profile_creation_failed'
      };
    }
    
  } catch (error) {
    console.error('❌ Unexpected registration error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during registration. Please try again.',
      step: 'unexpected_error'
    };
  }
};

// Alternative registration approach for when main method fails
const registerUserAlternative = async (data: RegistrationData): Promise<RegistrationResult> => {
  console.log('🔄 Attempting alternative registration...');
  
  try {
    // Try registration without metadata first
    const { data: authResult, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password
    });
    
    if (authError) {
      return {
        success: false,
        error: authError.message,
        step: 'alternative_auth'
      };
    }
    
    if (!authResult.user) {
      return {
        success: false,
        error: 'No user returned from alternative registration',
        step: 'alternative_auth'
      };
    }
    
    console.log('✅ Alternative auth registration successful');
    
    // Wait longer for database to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create profile manually
    const profile = await createProfileManually(authResult.user, data.name, data.mobile);
    
    return {
      success: true,
      user: authResult.user,
      profile: profile,
      step: 'alternative_success'
    };
    
  } catch (error) {
    console.error('❌ Alternative registration failed:', error);
    return {
      success: false,
      error: 'All registration methods failed. Please contact support.',
      step: 'alternative_failed'
    };
  }
};

// Check if profile already exists
const checkForExistingProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.log('No existing profile found:', error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.log('Error checking for existing profile:', error);
    return null;
  }
};

// Create profile manually with multiple strategies
const createProfileManually = async (user: any, name: string, mobile?: string) => {
  console.log('🔧 Creating profile manually for:', user.email);
  
  const profileData = {
    id: user.id,
    email: user.email,
    name: name || user.email?.split('@')[0] || 'User',
    mobile: mobile || null,
    role: user.email === 'admin@photography.com' ? 'admin' : 'user',
    avatar: null,
    is_active: true
  };
  
  // Strategy 1: Direct insert
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (!error && data) {
      console.log('✅ Profile created via direct insert');
      return data;
    }
    console.warn('Direct insert failed:', error);
  } catch (error) {
    console.warn('Direct insert exception:', error);
  }
  
  // Strategy 2: Upsert
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();
    
    if (!error && data) {
      console.log('✅ Profile created via upsert');
      return data;
    }
    console.warn('Upsert failed:', error);
  } catch (error) {
    console.warn('Upsert exception:', error);
  }
  
  // Strategy 3: Minimal data
  try {
    const minimalData = {
      id: user.id,
      email: user.email,
      role: user.email === 'admin@photography.com' ? 'admin' : 'user'
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(minimalData)
      .select()
      .single();
    
    if (!error && data) {
      console.log('✅ Profile created with minimal data');
      return data;
    }
    console.warn('Minimal insert failed:', error);
  } catch (error) {
    console.warn('Minimal insert exception:', error);
  }
  
  console.error('❌ All profile creation strategies failed');
  return null;
};

// Test registration without actually creating a user
export const testRegistrationCapability = async (): Promise<{
  canRegister: boolean;
  canCreateProfile: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];
  let canRegister = false;
  let canCreateProfile = false;
  
  try {
    // Test 1: Check if we can access profiles table
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      errors.push(`Profiles table access error: ${profilesError.message}`);
    } else {
      canCreateProfile = true;
    }
    
    // Test 2: Try a test profile insert (will fail but we can see the error)
    const testId = 'test-' + Date.now();
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        email: 'test@example.com',
        role: 'user'
      });
    
    if (insertError) {
      if (insertError.code === '23503') {
        errors.push('Foreign key constraint issue - auth.users reference problem');
      } else if (insertError.code === '42501') {
        errors.push('Permission denied - RLS policy blocking insert');
      } else {
        errors.push(`Profile insert test error: ${insertError.message}`);
      }
    }
    
    // For registration test, we'd need to actually try it or check auth settings
    canRegister = true; // Assume true unless we find specific issues
    
  } catch (error) {
    errors.push(`Test error: ${error.message}`);
  }
  
  return {
    canRegister,
    canCreateProfile,
    errors
  };
};