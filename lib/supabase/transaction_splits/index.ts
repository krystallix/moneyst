import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for transaction_splits
// ==========================================

/**
 * Get all records from transaction_splits
 */
export const getTransactionSplits = async () => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transaction_splits')
        .select('*');
        
    if (error) throw error;
    return data;
};

/**
 * Get a single record from transaction_splits by ID
 */
export const getTransactionSplitById = async (id: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transaction_splits')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Add a new record to transaction_splits
 */
export const addTransactionSplit = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transaction_splits')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in transaction_splits
 */
export const updateTransactionSplit = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transaction_splits')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from transaction_splits
 */
export const deleteTransactionSplit = async (id: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('transaction_splits')
        .delete()
        .eq('id', id);
        
    if (error) throw error;
    return true;
};
