// Simple test script to verify Supabase connection
// Run with: node test-supabase.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vlvecmxfsbvwrcnminmz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsdmVjbXhmc2J2d3Jjbm1pbm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDM3ODAsImV4cCI6MjA2OTM3OTc4MH0.6-rTnD4NexiOb_yIjc6rDsga0yHH3IhdpB8UyuI2TOw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key present:', !!supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Connection error:', error);
      
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('\n❌ DATABASE ISSUE: The "profiles" table does not exist.');
        console.log('📋 ACTION REQUIRED: You need to run the migration SQL in your Supabase dashboard.');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Go to SQL Editor');
        console.log('   4. Copy and run the entire supabase_migration.sql file');
      } else if (error.message.includes('Invalid API key')) {
        console.log('\n❌ AUTH ISSUE: Invalid API key or URL.');
        console.log('📋 ACTION REQUIRED: Check your Supabase credentials.');
      } else {
        console.log('\n❌ OTHER ERROR:', error.message);
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('📊 Profiles table exists and is accessible');
    }
  } catch (err) {
    console.error('Network error:', err.message);
    console.log('\n❌ NETWORK ISSUE: Cannot reach Supabase servers.');
    console.log('📋 ACTION REQUIRED: Check your internet connection and URL.');
  }
}

testConnection();