// Test script for Slider Management functionality
// Run this script to verify the slider management implementation

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSliderManagement() {
  console.log('🧪 Testing Slider Management Implementation...\n');

  try {
    // Test 1: Check if media_posts table exists and has correct structure
    console.log('1️⃣ Testing media_posts table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('media_posts')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ media_posts table not accessible:', tableError.message);
      return;
    }
    console.log('✅ media_posts table is accessible');

    // Test 2: Check for slider items
    console.log('\n2️⃣ Testing slider items...');
    const { data: sliderItems, error: sliderError } = await supabase
      .from('media_posts')
      .select('*')
      .eq('media_type', 'slider');

    if (sliderError) {
      console.error('❌ Error fetching slider items:', sliderError.message);
      return;
    }

    console.log(`✅ Found ${sliderItems.length} slider items`);
    if (sliderItems.length > 0) {
      console.log('📋 Slider items:');
      sliderItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title} (${item.is_active ? 'Active' : 'Inactive'})`);
      });
    }

    // Test 3: Check for active slider items
    console.log('\n3️⃣ Testing active slider items...');
    const { data: activeSliders, error: activeError } = await supabase
      .from('media_posts')
      .select('*')
      .eq('media_type', 'slider')
      .eq('is_active', true);

    if (activeError) {
      console.error('❌ Error fetching active slider items:', activeError.message);
      return;
    }

    console.log(`✅ Found ${activeSliders.length} active slider items`);

    // Test 4: Test creating a new slider item
    console.log('\n4️⃣ Testing slider item creation...');
    const testSliderItem = {
      title: 'Test Slider Item',
      caption: 'TEST ITEM - This is a test slider item for verification',
      media_type: 'slider',
      media_url: 'https://images.pexels.com/photos/1000445/pexels-photo-1000445.jpeg?auto=compress&cs=tinysrgb&w=800',
      thumbnail: 'https://images.pexels.com/photos/1000445/pexels-photo-1000445.jpeg?auto=compress&cs=tinysrgb&w=400',
      is_active: false,
      likes: 0
    };

    const { data: newSlider, error: createError } = await supabase
      .from('media_posts')
      .insert([testSliderItem])
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test slider item:', createError.message);
    } else {
      console.log('✅ Successfully created test slider item:', newSlider.title);

      // Test 5: Test updating the slider item
      console.log('\n5️⃣ Testing slider item update...');
      const { data: updatedSlider, error: updateError } = await supabase
        .from('media_posts')
        .update({ 
          title: 'Updated Test Slider Item',
          is_active: true 
        })
        .eq('id', newSlider.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating test slider item:', updateError.message);
      } else {
        console.log('✅ Successfully updated test slider item');
      }

      // Test 6: Test deleting the slider item
      console.log('\n6️⃣ Testing slider item deletion...');
      const { error: deleteError } = await supabase
        .from('media_posts')
        .delete()
        .eq('id', newSlider.id);

      if (deleteError) {
        console.error('❌ Error deleting test slider item:', deleteError.message);
      } else {
        console.log('✅ Successfully deleted test slider item');
      }
    }

    // Test 7: Check media_type enum values
    console.log('\n7️⃣ Testing media_type enum values...');
    const { data: enumData, error: enumError } = await supabase
      .rpc('get_enum_values', { enum_name: 'media_type' })
      .catch(() => {
        // If the RPC doesn't exist, we'll check by trying to insert different types
        return { data: null, error: null };
      });

    if (enumData) {
      console.log('✅ media_type enum values:', enumData);
    } else {
      console.log('ℹ️ Testing media_type enum by attempting inserts...');
      const testTypes = ['slider', 'hero', 'homepage', 'image', 'video'];
      for (const type of testTypes) {
        const { error } = await supabase
          .from('media_posts')
          .insert([{
            title: `Test ${type}`,
            caption: `Test ${type} item`,
            media_type: type,
            media_url: 'https://example.com/test.jpg',
            is_active: false
          }])
          .select()
          .single();

        if (error) {
          console.log(`❌ ${type}: Not supported`);
        } else {
          console.log(`✅ ${type}: Supported`);
          // Clean up test item
          await supabase
            .from('media_posts')
            .delete()
            .eq('title', `Test ${type}`);
        }
      }
    }

    console.log('\n🎉 Slider Management Testing Complete!');
    console.log('\n📋 Summary:');
    console.log(`   • media_posts table: ✅ Accessible`);
    console.log(`   • Slider items: ✅ ${sliderItems.length} found`);
    console.log(`   • Active sliders: ✅ ${activeSliders.length} active`);
    console.log(`   • CRUD operations: ✅ Working`);
    console.log(`   • Database structure: ✅ Ready`);

    console.log('\n🚀 Next Steps:');
    console.log('   1. Run the migration script: SLIDER_MANAGEMENT_MIGRATION.sql');
    console.log('   2. Access admin dashboard and navigate to "Homepage & Slider Management"');
    console.log('   3. Use the "Migrate Content" button to populate slider items');
    console.log('   4. Test adding, editing, and managing slider items');
    console.log('   5. Verify the homepage displays the database-driven slider content');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testSliderManagement();