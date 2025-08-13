import { supabase } from '../lib/supabase';

export const testDatabaseConnection = async () => {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Basic connection test
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return { success: false, error: connectionError };
    }
    
    console.log('✅ Database connection successful');
    
    // Test 2: Check if profiles table exists and has data
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles table query failed:', profilesError);
      return { success: false, error: profilesError };
    }
    
    console.log('✅ Profiles table accessible, found', profilesData?.length || 0, 'profiles');
    
    // Test 3: Check current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError);
      return { success: false, error: sessionError };
    }
    
    if (session?.user) {
      console.log('✅ Current session found for user:', session.user.email);
      
      // Test 4: Try to fetch current user's profile
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (userProfileError) {
        console.error('❌ User profile fetch failed:', userProfileError);
        console.error('Error details:', {
          message: userProfileError.message,
          details: userProfileError.details,
          hint: userProfileError.hint,
          code: userProfileError.code
        });
        return { success: false, error: userProfileError, hasSession: true, userId: session.user.id };
      }
      
      if (userProfile) {
        console.log('✅ User profile found:', userProfile);
        return { success: true, profile: userProfile, hasSession: true };
      } else {
        console.warn('⚠️ No profile found for current user');
        return { success: false, error: 'No profile found', hasSession: true, userId: session.user.id };
      }
    } else {
      console.log('ℹ️ No active session');
      return { success: true, hasSession: false };
    }
    
  } catch (error) {
    console.error('❌ Database test failed with exception:', error);
    return { success: false, error };
  }
};

// Function to create missing profile
export const createMissingProfile = async (userId: string, email: string) => {
  console.log('🔧 Creating missing profile for user:', email);
  
  try {
    const profileData = {
      id: userId,
      email: email,
      name: email === 'admin@photography.com' ? 'Micheal' : email.split('@')[0],
      mobile: null,
      role: email === 'admin@photography.com' ? 'admin' : 'user',
      avatar: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create profile:', error);
      return { success: false, error };
    }
    
    console.log('✅ Profile created successfully:', data);
    return { success: true, profile: data };
    
  } catch (error) {
    console.error('❌ Exception creating profile:', error);
    return { success: false, error };
  }
};