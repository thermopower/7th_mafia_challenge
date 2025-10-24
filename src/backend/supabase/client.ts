import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ServiceClientConfig = {
  url: string;
  serviceRoleKey: string;
};

export const createServiceClient = ({
  url,
  serviceRoleKey,
}: ServiceClientConfig): SupabaseClient =>
  createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

// Re-export createClient for backward compatibility
export { createSupabaseClient as createClient };
