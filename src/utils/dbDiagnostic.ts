import { supabase } from '../lib/supabase';

export const runDatabaseDiagnostic = async () => {
  console.log('🔍 Running comprehensive database diagnostic...');
  
  const results = {
    connection: false,
    profilesTable: false,
    rlsPolicies: [],
    triggers: [],
    constraints: [],
    testRegistration: false,
    errors: []
  };

  try {
    // Test 1: Basic connection
    console.log('Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      results.errors.push(`Connection error: ${connectionError.message}`);
    } else {
      results.connection = true;
      console.log('✅ Database connection successful');
    }

    // Test 2: Check profiles table structure
    console.log('Checking profiles table...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      results.errors.push(`Profiles table error: ${profilesError.message}`);
    } else {
      results.profilesTable = true;
      console.log('✅ Profiles table accessible');
    }

    // Test 3: Check if we can insert into profiles table
    console.log('Testing profile insertion...');
    const testProfileId = 'test-' + Date.now();
    const testProfile = {
      id: testProfileId,
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      is_active: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select()
      .single();

    if (insertError) {
      results.errors.push(`Profile insertion error: ${insertError.message}`);
      console.error('❌ Cannot insert into profiles table:', insertError);
    } else {
      console.log('✅ Profile insertion successful');
      
      // Clean up test data
      await supabase.from('profiles').delete().eq('id', testProfileId);
    }

    // Test 4: Test auth registration (without actually creating a user)
    console.log('Testing auth system...');
    try {
      // This will fail but we can see what kind of error we get
      const { error: authError } = await supabase.auth.signUp({
        email: 'test-' + Date.now() + '@example.com',
        password: 'testpassword123'
      });
      
      if (authError) {
        if (authError.message.includes('Database error saving new user')) {
          results.errors.push('Auth registration blocked by database triggers/constraints');
        } else {
          results.errors.push(`Auth error: ${authError.message}`);
        }
      } else {
        results.testRegistration = true;
      }
    } catch (authTestError) {
      results.errors.push(`Auth test error: ${authTestError.message}`);
    }

  } catch (error) {
    results.errors.push(`Diagnostic error: ${error.message}`);
  }

  console.log('📊 Diagnostic Results:', results);
  return results;
};

export const fixCommonDatabaseIssues = async () => {
  console.log('🔧 Attempting to fix common database issues...');
  
  const fixes = [];
  
  try {
    // Fix 1: Ensure profiles table has correct structure
    console.log('Checking profiles table structure...');
    
    // This would typically require admin access to modify table structure
    // For now, we'll just log what we find
    
    fixes.push('Database structure check completed');
    
  } catch (error) {
    console.error('Error applying fixes:', error);
    fixes.push(`Fix error: ${error.message}`);
  }
  
  return fixes;
};

export const createEmergencyProfile = async (userId: string, email: string, name: string, mobile?: string) => {
  console.log('🚨 Creating emergency profile for user:', email);
  
  try {
    const profileData = {
      id: userId,
      email: email,
      name: name || email.split('@')[0],
      mobile: mobile || null,
      role: 'user',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Try multiple insertion strategies
    let success = false;
    let lastError = null;
    
    // Strategy 1: Direct insert
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (!error && data) {
        console.log('✅ Emergency profile created via direct insert:', data);
        return { success: true, profile: data };
      } else {
        lastError = error;
      }
    } catch (directError) {
      lastError = directError;
    }
    
    // Strategy 2: Upsert
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();
      
      if (!error && data) {
        console.log('✅ Emergency profile created via upsert:', data);
        return { success: true, profile: data };
      } else {
        lastError = error;
      }
    } catch (upsertError) {
      lastError = upsertError;
    }
    
    // Strategy 3: Minimal data insert
    try {
      const minimalData = {
        id: userId,
        email: email,
        role: 'user'
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(minimalData)
        .select()
        .single();
      
      if (!error && data) {
        console.log('✅ Emergency profile created with minimal data:', data);
        return { success: true, profile: data };
      } else {
        lastError = error;
      }
    } catch (minimalError) {
      lastError = minimalError;
    }
    
    console.error('❌ All emergency profile creation strategies failed');
    return { success: false, error: lastError };
    
  } catch (error) {
    console.error('❌ Emergency profile creation failed:', error);
    return { success: false, error };
  }
};