import { supabase, db } from '../lib/supabase';

export const initializeAdminProfile = async () => {
  try {
    console.log('Initializing admin profile...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No authenticated user found:', userError);
      return false;
    }
    
    console.log('Current user:', user.email, user.id);
    
    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await db.getProfile(user.id);
    
    if (existingProfile && !profileError) {
      console.log('Profile already exists:', existingProfile);
      return true;
    }
    
    console.log('Creating new profile for user...');
    
    // Create profile
    const profileData = {
      id: user.id,
      name: user.email === 'admin@photography.com' ? 'Admin User' : (user.email?.split('@')[0] || 'User'),
      email: user.email || '',
      mobile: null,
      role: (user.email === 'admin@photography.com' ? 'admin' : 'user') as 'admin' | 'user'
    };
    
    const { data: createdProfile, error: createError } = await db.createProfile(profileData);
    
    if (createError) {
      console.error('Error creating profile:', createError);
      return false;
    }
    
    console.log('Profile created successfully:', createdProfile);
    return true;
    
  } catch (error) {
    console.error('Error initializing admin profile:', error);
    return false;
  }
};

export const checkDatabaseConnection = async () => {
  try {
    console.log('Checking database connection...');
    
    // Try to fetch from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
    
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};