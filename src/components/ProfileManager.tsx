import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Save, X, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import Notification from './Notification';

interface ProfileForm {
  name: string;
  email: string;
  mobile: string;
}

interface ProfileManagerProps {
  onClose?: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ onClose }) => {
  const { profile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileForm>({
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
      mobile: profile?.mobile || ''
    }
  });

  const onSubmit = async (data: ProfileForm) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await db.updateUserProfile(user.id, {
        name: data.name,
        email: data.email,
        mobile: data.mobile || null,
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error updating profile:', error);
        setNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update profile. Please try again.'
        });
      } else {
        setNotification({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully!'
        });
        setIsEditing(false);
        
        // Refresh the page to reload the profile
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    reset({
      name: profile?.name || '',
      email: profile?.email || '',
      mobile: profile?.mobile || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
              type="text"
              disabled={!isEditing}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isEditing 
                  ? 'border-gray-300 bg-white' 
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              disabled={!isEditing}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isEditing 
                  ? 'border-gray-300 bg-white' 
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Mobile Field */}
        <div>
          <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('mobile', {
                pattern: {
                  value: /^[\+]?[1-9][\d]{0,15}$/,
                  message: 'Please enter a valid mobile number'
                }
              })}
              type="tel"
              disabled={!isEditing}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isEditing 
                  ? 'border-gray-300 bg-white' 
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
              placeholder="Enter your mobile number"
            />
          </div>
          {errors.mobile && (
            <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </form>

      {/* Profile Info Display */}
      {!isEditing && (
        <div className="mt-6 pt-6 border-t">
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Account Created:</span>
              <br />
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>
              <br />
              {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Account Type:</span>
              <br />
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                profile?.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {profile?.role === 'admin' ? 'Administrator' : 'Customer'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default ProfileManager;