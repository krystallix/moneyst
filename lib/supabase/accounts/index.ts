import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for accounts
// ==========================================

/**
 * Get all accounts for a specific user
 */
export const getAccounts = async (userId?: string) => {
    let query = supabase
        .schema('moneyst')
        .from('accounts')
        .select('*')
        .eq('is_active', true);

    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

/**
 * Get total net worth (sum of current_balance) for a user
 */
export const getNetWorth = async (userId: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('accounts')
        .select('current_balance, include_in_net_worth, currency')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('include_in_net_worth', true);

    if (error) throw error;

    const total = (data ?? []).reduce((sum, a) => sum + Number(a.current_balance), 0);
    return total;
};

/**
 * Get a single record from accounts by ID
 */
export const getAccountById = async (id: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Add a new record to accounts
 */
export const addAccount = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('accounts')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in accounts
 */
export const updateAccount = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('accounts')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from accounts
 */
export const deleteAccount = async (id: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('accounts')
        .delete()
        .eq('id', id);
        
    if (error) throw error;
    return true;
};
