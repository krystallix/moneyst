import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for budgets
// ==========================================

/**
 * Get all records from budgets
 */
export const getBudgets = async () => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budgets')
        .select('*');
        
    if (error) throw error;
    return data;
};

/**
 * Get a single record from budgets by ID
 */
export const getBudgetById = async (id: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budgets')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Add a new record to budgets
 */
export const addBudget = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budgets')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in budgets
 */
export const updateBudget = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budgets')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from budgets
 */
export const deleteBudget = async (id: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('budgets')
        .delete()
        .eq('id', id);
        
    if (error) throw error;
    return true;
};
