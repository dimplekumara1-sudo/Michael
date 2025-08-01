import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProfileService from '../services/profileService';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: ProfileUpdate) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  syncWithAuth: () => Promise<boolean>;
}

export const useProfile = (): UseProfileReturn => {
  const { user, profile: contextProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(contextProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with context profile
  useEffect(() => {
    setProfile(contextProfile);
  }, [contextProfile]);

  const refreshProfile = async (): Promise<void> => {
    if (!user) {
      setError('No authenticated user');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: profileError } = await ProfileService.getProfile(user.id);
      
      if (profileError) {
        setError(profileError.message || 'Failed to load profile');
      } else {
        setProfile(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: ProfileUpdate): Promise<boolean> => {
    if (!user) {
      setError('No authenticated user');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await ProfileService.updateProfile(user.id, updates);
      
      if (updateError) {
        setError(updateError.message || 'Failed to update profile');
        return false;
      } else {
        setProfile(data);
        return true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const syncWithAuth = async (): Promise<boolean> => {
    if (!user) {
      setError('No authenticated user');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: syncError } = await ProfileService.syncProfileWithAuth(user.id);
      
      if (syncError) {
        setError(syncError.message || 'Failed to sync profile');
        return false;
      } else {
        setProfile(data);
        return true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
    syncWithAuth
  };
};

export default useProfile;