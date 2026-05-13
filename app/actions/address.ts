'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { OrchestrationResponse } from '@/lib/orchestration/types';

export interface AddressData {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  is_primary: boolean;
}

export async function getAddressesAction(): Promise<OrchestrationResponse<AddressData[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const admin = createAdminClient();
    const { data } = await admin
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    return { success: true, data: data ?? [] };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'FETCH_ERROR' };
  }
}

export async function createAddressAction(
  address: Omit<AddressData, 'id' | 'is_primary'>
): Promise<OrchestrationResponse<AddressData>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const admin = createAdminClient();

    // If this is the first address, make it primary
    const { count } = await admin
      .from('user_addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    const isPrimary = count === 0;

    const { data, error } = await admin
      .from('user_addresses')
      .insert({ ...address, user_id: user.id, is_primary: isPrimary })
      .select('*')
      .single();

    if (error) return { success: false, error: error.message, code: 'INSERT_ERROR' };
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'CREATE_ERROR' };
  }
}

export async function updateAddressAction(
  id: string,
  address: Partial<Omit<AddressData, 'id'>>
): Promise<OrchestrationResponse<AddressData>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('user_addresses')
      .update(address)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) return { success: false, error: error.message, code: 'UPDATE_ERROR' };
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'UPDATE_ERROR' };
  }
}

export async function deleteAddressAction(id: string): Promise<OrchestrationResponse<null>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const admin = createAdminClient();
    const { error } = await admin
      .from('user_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { success: false, error: error.message, code: 'DELETE_ERROR' };
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'DELETE_ERROR' };
  }
}

export async function setPrimaryAddressAction(id: string): Promise<OrchestrationResponse<null>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated.', code: 'UNAUTHORIZED' };

    const admin = createAdminClient();
    // Unset all primary flags for user, then set the chosen one
    await admin
      .from('user_addresses')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .eq('is_primary', true);

    const { error } = await admin
      .from('user_addresses')
      .update({ is_primary: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return { success: false, error: error.message, code: 'PRIMARY_ERROR' };
    return { success: true, data: null };
  } catch (e: any) {
    return { success: false, error: e.message, code: 'PRIMARY_ERROR' };
  }
}
