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
            ),
            accounts:account_id (
                id,
                name
            ),
            splits:transaction_splits (
                id,
                amount,
                description,
                categories:category_id (
                    id,
                    name,
                    icon,
                    color
                )
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
            ),
            accounts:account_id (
                id,
                name
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
export const getMonthlyStats = async (userId: string, customStartDate?: string, customEndDate?: string) => {
    const now = new Date();
    const firstDay = customStartDate ?? new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const lastDay = customEndDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0)
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
 * Get breakdown of spending and income by category for a given date range
 */
export const getCategoryBreakdown = async (userId: string, startDate?: string, endDate?: string) => {
    const now = new Date();
    const firstDay = startDate ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
        .schema('moneyst')
        .from('transactions')
        .select(`
            amount,
            type,
            categories:category_id (
                id,
                name,
                color,
                icon
            )
        `)
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .gte('date', firstDay)
        .lte('date', lastDay);

    if (error) throw error;

    const breakdown: Record<string, { total: number, name: string, color: string, icon: string, type: string }> = {};

    for (const tx of data ?? []) {
        if (tx.type === 'transfer' || !tx.categories) continue;
        const cat = tx.categories as any;
        const catId = cat.id;
        
        if (!breakdown[catId]) {
            breakdown[catId] = {
                total: 0,
                name: cat.name,
                color: cat.color || '#ccc',
                icon: cat.icon || 'HelpCircle',
                type: tx.type
            };
        }
        breakdown[catId].total += Number(tx.amount);
    }

    return Object.values(breakdown).sort((a, b) => b.total - a.total);
};

/**
 * Get income and expense trends over the last 6 months
 */
export const getTrendLine = async (userId: string) => {
    const now = new Date();
    const trends = [];
    
    // Generate the last 6 months ranges
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const monthLabel = d.toLocaleString('default', { month: 'short' });

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
        
        trends.push({ label: monthLabel, income, expenses });
    }
    
    return trends;
};

/**
 * Get recurring spending insights based on description patterns
 */
export const getRecurringInsights = async (userId: string, startDate?: string, endDate?: string) => {
    const now = new Date();
    // Use a slightly larger window if possible to catch patterns better, but respect provided dates
    const firstDay = startDate ?? new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
    const lastDay = endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
        .schema('moneyst')
        .from('transactions')
        .select(`
            description, 
            amount, 
            date,
            categories:category_id (
                id,
                name,
                icon,
                color
            )
        `)
        .eq('user_id', userId)
        .eq('type', 'expense')
        .eq('is_deleted', false)
        .gte('date', firstDay)
        .lte('date', lastDay)
        .order('date', { ascending: true });

    if (error) throw error;

    const grouped: Record<string, { dates: Date[], total: number, count: number, category: any }> = {};

    for (const tx of data ?? []) {
        const desc = (tx.description || '').trim().toLowerCase();
        if (!desc || desc.length < 3) continue; // Skip empty or very short descriptions
        
        if (!grouped[desc]) {
            grouped[desc] = { dates: [], total: 0, count: 0, category: tx.categories };
        }
        grouped[desc].dates.push(new Date(tx.date));
        grouped[desc].total += Number(tx.amount);
        grouped[desc].count += 1;
    }

    const insights = [];

    for (const [name, stats] of Object.entries(grouped)) {
        if (stats.count >= 2) {
            // Hitung hari dari pembelian pertama hingga hari ini
            const firstDate = stats.dates[0];
            const diffTime = Math.abs(now.getTime() - firstDate.getTime());
            const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Rata-rata interval
            const avgIntervalDays = Math.max(1, Math.round(totalDays / stats.count));
            
            insights.push({
                name,
                count: stats.count,
                totalAmount: stats.total,
                avgIntervalDays,
                totalDays,
                category: stats.category
            });
        }
    }

    // Sort by count (most frequent first) and take top 5
    return insights.sort((a, b) => b.count - a.count).slice(0, 5);
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
 * Hard-delete a transaction and its associated receipt image from Storage.
 * Fetches receipt_url first, removes the Storage object, then deletes the row.
 */
export const deleteTransaction = async (id: string) => {
    // 1. Fetch receipt_url so we can clean up Storage
    const { data: tx } = await supabase
        .schema('moneyst')
        .from('transactions')
        .select('receipt_url')
        .eq('id', id)
        .maybeSingle();

    // 2. Delete receipt image from Storage if present
    if (tx?.receipt_url) {
        try {
            // URL format: .../storage/v1/object/public/moneyst/<path>
            const marker = '/moneyst/';
            const idx = tx.receipt_url.indexOf(marker);
            if (idx !== -1) {
                const storagePath = tx.receipt_url.slice(idx + marker.length);
                await supabase.storage.from('moneyst').remove([storagePath]);
            }
        } catch (imgErr) {
            console.warn('[deleteTransaction] Could not remove receipt image:', imgErr);
        }
    }

    // 3. Hard-delete the row (cascade will remove splits via FK)
    const { error } = await supabase
        .schema('moneyst')
        .from('transactions')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};
