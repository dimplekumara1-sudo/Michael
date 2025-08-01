#!/usr/bin/env node

/**
 * Unified Auth Setup Script
 * This script sets up the unified authentication system between Supabase auth and profiles table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY, // Service key needed for admin operations
  migrationFile: path.join(__dirname, 'UNIFIED_AUTH_MIGRATION.sql')
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
    process.exit(1);
  }
  
  if (!fs.existsSync(config.migrationFile)) {
    console.error(`❌ Migration file not found: ${config.migrationFile}`);
    process.exit(1);
  }
}

// Initialize Supabase client
function initializeSupabase() {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Execute SQL migration
async function executeMigration(supabase) {
  console.log('📄 Reading migration file...');
  const migrationSQL = fs.readFileSync(config.migrationFile, 'utf8');
  
  console.log('🔧 Executing migration...');
  
  // Split the migration into individual statements
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`📝 Found ${statements.length} SQL statements to execute`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim()) {
      try {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.warn(`   ⚠️  Warning on statement ${i + 1}: ${error.message}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  Warning on statement ${i + 1}: ${error.message}`);
      }
    }
  }
  
  console.log('✅ Migration execution completed');
}

// Check sync status
async function checkSyncStatus(supabase) {
  console.log('🔍 Checking sync status...');
  
  try {
    const { data, error } = await supabase.rpc('check_auth_profile_sync');
    
    if (error) {
      console.error('❌ Error checking sync status:', error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      const syncData = data[0];
      console.log('📊 Sync Status:');
      console.log(`   Auth Users: ${syncData.auth_users_count}`);
      console.log(`   Profiles: ${syncData.profiles_count}`);
      console.log(`   Missing Profiles: ${syncData.missing_profiles}`);
      console.log(`   Orphaned Profiles: ${syncData.orphaned_profiles}`);
      
      if (syncData.missing_profiles === 0 && syncData.orphaned_profiles === 0) {
        console.log('✅ Auth and profiles are perfectly in sync!');
        return true;
      } else {
        console.log('⚠️  Sync issues detected');
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Error checking sync status:', error.message);
    return false;
  }
  
  return false;
}

// Verify admin user
async function verifyAdminUser(supabase) {
  console.log('👤 Verifying admin user...');
  
  try {
    // Check auth user
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return false;
    }
    
    const adminAuthUser = users?.find(user => user.email === 'admin@photography.com');
    
    if (!adminAuthUser) {
      console.log('⚠️  Admin user not found in auth.users');
      return false;
    }
    
    console.log(`✅ Admin auth user found: ${adminAuthUser.id}`);
    
    // Check profile
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@photography.com')
      .single();
    
    if (profileError || !adminProfile) {
      console.log('⚠️  Admin profile not found or error:', profileError?.message);
      return false;
    }
    
    console.log(`✅ Admin profile found: ${adminProfile.name} (${adminProfile.role})`);
    
    // Verify they match
    if (adminAuthUser.id === adminProfile.id && adminProfile.role === 'admin') {
      console.log('✅ Admin user and profile are properly linked!');
      return true;
    } else {
      console.log('⚠️  Admin user and profile mismatch');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error verifying admin user:', error.message);
    return false;
  }
}

// Create admin user if needed
async function ensureAdminUser(supabase) {
  console.log('🔐 Ensuring admin user exists...');
  
  try {
    // Try to create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@photography.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User'
      }
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Admin user already exists');
        return true;
      } else {
        console.error('❌ Error creating admin user:', error.message);
        return false;
      }
    }
    
    if (data.user) {
      console.log('✅ Admin user created successfully');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error.message);
    return false;
  }
  
  return false;
}

// Main setup function
async function main() {
  console.log('🚀 Starting Unified Auth Setup...\n');
  
  // Validate configuration
  validateConfig();
  console.log('✅ Configuration validated\n');
  
  // Initialize Supabase
  const supabase = initializeSupabase();
  console.log('✅ Supabase client initialized\n');
  
  // Ensure admin user exists
  await ensureAdminUser(supabase);
  console.log('');
  
  // Execute migration
  await executeMigration(supabase);
  console.log('');
  
  // Check sync status
  const syncOk = await checkSyncStatus(supabase);
  console.log('');
  
  // Verify admin user
  const adminOk = await verifyAdminUser(supabase);
  console.log('');
  
  // Final status
  if (syncOk && adminOk) {
    console.log('🎉 Unified Auth Setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test login with admin@photography.com / admin123');
    console.log('2. Verify admin dashboard access');
    console.log('3. Check that profile shows "Admin User" name');
  } else {
    console.log('⚠️  Setup completed with warnings');
    console.log('Please check the logs above and resolve any issues');
  }
}

// Run the setup
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { main };