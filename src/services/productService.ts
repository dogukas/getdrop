import { supabase } from '../lib/supabase';
import { Product, ProductRow } from '../types/database';

function toProduct(row: ProductRow): Product {
    return {
        id: row.id,
        name: row.name,
        sku: row.sku,
        stock: row.stock,
        unit: row.unit,
        minStock: row.min_stock,
    };
}

export async function fetchProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
    if (error) throw error;
    return (data ?? []).map(toProduct);
}

export async function adjustStock(sku: string, delta: number): Promise<void> {
    const { data: product, error } = await supabase
        .from('products')
        .select('id, stock')
        .eq('sku', sku)
        .single();
    if (error || !product) throw error ?? new Error('Ürün bulunamadı');

    await supabase
        .from('products')
        .update({ stock: Math.max(0, product.stock + delta) })
        .eq('id', product.id);
}
