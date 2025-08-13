// =====================================================
// REPLACE SLIDER CONTENT - JavaScript Implementation
// =====================================================
// Run this with: node replace-slider-content.js
// =====================================================

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

// New slider content to replace existing content
const newSliderContent = [
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
    title: 'FILMS',
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
  },
  {
    title: 'Corporate',
    caption: 'PROFESSIONAL EXCELLENCE - Corporate events and professional photography',
    media_type: 'slider',
    media_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=800',
    thumbnail: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    is_active: true,
    likes: 0
  },
  {
    title: 'Portrait',
    caption: 'PERSONAL STORIES - Individual and family portrait sessions',
    media_type: 'slider',
    media_url: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=800',
    thumbnail: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=400',
    is_active: true,
    likes: 0
  },
  {
    title: 'Events',
    caption: 'MEMORABLE MOMENTS - Special events and celebration photography',
    media_type: 'slider',
    media_url: 'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=800',
    thumbnail: 'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=400',
    is_active: true,
    likes: 0
  }
];

async function replaceSliderContent() {
  console.log('🔄 Starting slider content replacement...\n');

  try {
    // Step 1: Check current slider content
    console.log('1️⃣ Checking current slider content...');
    const { data: currentSliders, error: fetchError } = await supabase
      .from('media_posts')
      .select('*')
      .eq('media_type', 'slider');

    if (fetchError) {
      console.error('❌ Error fetching current sliders:', fetchError.message);
      return;
    }

    console.log(`📊 Found ${currentSliders.length} existing slider posts`);

    // Step 2: Delete existing slider content
    console.log('\n2️⃣ Deleting existing slider content...');
    const { error: deleteError } = await supabase
      .from('media_posts')
      .delete()
      .eq('media_type', 'slider');

    if (deleteError) {
      console.error('❌ Error deleting existing sliders:', deleteError.message);
      return;
    }

    console.log('✅ Successfully deleted existing slider content');

    // Step 3: Insert new slider content
    console.log('\n3️⃣ Inserting new slider content...');
    const { data: insertedData, error: insertError } = await supabase
      .from('media_posts')
      .insert(newSliderContent)
      .select();

    if (insertError) {
      console.error('❌ Error inserting new sliders:', insertError.message);
      return;
    }

    console.log(`✅ Successfully inserted ${insertedData.length} new slider posts`);

    // Step 4: Verify the new content
    console.log('\n4️⃣ Verifying new slider content...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('media_posts')
      .select('*')
      .eq('media_type', 'slider')
      .order('created_at', { ascending: true });

    if (verifyError) {
      console.error('❌ Error verifying new content:', verifyError.message);
      return;
    }

    console.log('\n📋 New Slider Content:');
    verifyData.forEach((post, index) => {
      console.log(`   ${index + 1}. ${post.title} (${post.is_active ? 'Active' : 'Inactive'})`);
      console.log(`      Caption: ${post.caption.substring(0, 60)}...`);
      console.log(`      URL: ${post.media_url}`);
      console.log('');
    });

    // Step 5: Final statistics
    console.log('📊 Final Statistics:');
    console.log(`   Total slider posts: ${verifyData.length}`);
    console.log(`   Active slider posts: ${verifyData.filter(p => p.is_active).length}`);
    console.log(`   Inactive slider posts: ${verifyData.filter(p => !p.is_active).length}`);

    console.log('\n🎉 Slider content replacement completed successfully!');
    console.log('💡 The homepage will now display the new slider content.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Execute the replacement
replaceSliderContent();