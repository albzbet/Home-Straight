import { useEffect, useState } from 'react';
import { useStore } from './store';
import { supabase } from './supabase';

// What someone has access to beyond the free week: free access from an approved hardship request (purchases come in step 9).

export type HardshipStatus = 'pending' | 'approved' | 'declined';
export type Access = { freeAccess: boolean; hardship: { status: HardshipStatus; requestedAt: string } | null };

const none: Access = { freeAccess: false, hardship: null };

async function fetchAccess(): Promise<Access> {
  const { data } = await supabase!.rpc('hs_my_access');
  return (data as Access) ?? none;
}

export function useAccess() {
  const { signedIn } = useStore();
  const [access, setAccess] = useState<Access | null>(null);

  useEffect(() => {
    if (!signedIn || !supabase) return;
    let live = true;
    fetchAccess().then((a) => live && setAccess(a));
    return () => {
      live = false;
    };
  }, [signedIn]);

  const requestHardship = async (note: string) => {
    if (!supabase) throw new Error('no database');
    const { error } = await supabase.rpc('hs_request_hardship', { p: { note } });
    if (error) throw new Error(error.message);
    setAccess(await fetchAccess());
  };

  return { access: signedIn ? access : none, requestHardship };
}

// Admin side.
export type HardshipRequest = { id: number; nickname: string; note: string; status: HardshipStatus; requestedAt: string };

export async function fetchHardshipRequests(): Promise<HardshipRequest[]> {
  if (!supabase) throw new Error('no database');
  const { data, error } = await supabase.rpc('hs_admin_hardship');
  if (error) throw new Error(error.message);
  return data as HardshipRequest[];
}

export async function decideHardship(id: number, approve: boolean) {
  if (!supabase) throw new Error('no database');
  const { error } = await supabase.rpc('hs_admin_decide_hardship', { request_id: id, approve });
  if (error) throw new Error(error.message);
}
