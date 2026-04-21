import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for transaction_tags
// ==========================================

/**
 * Get all records from transaction_tags
 */
export const getTransactionTags = async () => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transaction_tags')
        .select('*');
        
    if (error) throw error;
    return data;
};

/**
 * Get a single record from transaction_tags by ID
 */
export const getTransactionTagById = async (transactionId: string, tagId: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transaction_tags')
        .select('*')
        .match({ transaction_id: transactionId, tag_id: tagId })
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Add a new record to transaction_tags
 */
export const addTransactionTag = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transaction_tags')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in transaction_tags
 */
export const updateTransactionTag = async (transactionId: string, tagId: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transaction_tags')
        .update(payload)
        .match({ transaction_id: transactionId, tag_id: tagId })
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from transaction_tags
 */
export const deleteTransactionTag = async (transactionId: string, tagId: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('transaction_tags')
        .delete()
        .match({ transaction_id: transactionId, tag_id: tagId });
        
    if (error) throw error;
    return true;
};
