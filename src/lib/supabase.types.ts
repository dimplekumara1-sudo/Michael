import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Extend the SupabaseClient interface with custom RPC functions
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc<FnName extends 'sync_user_profile' | 'check_auth_profile_sync'>(
      fn: FnName,
      params?: FnName extends 'sync_user_profile' ? { user_id: string } : undefined,
      options?: {}
    ): Promise<{ data: any; error: any }>;
  }
}

// Create a custom Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
