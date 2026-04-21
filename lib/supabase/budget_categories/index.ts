import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for budget_categories
// ==========================================

/**
 * Get all records from budget_categories
 */
export const getBudgetCategories = async () => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budget_categories')
        .select('*');
        
    if (error) throw error;
    return data;
};

/**
 * Get a single record from budget_categories by ID
 */
export const getBudgetCategorieById = async (id: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budget_categories')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Add a new record to budget_categories
 */
export const addBudgetCategorie = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budget_categories')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in budget_categories
 */
export const updateBudgetCategorie = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budget_categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from budget_categories
 */
export const deleteBudgetCategorie = async (id: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('budget_categories')
        .delete()
        .eq('id', id);
        
    if (error) throw error;
    return true;
};
