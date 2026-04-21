import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for recurring_transactions
// ==========================================

/**
 * Get all records from recurring_transactions
 */
export const getRecurringTransactions = async () => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('recurring_transactions')
        .select('*');
        
    if (error) throw error;
    return data;
};

/**
 * Get a single record from recurring_transactions by ID
 */
export const getRecurringTransactionById = async (id: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('recurring_transactions')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Add a new record to recurring_transactions
 */
export const addRecurringTransaction = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('recurring_transactions')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in recurring_transactions
 */
export const updateRecurringTransaction = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('recurring_transactions')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from recurring_transactions
 */
export const deleteRecurringTransaction = async (id: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('recurring_transactions')
        .delete()
        .eq('id', id);
        
    if (error) throw error;
    return true;
};
