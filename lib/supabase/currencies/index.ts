import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for currencies
// ==========================================

/**
 * Get all records from currencies
 */
export const getCurrencies = async () => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('currencies')
        .select('*');
        
    if (error) throw error;
    return data;
};

/**
 * Get a single record from currencies by ID
 */
export const getCurrencieById = async (code: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('currencies')
        .select('*')
        .eq('code', code)
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Add a new record to currencies
 */
export const addCurrencie = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('currencies')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in currencies
 */
export const updateCurrencie = async (code: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('currencies')
        .update(payload)
        .eq('code', code)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from currencies
 */
export const deleteCurrencie = async (code: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('currencies')
        .delete()
        .eq('code', code);
        
    if (error) throw error;
    return true;
};
