import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl) // Debug log
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing') // Debug log

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables: URL=${supabaseUrl ? 'Present' : 'Missing'}, Key=${supabaseAnonKey ? 'Present' : 'Missing'}`)
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string, userData?: { name: string; mobile?: string }) => {
    try {
      console.log('Attempting signup with:', { email, userData }) // Debug log
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      console.log('Signup result:', result) // Debug log
      return result
    } catch (error) {
      console.error('Signup error in auth function:', error)
      throw error
    }
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password
    })
  },

  signOut: async () => {
    return await supabase.auth.signOut()
  },

  getSession: async () => {
    return await supabase.auth.getSession()
  },

  getUser: async () => {
    return await supabase.auth.getUser()
  }
}

// Database helper functions
export const db = {

  // Bookings
  getUserBookings: async (userId: string) => {
    return await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  },

  createBooking: async (booking: Database['public']['Tables']['bookings']['Insert']) => {
    return await supabase
      .from('bookings')
      .insert(booking)
      .select()
  },

  getAllBookings: async () => {
    return await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
  },

  updateBooking: async (id: string, updates: Database['public']['Tables']['bookings']['Update']) => {
    return await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
  },

  // Media Posts
  getMediaPosts: async () => {
    return await supabase
      .from('media_posts')
      .select('*')
      .order('created_at', { ascending: false })
  },

  createMediaPost: async (post: Database['public']['Tables']['media_posts']['Insert']) => {
    return await supabase
      .from('media_posts')
      .insert(post)
      .select()
  },

  updateMediaPost: async (id: string, updates: Database['public']['Tables']['media_posts']['Update']) => {
    return await supabase
      .from('media_posts')
      .update(updates)
      .eq('id', id)
  },

  deleteMediaPost: async (id: string) => {
    return await supabase
      .from('media_posts')
      .delete()
      .eq('id', id)
  },

  // Galleries
  getUserGalleries: async (userId: string) => {
    return await supabase
      .from('galleries')
      .select(`
        *,
        bookings!inner(user_id)
      `)
      .eq('bookings.user_id', userId)
  },

  getPublicGalleries: async () => {
    return await supabase
      .from('galleries')
      .select('*')
      .eq('is_public', true)
  },

  createGallery: async (gallery: Database['public']['Tables']['galleries']['Insert']) => {
    return await supabase
      .from('galleries')
      .insert(gallery)
      .select()
  },

  updateGallery: async (id: string, updates: Database['public']['Tables']['galleries']['Update']) => {
    return await supabase
      .from('galleries')
      .update(updates)
      .eq('id', id)
  },

  // Contact Messages
  createContactMessage: async (message: Database['public']['Tables']['contact_messages']['Insert']) => {
    return await supabase
      .from('contact_messages')
      .insert(message)
      .select()
  },

  getContactMessages: async () => {
    return await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
  },

  updateContactMessageStatus: async (id: string, status: 'unread' | 'read' | 'replied') => {
    return await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id)
  },

  // Profiles
  getUserProfile: async (userId: string) => {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
  },

  createUserProfile: async (profile: Database['public']['Tables']['profiles']['Insert']) => {
    return await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()
  },

  updateUserProfile: async (userId: string, updates: Database['public']['Tables']['profiles']['Update']) => {
    return await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
  }
}