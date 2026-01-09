import { supabase } from './supabase';

/**
 * Upload image to Supabase storage
 * @param {File} file - Image file to upload
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadListingImage = async (file, userId) => {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'Dosya seçilmedi' };
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return { success: false, error: 'Dosya boyutu 50MB\'dan büyük olamaz' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Sadece JPEG, PNG, WebP ve GIF formatları desteklenir' };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from('listing_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: 'Dosya yüklenirken hata oluştu' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('listing_images')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: filePath
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return { success: false, error: 'Bilinmeyen bir hata oluştu' };
  }
};

/**
 * Delete image from Supabase storage
 * @param {string} imagePath - Path of the image to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteListingImage = async (imagePath) => {
  try {
    const { error } = await supabase.storage
      .from('listing_images')
      .remove([imagePath]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: 'Dosya silinirken hata oluştu' };
    }

    return { success: true };
  } catch (error) {
    console.error('Image delete error:', error);
    return { success: false, error: 'Bilinmeyen bir hata oluştu' };
  }
};

/**
 * Get all images for a listing
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, images?: string[], error?: string}>}
 */
export const getUserListingImages = async (userId) => {
  try {
    const { data, error } = await supabase.storage
      .from('listing_images')
      .list(userId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('List images error:', error);
      return { success: false, error: 'Resimler listelenirken hata oluştu' };
    }

    // Get public URLs for all images
    const images = data.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from('listing_images')
        .getPublicUrl(`${userId}/${file.name}`);
      return publicUrl;
    });

    return { success: true, images };
  } catch (error) {
    console.error('Get images error:', error);
    return { success: false, error: 'Bilinmeyen bir hata oluştu' };
  }
};
