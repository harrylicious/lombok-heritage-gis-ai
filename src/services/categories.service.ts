import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type HeritageCategory = Database['public']['Tables']['heritage_categories']['Row'];
type HeritageCategoryInsert = Database['public']['Tables']['heritage_categories']['Insert'];
type HeritageCategoryUpdate = Database['public']['Tables']['heritage_categories']['Update'];

export class CategoriesService {
  /**
   * Fetch all heritage categories
   */
  static async fetchAllCategories(): Promise<HeritageCategory[]> {
    const { data, error } = await supabase
      .from('heritage_categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Fetch a single category by ID
   */
  static async fetchCategoryById(categoryId: string): Promise<HeritageCategory | null> {
    const { data, error } = await supabase
      .from('heritage_categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  }

  /**
   * Create a new heritage category
   */
  static async createCategory(categoryData: HeritageCategoryInsert): Promise<HeritageCategory> {
    const { data, error } = await supabase
      .from('heritage_categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing heritage category
   */
  static async updateCategory(categoryId: string, updates: HeritageCategoryUpdate): Promise<HeritageCategory> {
    const { data, error } = await supabase
      .from('heritage_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a heritage category
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('heritage_categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
  }

  /**
   * Search categories by name or description
   */
  static async searchCategories(query: string): Promise<HeritageCategory[]> {
    const { data, error } = await supabase
      .from('heritage_categories')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get categories with site count
   */
  static async getCategoriesWithSiteCount(): Promise<(HeritageCategory & { site_count: number })[]> {
    const { data, error } = await supabase
      .from('heritage_categories')
      .select(`
        *,
        cultural_sites!inner(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to include site count
    return (data || []).map(category => ({
      ...category,
      site_count: Array.isArray(category.cultural_sites)
        ? category.cultural_sites.length
        : 0
    }));
  }

  /**
   * Check if category is being used by any sites
   */
  static async isCategoryInUse(categoryId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('cultural_sites')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);

    if (error) throw error;
    return (data || []).length > 0;
  }

  /**
   * Get category usage statistics
   */
  static async getCategoryUsageStats(): Promise<{
    total_categories: number;
    categories_in_use: number;
    unused_categories: number;
  }> {
    const categories = await this.fetchAllCategories();
    const categoriesWithUsage = await this.getCategoriesWithSiteCount();

    const categoriesInUse = categoriesWithUsage.filter(cat => cat.site_count > 0);

    return {
      total_categories: categories.length,
      categories_in_use: categoriesInUse.length,
      unused_categories: categories.length - categoriesInUse.length,
    };
  }

  /**
   * Bulk delete categories (only unused ones)
   */
  static async bulkDeleteCategories(categoryIds: string[]): Promise<void> {
    // First check which categories are in use
    const inUseCategories: string[] = [];

    for (const categoryId of categoryIds) {
      const isInUse = await this.isCategoryInUse(categoryId);
      if (isInUse) {
        inUseCategories.push(categoryId);
      }
    }

    if (inUseCategories.length > 0) {
      throw new Error(`Cannot delete categories that are in use: ${inUseCategories.join(', ')}`);
    }

    const { error } = await supabase
      .from('heritage_categories')
      .delete()
      .in('id', categoryIds);

    if (error) throw error;
  }

  /**
   * Update category color
   */
  static async updateCategoryColor(categoryId: string, colorHex: string): Promise<void> {
    const { error } = await supabase
      .from('heritage_categories')
      .update({ color_hex: colorHex })
      .eq('id', categoryId);

    if (error) throw error;
  }

  /**
   * Get categories ordered by usage
   */
  static async getCategoriesByUsage(): Promise<(HeritageCategory & { site_count: number })[]> {
    const categoriesWithCount = await this.getCategoriesWithSiteCount();
    return categoriesWithCount.sort((a, b) => b.site_count - a.site_count);
  }
}