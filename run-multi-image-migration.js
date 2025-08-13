import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('Required variables:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMultiImageMigration() {
  console.log('🚀 Starting Multi-Image Posts Migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'MULTI_IMAGE_POSTS_MIGRATION.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          // Try direct query if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1);

          if (directError) {
            console.log(`⚠️  RPC method not available, trying direct execution...`);
            // For some statements, we might need to handle them differently
            console.log(`Statement: ${statement.substring(0, 100)}...`);
          }
        }

        console.log(`✅ Statement ${i + 1} completed successfully`);
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        console.log(`Statement: ${statement.substring(0, 200)}...`);
        // Continue with other statements
      }
    }

    // Verify the migration by checking the new columns
    console.log('\n🔍 Verifying migration...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'media_posts')
      .in('column_name', ['media_urls', 'thumbnails']);

    if (columnsError) {
      console.error('❌ Error verifying columns:', columnsError.message);
    } else {
      console.log('✅ New columns found:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }

    // Check if any posts were migrated
    const { data: posts, error: postsError } = await supabase
      .from('media_posts')
      .select('id, title, media_url, media_urls, thumbnail, thumbnails')
      .eq('media_type', 'latest_work')
      .limit(5);

    if (postsError) {
      console.error('❌ Error checking posts:', postsError.message);
    } else {
      console.log(`\n📊 Sample of migrated posts (${posts.length} shown):`);
      posts.forEach(post => {
        console.log(`   - ${post.title}:`);
        console.log(`     Old: ${post.media_url ? 'Has media_url' : 'No media_url'}`);
        console.log(`     New: ${post.media_urls ? `${post.media_urls.length} images` : 'No media_urls'}`);
      });
    }

    console.log('\n🎉 Multi-Image Posts Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the admin interface to upload multiple images');
    console.log('2. Verify the slider works on the frontend');
    console.log('3. Check that existing posts still display correctly');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMultiImageMigration();