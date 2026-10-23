import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

/**
 * Server-only database client. It uses the service-role key, so it must
 * never be imported from a 'use client' component. The 'server-only'
 * import above makes the build fail if that ever happens.
 *
 * Every table has Row Level Security on with no public policies, so the
 * browser cannot read or write the database directly. Privacy (R2.19)
 * and ownership (R2.30) are enforced in the code that calls this client.
 */
let client: SupabaseClient | null = null;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('Database is not configured (SUPABASE_SERVICE_ROLE_KEY / SUPABASE_URL missing).');
  }
}

export function db(): SupabaseClient {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new DatabaseNotConfiguredError();
  }
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
