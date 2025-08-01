import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  mobile?: string | null;
  role: string;
  avatar?: string | null;
  is_active?: boolean | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, mobile?: string) => Promise<boolean>;
  logout: () => Promise<void>;
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

  // Helper function to fetch profile from database
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        role: data.role,
        avatar: data.avatar,
        is_active: data.is_active
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            console.log('Loading profile for user:', session.user.email);
            const userProfile = await fetchUserProfile(session.user.id);
            if (userProfile) {
              setProfile(userProfile);
              console.log('Profile loaded from database:', userProfile);
            } else {
              console.warn('No profile found, creating fallback profile');
              // Fallback profile if database profile doesn't exist
              const fallbackProfile: UserProfile = {
                id: session.user.id,
                name: session.user.email === 'admin@photography.com' ? 'Michael' : session.user.user_metadata?.name || 'User',
                email: session.user.email || '',
                mobile: session.user.user_metadata?.mobile || null,
                role: session.user.email === 'admin@photography.com' ? 'admin' : 'user',
                avatar: null,
                is_active: true
              };
              setProfile(fallbackProfile);
            }
          } else {
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            console.log('Auth change - Loading profile for user:', session.user.email);
            const userProfile = await fetchUserProfile(session.user.id);
            if (userProfile) {
              setProfile(userProfile);
              console.log('Profile updated from database:', userProfile);
            } else {
              // Fallback profile
              const fallbackProfile: UserProfile = {
                id: session.user.id,
                name: session.user.email === 'admin@photography.com' ? 'Michael' : session.user.user_metadata?.name || 'User',
                email: session.user.email || '',
                mobile: session.user.user_metadata?.mobile || null,
                role: session.user.email === 'admin@photography.com' ? 'admin' : 'user',
                avatar: null,
                is_active: true
              };
              setProfile(fallbackProfile);
            }
          } else {
            setProfile(null);
          }
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);



  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
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
        
        // Specific error handling
        switch (error.message) {
          case 'Invalid login credentials':
            console.error('Invalid email or password');
            break;
          case 'Email not confirmed':
            console.error('Please confirm your email first');
            break;
          default:
            console.error('An unexpected error occurred:', error.message);
        }
        
        return false;
      }

      // Additional validation
      if (!data.user) {
        console.error('No user returned after login');
        return false;
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
      return true;
    } catch (error) {
      console.error('Unexpected login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, mobile?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting registration for:', email);
      
      // Step 1: Register user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            mobile: mobile || null
          }
        }
      });
      
      if (error) {
        console.error('Registration Error Details:', {
          message: error.message,
          status: error.status,
          code: error.code
        });
        
        // Specific error handling
        switch (error.message) {
          case 'User already registered':
            console.error('Email already exists');
            break;
          case 'Password should be at least 6 characters':
            console.error('Password too short');
            break;
          default:
            console.error('Registration failed:', error.message);
        }
        
        return false;
      }

      if (!data.user) {
        console.error('No user returned from registration');
        return false;
      }

      console.log('✅ User registered successfully:', data.user.email);
      
      // Step 2: Create profile in database
      return await handlePostRegistration(data.user, name, mobile);
      
    } catch (error) {
      console.error('Unexpected registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to handle post-registration profile creation
  const handlePostRegistration = async (user: any, name: string, mobile?: string): Promise<boolean> => {
    console.log('Creating profile for user ID:', user.id);
    
    try {
      // Wait a moment for any database triggers to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if profile already exists (created by trigger)
      let profile = await fetchUserProfile(user.id);
      
      if (!profile) {
        console.log('No existing profile found, creating new profile...');
        
        // Create profile data matching your database schema
        const profileData = {
          id: user.id,
          email: user.email!,
          name: name,
          mobile: mobile || null,
          role: user.email === 'admin@photography.com' ? 'admin' : 'user',
          avatar: null,
          is_active: true
        };
        
        console.log('Inserting profile data:', profileData);
        
        const { data: insertData, error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();
        
        if (profileError) {
          console.error('Profile creation failed:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          });
          
          // Don't fail registration if profile creation fails
          // User can still login and profile can be created later
          console.warn('Profile creation failed but registration succeeded');
        } else {
          console.log('✅ Profile created successfully:', insertData);
        }
      } else {
        console.log('✅ Profile already exists:', profile);
      }
      
    } catch (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail registration if profile creation fails
    }
    
    console.log('📧 Registration completed successfully');
    return true;
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('Starting logout process...');
      setIsLoading(true);
      
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
      setIsLoading(false);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      login, 
      register, 
      logout, 
      isLoading, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
