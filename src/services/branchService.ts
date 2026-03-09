import { supabase } from '../lib/supabase';
import { Branch, BranchRow } from '../types/database';

function toBranch(row: BranchRow): Branch {
    return { id: row.id, name: row.name };
}

export async function fetchBranches(): Promise<Branch[]> {
    const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');
    if (error) throw error;
    return (data ?? []).map(toBranch);
}
