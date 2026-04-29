import { supabase } from '@/lib/supabase';

export type Budget = {
    id: string;
    user_id: string;
    name: string;
    period: 'monthly' | 'weekly' | 'yearly' | 'lifetime';
    start_date: string;
    end_date: string | null;
    total_limit: number;
    currency: string;
    rollover: boolean;
    alert_threshold: number;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type BudgetCategory = {
    id: string;
    budget_id: string;
    category_id: string;
    limit_amount: number;
    spent_amount: number;
    categories?: {
        id: string;
        name: string;
        icon: string | null;
        color: string | null;
    };
};

export const getActiveBudgets = async (userId: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budgets')
        .select(`
            *,
            budget_categories (
                *,
                categories (
                    id, name, icon, color
                )
            )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const createBudget = async (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budgets')
        .insert([budget])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const addBudgetCategories = async (categories: Omit<BudgetCategory, 'id' | 'spent_amount' | 'categories'>[]) => {
    if (!categories.length) return [];
    
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budget_categories')
        .insert(categories)
        .select();

    if (error) throw error;
    return data;
};

export const getBudgetById = async (budgetId: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('budgets')
        .select(`
            *,
            budget_categories (
                *,
                categories (
                    id, name, icon, color
                )
            )
        `)
        .eq('id', budgetId)
        .single();

    if (error) throw error;
    return data;
};

export const updateBudget = async (
    budgetId: string, 
    budget: Partial<Omit<Budget, 'id' | 'created_at' | 'updated_at'>>,
    categories: Omit<BudgetCategory, 'id' | 'spent_amount' | 'categories'>[]
) => {
    // 1. Update main budget record
    const { data, error: budgetError } = await supabase
        .schema('moneyst')
        .from('budgets')
        .update(budget)
        .eq('id', budgetId)
        .select()
        .single();

    if (budgetError) throw budgetError;

    // 2. Delete existing categories
    const { error: deleteError } = await supabase
        .schema('moneyst')
        .from('budget_categories')
        .delete()
        .eq('budget_id', budgetId);

    if (deleteError) throw deleteError;

    // 3. Insert new categories
    if (categories.length > 0) {
        const { error: insertError } = await supabase
            .schema('moneyst')
            .from('budget_categories')
            .insert(categories);

        if (insertError) throw insertError;
    }

    return data;
};

export const deleteBudget = async (budgetId: string) => {
    // Also delete budget_categories first due to foreign key
    const { error: catError } = await supabase
        .schema('moneyst')
        .from('budget_categories')
        .delete()
        .eq('budget_id', budgetId);
        
    if (catError) throw catError;

    const { error } = await supabase
        .schema('moneyst')
        .from('budgets')
        .delete()
        .eq('id', budgetId);

    if (error) throw error;
    return true;
};

