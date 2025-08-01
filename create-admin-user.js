#!/usr/bin/env node

/**
 * Create Admin User Script
 * This script creates the admin user in Supabase auth and profiles table
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

// Create admin user
async function createAdminUser(supabase) {
  console.log('👤 Creating admin user...');
  
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
      return existingAdmin;
    }
    
    // Create new admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@photography.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User',
        role: 'admin'
      }
    });
    
    if (error) {
      console.error('❌ Error creating admin user:', error.message);
      return null;
    }
    
    if (data.user) {
      console.log('✅ Admin user created successfully:', data.user.id);
      return data.user;
    }
    
  } catch (error) {
    console.error('❌ Unexpected error creating admin user:', error.message);
    return null;
  }
  
  return null;
}

// Create admin profile
async function createAdminProfile(supabase, adminUser) {
  console.log('📝 Creating admin profile...');
  
  try {
    const adminProfile = {
      id: adminUser.id,
      name: 'Admin User',
      email: 'admin@photography.com',
      mobile: null,
      role: 'admin'
    };
    
    // Use upsert to create or update
    const { data, error } = await supabase
      .from('profiles')
      .upsert(adminProfile, { onConflict: 'id' })
      .select();
    
    if (error) {
      console.error('❌ Error creating admin profile:', error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Admin profile created/updated successfully');
      console.log('   Profile:', data[0]);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Unexpected error creating admin profile:', error.message);
    return false;
  }
  
  return false;
}

// Verify setup
async function verifySetup(supabase) {
  console.log('🔍 Verifying admin setup...');
  
  try {
    // Check auth user
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error checking auth users:', authError.message);
      return false;
    }
    
    const adminAuthUser = users?.find(user => user.email === 'admin@photography.com');
    
    if (!adminAuthUser) {
      console.error('❌ Admin user not found in auth.users');
      return false;
    }
    
    console.log('✅ Admin auth user verified:', adminAuthUser.id);
    
    // Check profile
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@photography.com')
      .single();
    
    if (profileError || !adminProfile) {
      console.error('❌ Admin profile not found:', profileError?.message);
      return false;
    }
    
    console.log('✅ Admin profile verified:', adminProfile.name, `(${adminProfile.role})`);
    
    // Verify they match
    if (adminAuthUser.id === adminProfile.id && adminProfile.role === 'admin') {
      console.log('✅ Admin user and profile are properly linked!');
      return true;
    } else {
      console.error('❌ Admin user and profile mismatch');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error verifying setup:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Admin User Creation...\n');
  
  // Validate configuration
  validateConfig();
  console.log('✅ Configuration validated\n');
  
  // Initialize Supabase
  const supabase = initializeSupabase();
  console.log('✅ Supabase client initialized\n');
  
  // Create admin user
  const adminUser = await createAdminUser(supabase);
  if (!adminUser) {
    console.error('💥 Failed to create admin user');
    process.exit(1);
  }
  console.log('');
  
  // Create admin profile
  const profileCreated = await createAdminProfile(supabase, adminUser);
  if (!profileCreated) {
    console.error('💥 Failed to create admin profile');
    process.exit(1);
  }
  console.log('');
  
  // Verify setup
  const verified = await verifySetup(supabase);
  console.log('');
  
  if (verified) {
    console.log('🎉 Admin user setup completed successfully!');
    console.log('');
    console.log('Admin Credentials:');
    console.log('  Email: admin@photography.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('You can now login with these credentials.');
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