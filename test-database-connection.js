// Simple test to check database connection and run migration
// Run this with: node test-database-connection.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Database connection successful');

    // Test 2: Check if media_posts table exists
    console.log('\n2️⃣ Checking media_posts table...');
    const { data: tableData, error: tableError } = await supabase
      .from('media_posts')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ media_posts table error:', tableError.message);
      console.log('💡 You may need to run the migration script first');
      return;
    }
    console.log('✅ media_posts table exists');

    // Test 3: Check current data
    console.log('\n3️⃣ Checking current data...');
    const { data: allData, error: dataError } = await supabase
      .from('media_posts')
      .select('*');
    
    if (dataError) {
      console.error('❌ Error fetching data:', dataError.message);
      return;
    }
    
    console.log(`📊 Total media posts: ${allData.length}`);
    
    // Show sample data structure
    if (allData.length > 0) {
      console.log('\n📋 Sample post structure:');
      console.log('Keys:', Object.keys(allData[0]));
      console.log('Sample post:', JSON.stringify(allData[0], null, 2));
    }
    
    const sliderPosts = allData.filter(post => post.media_type === 'slider');
    console.log(`\n📊 Slider posts: ${sliderPosts.length}`);
    
    const activeSliders = sliderPosts.filter(post => post.is_active);
    console.log(`📊 Active slider posts: ${activeSliders.length}`);

    if (sliderPosts.length > 0) {
      console.log('\n📋 Slider posts:');
      sliderPosts.forEach((post, index) => {
        console.log(`   ${index + 1}. ${post.title} (${post.is_active ? 'Active' : 'Inactive'})`);
      });

      // Activate all slider posts if none are active
      if (activeSliders.length === 0) {
        console.log('\n5️⃣ No active slider posts found. Activating all slider posts...');
        
        const { data: updateData, error: updateError } = await supabase
          .from('media_posts')
          .update({ is_active: true })
          .eq('media_type', 'slider')
          .select();

        if (updateError) {
          console.error('❌ Error activating slider posts:', updateError.message);
        } else {
          console.log(`✅ Successfully activated ${updateData.length} slider posts`);
          console.log('🎉 Slider posts are now active and should appear on the homepage!');
        }
      }
    }

    // Test 4: Try to insert test data if no slider posts exist
    if (sliderPosts.length === 0) {
      console.log('\n4️⃣ No slider posts found. Inserting test data...');
      
      const testSliderPosts = [
        {
          title: 'Wedding',
          caption: 'THE BIG DAY - Capturing your special day with artistic flair and attention to every precious detail',
          media_type: 'slider',
          media_url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
          thumbnail: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
          is_active: true,
          likes: 0
        },
        {
          title: 'Films',
          caption: 'CREATIVITY SHOW - Professional film production and creative storytelling',
          media_type: 'slider',
          media_url: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=800',
          thumbnail: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
          is_active: true,
          likes: 0
        },
        {
          title: 'Outdoors',
          caption: 'BEGINNING OF A JOURNEY - Nature and outdoor photography adventures',
          media_type: 'slider',
          media_url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=800',
          thumbnail: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
          is_active: true,
          likes: 0
        }
      ];

      const { data: insertData, error: insertError } = await supabase
        .from('media_posts')
        .insert(testSliderPosts)
        .select();

      if (insertError) {
        console.error('❌ Error inserting test data:', insertError.message);
        console.log('💡 This might be due to missing columns or enum values');
        console.log('💡 Please run the migration script: SLIDER_MANAGEMENT_MIGRATION.sql');
      } else {
        console.log(`✅ Successfully inserted ${insertData.length} test slider posts`);
      }
    }

    console.log('\n🎉 Database test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();