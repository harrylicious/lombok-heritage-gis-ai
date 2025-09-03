import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type SiteMedia = Database['public']['Tables']['site_media']['Row'];
type SiteMediaInsert = Database['public']['Tables']['site_media']['Insert'];

export class SiteMediaService {
  /**
   * Upload multiple images to Supabase Storage and link to site
   */
  static async uploadImages(files: FileList, siteId: string, userId: string): Promise<void> {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${siteId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('site-images')
        .getPublicUrl(fileName);

      // Save to site_media table
      const { error: dbError } = await supabase
        .from('site_media')
        .insert({
          site_id: siteId,
          file_url: urlData.publicUrl,
          file_type: file.type,
          title: file.name,
          uploaded_by: userId,
        });

      if (dbError) throw dbError;
    }
  }

  /**
   * Fetch all images for a specific site
   */
  static async fetchSiteImages(siteId: string): Promise<SiteMedia[]> {
    const { data, error } = await supabase
      .from('site_media')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete an image from both database and storage
   */
  static async deleteImage(imageId: string, fileUrl: string): Promise<void> {
    // Delete from database
    const { error: dbError } = await supabase
      .from('site_media')
      .delete()
      .eq('id', imageId);

    if (dbError) throw dbError;

    // Delete from storage
    const fileName = fileUrl.split('/').pop();
    if (fileName) {
      const { error: storageError } = await supabase.storage
        .from('site-images')
        .remove([fileName]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }
    }
  }

  /**
   * Update image metadata
   */
  static async updateImage(imageId: string, updates: Partial<SiteMedia>): Promise<void> {
    const { error } = await supabase
      .from('site_media')
      .update(updates)
      .eq('id', imageId);

    if (error) throw error;
  }

  /**
   * Set primary image for a site
   */
  static async setPrimaryImage(siteId: string, imageId: string): Promise<void> {
    // First, unset all primary images for this site
    await supabase
      .from('site_media')
      .update({ is_primary: false })
      .eq('site_id', siteId);

    // Then set the selected image as primary
    const { error } = await supabase
      .from('site_media')
      .update({ is_primary: true })
      .eq('id', imageId);

    if (error) throw error;
  }

  /**
   * Get primary image for a site
   */
  static async getPrimaryImage(siteId: string): Promise<SiteMedia | null> {
    const { data, error } = await supabase
      .from('site_media')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_primary', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  }
}