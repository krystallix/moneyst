import { supabase } from '@/lib/supabase';

// ==========================================
// CRUD Operations for users
// ==========================================

/**
 * Get all records from users
 */
export const getUsers = async () => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('users')
        .select('*');
        
    if (error) throw error;
    return data;
};

/**
 * Get a single record from users by ID
 */
export const getUserById = async (id: string) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Add a new record to users
 */
export const addUser = async (payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('users')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Update a record in users
 */
export const updateUser = async (id: string, payload: any) => {
    const { data, error } = await supabase
        .schema('moneyst')
        .from('users')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) throw error;
    return data;
};

/**
 * Delete a record from users
 */
export const deleteUser = async (id: string) => {
    const { error } = await supabase
        .schema('moneyst')
        .from('users')
        .delete()
        .eq('id', id);
        
    if (error) throw error;
    return true;
};
