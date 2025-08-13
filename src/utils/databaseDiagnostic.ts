import { supabase } from '../lib/supabase';

export interface DatabaseDiagnostic {
  canAccessProfiles: boolean;
  canAccessAuth: boolean;
  triggersExist: boolean;
  functionsExist: boolean;
  errors: string[];
  suggestions: string[];
}

export const runDatabaseDiagnostic = async (): Promise<DatabaseDiagnostic> => {
  const diagnostic: DatabaseDiagnostic = {
    canAccessProfiles: false,
    canAccessAuth: false,
    triggersExist: false,
    functionsExist: false,
    errors: [],
    suggestions: []
  };

  console.log('🔍 Running database diagnostic...');

  // Test 1: Check profiles table access
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      diagnostic.errors.push(`Profiles table error: ${error.message}`);
      diagnostic.suggestions.push('Run EMERGENCY_DB_FIX.sql to create/fix the profiles table');
    } else {
      diagnostic.canAccessProfiles = true;
      console.log('✅ Profiles table accessible');
    }
  } catch (error) {
    diagnostic.errors.push(`Profiles table exception: ${error.message}`);
  }

  // Test 2: Check if we can access auth schema (limited)
  try {
    const { data: session } = await supabase.auth.getSession();
    diagnostic.canAccessAuth = true;
    console.log('✅ Auth system accessible');
  } catch (error) {
    diagnostic.errors.push(`Auth system error: ${error.message}`);
    diagnostic.canAccessAuth = false;
  }

  // Test 3: Check if our custom function exists
  try {
    const { data, error } = await supabase
      .rpc('create_profile_for_user', {
        user_id: '00000000-0000-0000-0000-000000000000',
        user_email: 'test@example.com',
        user_name: 'Test User'
      });
    
    if (error) {
      if (error.message.includes('function public.create_profile_for_user does not exist')) {
        diagnostic.errors.push('Custom profile creation function missing');
        diagnostic.suggestions.push('Run EMERGENCY_DB_FIX.sql to create the create_profile_for_user function');
      } else {
        diagnostic.functionsExist = true;
        console.log('✅ Custom functions exist');
      }
    } else {
      diagnostic.functionsExist = true;
      console.log('✅ Custom functions working');
    }
  } catch (error) {
    diagnostic.errors.push(`Function test error: ${error.message}`);
  }

  // Test 4: Try a minimal registration test
  try {
    const testEmail = `diagnostic-test-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {}
      }
    });
    
    if (error) {
      if (error.message.includes('Database error saving new user')) {
        diagnostic.errors.push('Database triggers are blocking user registration');
        diagnostic.suggestions.push('Run TRIGGER_FIX.sql to fix problematic triggers');
      } else if (error.message.includes('User already registered')) {
        console.log('✅ Registration system working (user already exists)');
      } else {
        diagnostic.errors.push(`Registration test failed: ${error.message}`);
      }
    } else {
      console.log('✅ Registration test successful');
      
      // Clean up test user if possible
      if (data.user) {
        try {
          // Note: This requires admin privileges, might fail
          await supabase.auth.admin.deleteUser(data.user.id);
        } catch (cleanupError) {
          console.warn('Could not clean up test user (this is normal)');
        }
      }
    }
  } catch (error) {
    diagnostic.errors.push(`Registration test exception: ${error.message}`);
  }

  // Generate final recommendations
  if (diagnostic.errors.length === 0) {
    diagnostic.suggestions.push('Database appears to be working correctly');
  } else {
    diagnostic.suggestions.push('Multiple issues detected - run the suggested SQL scripts');
  }

  console.log('🔍 Diagnostic complete:', diagnostic);
  return diagnostic;
};

// Helper function to display diagnostic results
export const displayDiagnosticResults = (diagnostic: DatabaseDiagnostic): string => {
  let result = '🔍 Database Diagnostic Results:\n\n';
  
  result += `✅ Profiles Table: ${diagnostic.canAccessProfiles ? 'OK' : 'FAILED'}\n`;
  result += `✅ Auth System: ${diagnostic.canAccessAuth ? 'OK' : 'FAILED'}\n`;
  result += `✅ Custom Functions: ${diagnostic.functionsExist ? 'OK' : 'MISSING'}\n\n`;
  
  if (diagnostic.errors.length > 0) {
    result += '❌ Errors Found:\n';
    diagnostic.errors.forEach(error => {
      result += `• ${error}\n`;
    });
    result += '\n';
  }
  
  if (diagnostic.suggestions.length > 0) {
    result += '💡 Suggestions:\n';
    diagnostic.suggestions.forEach(suggestion => {
      result += `• ${suggestion}\n`;
    });
  }
  
  return result;
};