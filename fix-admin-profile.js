// Quick script to fix admin profile issue
// Run this with: node fix-admin-profile.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY'; // Use service key for admin operations

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminProfile() {
  try {
    console.log('🔧 Starting admin profile fix...');
    
    const adminUserId = 'f9bd45af-0ab3-4f35-b096-bdff6f69bd66';
    const adminEmail = 'admin@photography.com';
    
    // Check if profile exists
    console.log('🔍 Checking existing profile...');
    const { data: existingProfile, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUserId)
      .single();
    
    if (existingProfile && !getError) {
      console.log('📝 Profile exists, updating...');
      console.log('Current profile:', existingProfile);
      
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: 'Admin User',
          role: 'admin'
        })
        .eq('id', adminUserId)
        .select();
      
      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
      } else {
        console.log('✅ Profile updated successfully:', updatedProfile);
      }
    } else {
      console.log('➕ Profile does not exist, creating...');
      
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: adminUserId,
          name: 'Admin User',
          email: adminEmail,
          mobile: null,
          role: 'admin'
        })
        .select();
      
      if (createError) {
        console.error('❌ Error creating profile:', createError);
      } else {
        console.log('✅ Profile created successfully:', newProfile);
      }
    }
    
    // Verify the fix
    console.log('🔍 Verifying the fix...');
    const { data: finalProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUserId)
      .single();
    
    if (finalProfile && !verifyError) {
      console.log('✅ Final profile state:', finalProfile);
      console.log(`✅ Admin status: ${finalProfile.role === 'admin' ? 'ADMIN' : 'NOT ADMIN'}`);
      console.log(`✅ Name: ${finalProfile.name}`);
    } else {
      console.error('❌ Could not verify profile:', verifyError);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixAdminProfile();