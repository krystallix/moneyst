import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for exchange_rates
// ==========================================

/**
 * Get all records from exchange_rates
 */
export const getExchangeRates = async () => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('exchange_rates')
        .select('*');
        
    if (error) throw error;
    return data;
};

/**
 * Get a single record from exchange_rates by ID
 */
export const getExchangeRateById = async (id: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('exchange_rates')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Add a new record to exchange_rates
 */
export const addExchangeRate = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('exchange_rates')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in exchange_rates
 */
export const updateExchangeRate = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('exchange_rates')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from exchange_rates
 */
export const deleteExchangeRate = async (id: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('exchange_rates')
        .delete()
        .eq('id', id);
        
    if (error) throw error;
    return true;
};
