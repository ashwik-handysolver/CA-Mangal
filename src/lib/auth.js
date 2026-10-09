import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// The signed-in Supabase session: undefined while it is being read from storage,
// null when signed out. Follows sign in / sign out / token refresh / expiry.
export function useSession() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    // Fires INITIAL_SESSION right away, then on every auth change
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return session;
}
