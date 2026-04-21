import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for transactions
// ==========================================

/**
 * Get all records from transactions
 */
export const getTransactions = async () => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transactions')
        .select('*');
        
    if (error) throw error;
    return data;
};

/**
 * Get a single record from transactions by ID
 */
export const getTransactionById = async (id: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Get recent transactions for a user, joined with category name & icon.
 * Returns the last `limit` transactions ordered by date desc.
 */
export const getRecentTransactions = async (userId: string, limit = 10) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transactions')
        .select(`
            id,
            type,
            amount,
            currency,
            description,
            date,
            time,
            is_transfer,
            categories:category_id (
                id,
                name,
                icon,
                color,
                type
            )
        `)
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
        
    if (error) throw error;
    return data;
};

/**
 * Get transactions for a user for a specific date string (YYYY-MM-DD)
 */
export const getTransactionsByDate = async (userId: string, targetDate: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transactions')
        .select(`
            id,
            type,
            amount,
            currency,
            description,
            date,
            time,
            is_transfer,
            categories:category_id (
                id,
                name,
                icon,
                color,
                type
            )
        `)
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .eq('date', targetDate)
        .order('created_at', { ascending: false });
        
    if (error) throw error;
    return data;
};

/**
 * Get monthly income and expenses for the current calendar month.
 */
export const getMonthlyStats = async (userId: string) => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

    const { data, error } = await supabase
        .schema('moneyst')
        .from('transactions')
        .select('type, amount')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .gte('date', firstDay)
        .lte('date', lastDay);

    if (error) throw error;

    let income = 0;
    let expenses = 0;
    for (const tx of data ?? []) {
        if (tx.type === 'income') income += Number(tx.amount);
        else if (tx.type === 'expense') expenses += Number(tx.amount);
    }

    return { income, expenses };
};

/**
 * Add a new record to transactions
 */
export const addTransaction = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transactions')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in transactions
 */
export const updateTransaction = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('transactions')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from transactions (soft delete)
 */
export const deleteTransaction = async (id: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('transactions')
        .update({ is_deleted: true })
        .eq('id', id);
        
    if (error) throw error;
    return true;
};
