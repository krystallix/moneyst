import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for merchants
// ==========================================

/**
 * Get all records from merchants
 */
export const getMerchants = async () => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('merchants')
        .select('*');
        
    if (error) throw error;
    return data;
};

/**
 * Get a single record from merchants by ID
 */
export const getMerchantById = async (id: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('merchants')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Add a new record to merchants
 */
export const addMerchant = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('merchants')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in merchants
 */
export const updateMerchant = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('merchants')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from merchants
 */
export const deleteMerchant = async (id: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('merchants')
        .delete()
        .eq('id', id);
        
    if (error) throw error;
    return true;
};
