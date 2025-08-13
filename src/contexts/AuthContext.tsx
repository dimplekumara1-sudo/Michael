import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

// Type definitions
export type UserProfile = Database['public']['Tables']['profiles']['Row'] & {
  is_active?: boolean; // Optional field for backward compatibility
};


export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, name: string, mobile?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  createProfileManually: () => Promise<boolean>;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Optimized loading state setter to prevent unnecessary re-renders
  const setLoadingWithLog = useCallback((loading: boolean) => {
    console.log(`🔄 Loading state changing to: ${loading}`);
    setIsLoading(loading);
  }, []);

  // Simplified profile loading with retry logic
  const loadUserProfile = async (userId: string, attempt = 1): Promise<UserProfile | null> => {
    try {
      console.log(`🔍 Loading profile for userId: ${userId} (attempt ${attempt}/3)`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        if (attempt < 3) {
          console.log(`Profile fetch failed, retrying in 1 second... (attempt ${attempt}/3)`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
          return loadUserProfile(userId, attempt + 1);
        } else {
          console.warn('Profile fetch failed after 3 attempts');
          return null;
        }
      }

      console.log('✅ Profile loaded successfully:', data);
      const profileData: UserProfile = {
        id: data.id,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        role: data.role,
        avatar: data.avatar,
        is_active: true, // Default to true since column doesn't exist in actual schema
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      setProfile(profileData);
      return profileData;
    } catch (e) {
      console.error('Unexpected error fetching profile', e);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadUserProfile(userId, attempt + 1);
      }
      return null;
    }
  };

  // Create profile function
  const createProfile = async (user: any): Promise<UserProfile | null> => {
    try {
      console.log('🔨 Creating profile for user:', user.email);
      
      const profileData = {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        mobile: user.user_metadata?.mobile || null,
        role: user.email === 'admin@photography.com' ? 'admin' : 'user',
        avatar: null
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Failed to create profile:', error);
        return null;
      }

      console.log('✅ Profile created successfully:', data);
      const newProfile: UserProfile = {
        id: data.id,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        role: data.role,
        avatar: data.avatar,
        is_active: true, // Default to true since column doesn't exist in actual schema
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      setProfile(newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  };

  // Initialize auth and handle session changes
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        setLoadingWithLog(true);
        console.log('🔄 Initializing authentication...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoadingWithLog(false);
          }
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          
          if (session?.user?.id) {
            console.log('✅ Session found for user:', session.user.email);
            
            // Set loading to false immediately after setting user
            // Profile loading will happen in background
            setLoadingWithLog(false);
            
            // Load profile in background without blocking UI
            loadUserProfile(session.user.id).then(profileData => {
              if (mounted && profileData) {
                setProfile(profileData);
                console.log('✅ Profile loaded in background');
              } else if (mounted) {
                // Create fallback profile if no profile found
                const fallbackProfile: UserProfile = {
                  id: session.user.id,
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                  email: session.user.email || '',
                  mobile: session.user.user_metadata?.mobile || null,
                  role: session.user.email === 'admin@photography.com' ? 'admin' : 'user',
                  avatar: null,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                setProfile(fallbackProfile);
                console.log('✅ Fallback profile set');
              }
            }).catch(error => {
              console.error('❌ Background profile loading failed:', error);
              if (mounted) {
                // Create fallback profile on error
                const fallbackProfile: UserProfile = {
                  id: session.user.id,
                  name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                  email: session.user.email || '',
                  mobile: session.user.user_metadata?.mobile || null,
                  role: session.user.email === 'admin@photography.com' ? 'admin' : 'user',
                  avatar: null,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                setProfile(fallbackProfile);
                console.log('✅ Fallback profile set after error');
              }
            });
          } else {
            console.log('❌ No active session found');
            setProfile(null);
            setLoadingWithLog(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoadingWithLog(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Handle auth state changes (but not initial load)
  useEffect(() => {
    let isInitialLoad = true;
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      // Skip the initial INITIAL_SESSION event to avoid conflicts
      if (event === 'INITIAL_SESSION' && isInitialLoad) {
        console.log('⏭️ Skipping initial session event (handled by initialization)');
        isInitialLoad = false;
        return;
      }
      
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        console.log('User signed in, setting loading to false immediately');
        setLoadingWithLog(false);
        
        // Load profile in background without blocking UI
        loadUserProfile(session.user.id).then(profileData => {
          if (profileData) {
            setProfile(profileData);
            console.log('✅ Profile loaded after sign in');
          } else {
            // Create fallback profile
            const fallbackProfile: UserProfile = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              mobile: session.user.user_metadata?.mobile || null,
              role: session.user.email === 'admin@photography.com' ? 'admin' : 'user',
              avatar: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setProfile(fallbackProfile);
            console.log('✅ Fallback profile set after sign in');
          }
        }).catch(error => {
          console.error('Error fetching profile after sign in:', error);
          // Create fallback profile on error
          const fallbackProfile: UserProfile = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            mobile: session.user.user_metadata?.mobile || null,
            role: session.user.email === 'admin@photography.com' ? 'admin' : 'user',
            avatar: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProfile(fallbackProfile);
          console.log('✅ Fallback profile set after sign in error');
        });
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing profile...');
        setProfile(null);
        setLoadingWithLog(false);
      }
      // Remove the else clause that was setting loading to false for other events
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Removed the additional useEffect that was causing loading state conflicts



  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      setLoadingWithLog(true);
      console.log('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login Error Details:', {
          message: error.message,
          status: error.status,
          code: error.code
        });
        
        // Specific error handling with user-friendly messages
        switch (error.message) {
          case 'Invalid login credentials':
            console.error('Invalid email or password');
            return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' };
          case 'Email not confirmed':
            console.error('Please confirm your email first');
            return { success: false, error: 'Please verify your email address. Check your inbox for a verification email.' };
          default:
            console.error('An unexpected error occurred:', error.message);
            return { success: false, error: 'An unexpected error occurred. Please try again.' };
        }
      }

      // Additional validation
      if (!data.user) {
        console.error('No user returned after login');
        return { success: false, error: 'Authentication failed. Please try again.' };
      }

      console.log('✅ Authentication successful for:', data.user.email);
      
      // Test database access after login
      try {
        const { data: testData, error: testError } = await supabase
          .from('bookings')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.warn('Database access test failed:', testError.message);
          console.warn('User authenticated but database access may be limited');
        } else {
          console.log('✅ Database access confirmed');
        }
      } catch (dbError) {
        console.warn('Database test error:', dbError);
      }
      
      // Profile will be automatically set by the auth state change listener
      // Don't set loading to false here - let the auth state change handler manage it
      return { success: true };
    } catch (error) {
      console.error('Unexpected login error:', error);
      setLoadingWithLog(false);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const register = async (email: string, password: string, name: string, mobile?: string): Promise<boolean> => {
    try {
      setLoadingWithLog(true);
      console.log('🔐 Starting registration for:', email);
      
      // Direct registration with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
            mobile
          }
        }
      });
      
      if (error) {
        console.error('Registration error:', error);
        setLoadingWithLog(false);
        return false;
      }
      
      if (!data.user) {
        console.error('No user returned from registration');
        setLoadingWithLog(false);
        return false;
      }
      
      console.log('✅ Auth user created:', data.user.email);
      
      // Try to create profile
      const profileSuccess = await handlePostRegistration(data.user, name);
      
      if (!profileSuccess) {
        // Create fallback profile for UI
        const fallbackProfile: UserProfile = {
          id: data.user.id,
          name: name || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || email,
          mobile: mobile || null,
          role: email === 'admin@photography.com' ? 'admin' : 'user',
          avatar: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(fallbackProfile);
        console.log('Using fallback profile for UI:', fallbackProfile);
      }
      
      // Set user in context (auth state change will handle the rest)
      setUser(data.user);
      setLoadingWithLog(false);
      return true;
      
    } catch (error) {
      console.error('Unexpected registration error:', error);
      setLoadingWithLog(false);
      return false;
    }
  };

  // Removed complex fetchUserProfile function - using simpler loadUserProfile instead
  // Helper function to handle post-registration profile creation
  const handlePostRegistration = async (user: any, name: string): Promise<boolean> => {
    console.log('Creating profile for user ID:', user.id);
    
    try {
      // Check if profile already exists using our loadUserProfile function
      const existingProfile = await loadUserProfile(user.id);
      if (existingProfile) {
        console.log('✅ Profile already exists:', existingProfile);
        setProfile(existingProfile);
        return true;
      }
      
      // Create profile manually
      const profileData = {
        id: user.id,
        email: user.email!,
        name: name || 'User',
        role: user.email === 'admin@photography.com' ? 'admin' : 'user',
        mobile: user.user_metadata?.mobile || null,
        avatar: null
      };
      
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (profileError) {
        console.error('Profile creation failed:', profileError);
        return false;
      }
      
      console.log('✅ Profile created successfully:', newProfile);
      setProfile(newProfile);
      return true;
      
    } catch (profileError) {
      console.error('Profile creation error:', profileError);
      return false;
    }
  };

  // Manual profile creation function for emergency cases
  const createProfileManually = async (): Promise<boolean> => {
    try {
      if (!user) {
        console.error('No user available for manual profile creation');
        return false;
      }

      console.log('🚨 Manually creating profile for user:', user.email);

      // Call the database function to create missing profile
      const { data, error } = await supabase.rpc('create_missing_profile', {
        user_id: user.id,
        user_email: user.email!,
        user_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
      });

      if (error) {
        console.error('Manual profile creation failed:', error);
        return false;
      }

      if (data) {
        const newProfile: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          role: data.role,
          avatar: data.avatar,
          is_active: true, // Default to true since column doesn't exist in actual schema
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        setProfile(newProfile);
        console.log('✅ Manual profile creation successful:', newProfile);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Manual profile creation error:', error);
      return false;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      if (!user || !profile) {
        console.error('No user or profile to update');
        return false;
      }

      console.log('🔄 Updating profile with:', updates);

      // Update the profile in the database
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Profile update failed:', error);
        return false;
      }

      if (data) {
        // Update the local profile state
        const updatedProfile: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          role: data.role,
          avatar: data.avatar,
          is_active: true, // Default to true since column doesn't exist in actual schema
          created_at: data.created_at,
          updated_at: data.updated_at
        };

        setProfile(updatedProfile);
        console.log('✅ Profile updated successfully:', updatedProfile);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('Starting logout process...');
      setLoadingWithLog(true);
      
      // Clear auth state first
      setUser(null);
      setProfile(null);
      
      // Clear any local storage
      localStorage.removeItem('eventsnap_user');
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout error:', error);
        // Don't throw - we still want to clear local state
      }
      
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setProfile(null);
      localStorage.clear();
      sessionStorage.clear();
    } finally {
      setLoadingWithLog(false);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      login, 
      register, 
      updateProfile,
      createProfileManually,
      logout, 
      isLoading, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
