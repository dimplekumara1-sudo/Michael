import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export class ProfileService {
  /**
   * Get profile by user ID with fallback creation
   */
static async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
  try {
    // First try to get existing profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile && !error) {
      console.log('Profile found:', profile);
      return { data: profile, error: null };
    }

    // If profile doesn't exist, try to create it from auth user
    console.log('Profile not found, attempting to create from auth user...');
    const createResult = await this.createProfileFromAuthUser(userId);
    
    if (createResult.data) {
      console.log('Profile created successfully:', createResult.data);
      return { data: createResult.data, error: null };
    } else {
      console.error('Failed to create profile:', createResult.error);
    }

    return { data: null, error: createResult.error };
  } catch (error) {
    console.error('Error in getProfile:', error);
    return { data: null, error };
  }
}

  /**
   * Create profile from auth user data
   */
  static async createProfileFromAuthUser(userId: string): Promise<{ data: Profile | null; error: any }> {
    try {
      // Get auth user data
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user || user.id !== userId) {
        return { data: null, error: authError || new Error('User mismatch') };
      }

      // Extract user data
      const name = this.extractUserName(user.email, user.user_metadata);
      const role = user.email === 'admin@photography.com' ? 'admin' : 'user';

      const profileData: ProfileInsert = {
        id: userId,
        name,
        email: user.email || '',
        mobile: user.user_metadata?.mobile || null,
        role: role as 'admin' | 'user'
      };

      // Create profile
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating profile from auth user:', error);
      return { data: null, error };
    }
  }

  /**
   * Update profile
   */
  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<{ data: Profile | null; error: any }> {
    try {
      // Prevent role changes for non-admin users
      const { data: currentProfile } = await this.getProfile(userId);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (updates.role && currentProfile?.role !== 'admin' && user?.email !== 'admin@photography.com') {
        delete updates.role;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Sync profile with auth user data
   */
  static async syncProfileWithAuth(userId: string): Promise<{ data: Profile | null; error: any }> {
    try {
      // Call the database function to sync
      const { data, error } = await supabase.rpc('sync_user_profile', {
        user_id: userId
      });

      if (error) {
        return { data: null, error };
      }

      // Return the updated profile
      return await this.getProfile(userId);
    } catch (error) {
      console.error('Error syncing profile with auth:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await this.getProfile(userId);
      return profile?.role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get all profiles (admin only)
   */
  static async getAllProfiles(): Promise<{ data: Profile[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error getting all profiles:', error);
      return { data: null, error };
    }
  }

  /**
   * Check sync status between auth and profiles
   */
  static async checkSyncStatus(): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase.rpc('check_auth_profile_sync');
      return { data, error };
    } catch (error) {
      console.error('Error checking sync status:', error);
      return { data: null, error };
    }
  }

  /**
   * Fix admin profile specifically
   */
  static async fixAdminProfile(): Promise<{ success: boolean; error?: any }> {
    try {
      // Get admin user from auth
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        return { success: false, error: listError };
      }

      const adminUser = users?.find(user => user.email === 'admin@photography.com');
      
      if (!adminUser) {
        return { success: false, error: new Error('Admin user not found in auth') };
      }

      // Create or update admin profile
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: adminUser.id,
          name: 'Admin User',
          email: 'admin@photography.com',
          mobile: adminUser.user_metadata?.mobile || null,
          role: 'admin' as const,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error fixing admin profile:', error);
      return { success: false, error };
    }
  }

  /**
   * Extract user name from email and metadata
   */
  private static extractUserName(email?: string, metadata?: any): string {
    if (email === 'admin@photography.com') {
      return 'Admin User';
    }

    return (
      metadata?.name ||
      metadata?.full_name ||
      email?.split('@')[0] ||
      'User'
    );
  }

  /**
   * Validate profile data
   */
  static validateProfile(profile: Partial<ProfileInsert>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!profile.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.push('Invalid email format');
    }

    if (!profile.name || profile.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (profile.role && !['user', 'admin'].includes(profile.role)) {
      errors.push('Invalid role');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default ProfileService;
