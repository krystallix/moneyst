import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for tags
// ==========================================

/**
 * Get all records from tags
 */
export const getTags = async () => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('tags')
        .select('*');
        
    if (error) throw error;
    return data;
};

/**
 * Get a single record from tags by ID
 */
export const getTagById = async (id: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('tags')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Add a new record to tags
 */
export const addTag = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('tags')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in tags
 */
export const updateTag = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('tags')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from tags
 */
export const deleteTag = async (id: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('tags')
        .delete()
        .eq('id', id);
        
    if (error) throw error;
    return true;
};
