import { supabase } from '@/lib/supabase';

export type Category = {
    id: string;
    user_id: string | null;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
    parent_id: string | null;
    is_system: boolean;
    is_active: boolean;
    sort_order: number;
    created_at: string;
};

export type CategoryPayload = {
    user_id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
    type: string;
    is_active?: boolean;
    sort_order?: number;
};

/**
 * Get all categories for a specific user (includes system categories)
 */
export const getCategories = async (userId: string): Promise<Category[]> => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userId},is_system.eq.true`)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Category[];
};

/**
 * Get a single category by ID
 */
export const getCategoryById = async (id: string): Promise<Category> => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Category;
};

/**
 * Add a new category
 */
export const addCategory = async (payload: CategoryPayload): Promise<Category> => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('categories')
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data as Category;
};

/**
 * Update a category
 */
export const updateCategory = async (id: string, payload: Partial<CategoryPayload>): Promise<Category> => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Category;
};

/**
 * Soft-delete a category (set is_active = false)
 */
export const deleteCategory = async (id: string): Promise<void> => {
    const { error } = await supabase
        .schema('moneyst')
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

    if (error) throw error;
};
