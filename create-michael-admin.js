#!/usr/bin/env node

/**
 * Create Micheal Admin User Script
 * This script creates the admin user "Micheal" in Supabase auth
 * The profile will be automatically created by the database triggers
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY, // Service key needed for admin operations
};

// Validate configuration
function validateConfig() {
  const missing = [];
  
  if (!config.supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!config.supabaseServiceKey) missing.push('SUPABASE_SERVICE_KEY');
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease set these environment variables and try again.');
    console.error('\nExample:');
    console.error('VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.error('SUPABASE_SERVICE_KEY=your-service-key-here');
    process.exit(1);
  }
}

// Initialize Supabase client with service key
function initializeSupabase() {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Create Micheal admin user
async function createMichealAdmin(supabase) {
  console.log('👤 Creating Micheal admin user...');
  
  try {
    // Check if admin user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error checking existing users:', listError.message);
      return null;
    }
    
    const existingAdmin = users?.find(user => user.email === 'admin@photography.com');
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.id);
      console.log('   Email:', existingAdmin.email);
      console.log('   Created:', existingAdmin.created_at);
      
      // Update user metadata to ensure name is "Micheal"
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        existingAdmin.id,
        {
          user_metadata: {
            name: 'Micheal',
            role: 'admin'
          }
        }
      );
      
      if (updateError) {
        console.warn('⚠️  Could not update user metadata:', updateError.message);
      } else {
        console.log('✅ User metadata updated with name "Micheal"');
      }
      
      return existingAdmin;
    }
    
    // Create new admin user
    console.log('🔧 Creating new admin user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@photography.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Micheal',
        full_name: 'Micheal',
        role: 'admin'
      }
    });
    
    if (error) {
      console.error('❌ Error creating admin user:', error.message);
      return null;
    }
    
    if (data.user) {
      console.log('✅ Micheal admin user created successfully!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Name: Micheal (from metadata)');
      return data.user;
    }
    
  } catch (error) {
    console.error('❌ Unexpected error creating admin user:', error.message);
    return null;
  }
  
  return null;
}

// Verify profile was created by triggers
async function verifyProfileCreation(supabase, adminUser) {
  console.log('🔍 Verifying profile creation...');
  
  try {
    // Wait a moment for triggers to execute
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@photography.com')
      .single();
    
    if (error) {
      console.error('❌ Error checking profile:', error.message);
      return false;
    }
    
    if (profile) {
      console.log('✅ Profile created automatically by triggers!');
      console.log('   Profile ID:', profile.id);
      console.log('   Name:', profile.name);
      console.log('   Email:', profile.email);
      console.log('   Role:', profile.role);
      console.log('   Created:', profile.created_at);
      
      if (profile.name === 'Micheal' && profile.role === 'admin') {
        console.log('✅ Profile has correct name "Micheal" and admin role!');
        return true;
      } else {
        console.warn('⚠️  Profile exists but has incorrect data');
        return false;
      }
    } else {
      console.error('❌ Profile not found - triggers may not be working');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error verifying profile:', error.message);
    return false;
  }
}

// Test login functionality
async function testLogin(supabase) {
  console.log('🔐 Testing login functionality...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@photography.com',
      password: 'admin123'
    });
    
    if (error) {
      console.error('❌ Login test failed:', error.message);
      return false;
    }
    
    if (data.user) {
      console.log('✅ Login test successful!');
      console.log('   User authenticated:', data.user.email);
      
      // Sign out after test
      await supabase.auth.signOut();
      console.log('✅ Test login session closed');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Login test error:', error.message);
    return false;
  }
  
  return false;
}

// Check sync status
async function checkSyncStatus(supabase) {
  console.log('📊 Checking auth-profile sync status...');
  
  try {
    const { data, error } = await supabase.rpc('check_auth_profile_sync');
    
    if (error) {
      console.error('❌ Error checking sync status:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      const syncData = data[0];
      console.log('📈 Sync Status:');
      console.log(`   Auth Users: ${syncData.auth_users_count}`);
      console.log(`   Profiles: ${syncData.profiles_count}`);
      console.log(`   Missing Profiles: ${syncData.missing_profiles}`);
      console.log(`   Orphaned Profiles: ${syncData.orphaned_profiles}`);
      
      if (syncData.missing_profiles === 0 && syncData.orphaned_profiles === 0) {
        console.log('✅ Perfect sync - all auth users have profiles!');
      } else {
        console.warn('⚠️  Sync issues detected');
      }
    }
    
  } catch (error) {
    console.warn('⚠️  Could not check sync status:', error.message);
  }
}

// Main function
async function main() {
  console.log('🚀 Creating Micheal Admin User...\n');
  
  // Validate configuration
  validateConfig();
  console.log('✅ Configuration validated\n');
  
  // Initialize Supabase
  const supabase = initializeSupabase();
  console.log('✅ Supabase client initialized\n');
  
  // Create Micheal admin user
  const adminUser = await createMichealAdmin(supabase);
  if (!adminUser) {
    console.error('💥 Failed to create admin user');
    process.exit(1);
  }
  console.log('');
  
  // Verify profile creation
  const profileOk = await verifyProfileCreation(supabase, adminUser);
  console.log('');
  
  // Test login
  const loginOk = await testLogin(supabase);
  console.log('');
  
  // Check sync status
  await checkSyncStatus(supabase);
  console.log('');
  
  // Final status
  if (profileOk && loginOk) {
    console.log('🎉 Micheal Admin User Setup Completed Successfully!');
    console.log('');
    console.log('Admin Credentials:');
    console.log('  Name: Micheal');
    console.log('  Email: admin@photography.com');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    console.log('');
    console.log('✅ You can now login with these credentials!');
    console.log('✅ Profile will show "Micheal" as the name');
    console.log('✅ Admin dashboard access enabled');
  } else {
    console.log('⚠️  Setup completed with issues. Please check the logs above.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { main };