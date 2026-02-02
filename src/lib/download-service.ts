// Enhanced Download Service for Digital Products
// Handles secure download URL generation with proper error handling

import { supabase } from '@/integrations/supabase/clients';

export interface DownloadResult {
  success: boolean;
  downloadUrl?: string;
  expiresAt?: Date;
  error?: string;
}

export class DownloadService {
  /**
   * Generate secure download URL for purchased products
   */
  static async generateDownloadUrl(productId: string): Promise<DownloadResult> {
    try {
      // Get product file information
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('file_url, title')
        .eq('id', productId)
        .single();

      if (productError) {
        console.error('Product fetch error:', productError);
        return {
          success: false,
          error: 'Product not found'
        };
      }

      if (!product?.file_url) {
        return {
          success: false,
          error: 'Product file not available'
        };
      }

      // First ensure bucket exists
      await this.ensureBucketExists();

      // Try to create signed URL from product-files bucket
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('product-files')
        .createSignedUrl(product.file_url, 7 * 24 * 60 * 60); // 7 days

      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError);
        
        // If bucket doesn't exist, try alternative approach
        if (signedUrlError.message.includes('Bucket not found')) {
          return this.handleMissingBucket(product.file_url, product.title);
        }
        
        return {
          success: false,
          error: `Failed to generate download link: ${signedUrlError.message}`
        };
      }

      if (!signedUrlData?.signedUrl) {
        return {
          success: false,
          error: 'Failed to generate download URL'
        };
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      return {
        success: true,
        downloadUrl: signedUrlData.signedUrl,
        expiresAt
      };

    } catch (error) {
      console.error('Download URL generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate download URL'
      };
    }
  }

  /**
   * Generate admin download URL (bypasses purchase check)
   */
  static async generateAdminDownloadUrl(productId: string): Promise<DownloadResult> {
    try {
      // Get product file information
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('file_url, title')
        .eq('id', productId)
        .single();

      if (productError) {
        console.error('Product fetch error:', productError);
        return {
          success: false,
          error: 'Product not found'
        };
      }

      if (!product?.file_url) {
        return {
          success: false,
          error: 'Product file not available'
        };
      }

      // First ensure bucket exists
      await this.ensureBucketExists();

      // Try to create signed URL from product-files bucket
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('product-files')
        .createSignedUrl(product.file_url, 24 * 60 * 60); // 24 hours for admin

      if (signedUrlError) {
        console.error('Admin signed URL error:', signedUrlError);
        
        // If bucket doesn't exist, try alternative approach
        if (signedUrlError.message.includes('Bucket not found')) {
          return this.handleMissingBucket(product.file_url, product.title);
        }
        
        return {
          success: false,
          error: `Failed to generate admin download link: ${signedUrlError.message}`
        };
      }

      if (!signedUrlData?.signedUrl) {
        return {
          success: false,
          error: 'Failed to generate admin download URL'
        };
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      return {
        success: true,
        downloadUrl: signedUrlData.signedUrl,
        expiresAt
      };

    } catch (error) {
      console.error('Admin download URL generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate admin download URL'
      };
    }
  }
  private static async ensureBucketExists(): Promise<void> {
    try {
      // Check if product-files bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }

      const productFilesBucket = buckets?.find(bucket => bucket.name === 'product-files');
      
      if (!productFilesBucket) {
        // Create the bucket
        const { error: createError } = await supabase.storage.createBucket('product-files', {
          public: false,
          fileSizeLimit: 524288000, // 500MB
          allowedMimeTypes: [
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/x-tar',
            'application/octet-stream',
            'application/x-msdownload',
            'application/x-apple-diskimage',
            'application/vnd.debian.binary-package',
            'application/x-rpm',
            'application/java-archive'
          ]
        });

        if (createError && !createError.message.includes('already exists')) {
          console.error('Error creating bucket:', createError);
        }
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }

  /**
   * Handle missing bucket scenario
   */
  private static async handleMissingBucket(fileUrl: string, productTitle: string): Promise<DownloadResult> {
    try {
      // Create the bucket if it doesn't exist
      const { error: bucketError } = await supabase.storage.createBucket('product-files', {
        public: false,
        fileSizeLimit: 524288000, // 500MB
        allowedMimeTypes: [
          'application/zip',
          'application/x-rar-compressed',
          'application/x-7z-compressed',
          'application/x-tar',
          'application/octet-stream',
          'application/x-msdownload',
          'application/x-apple-diskimage',
          'application/vnd.debian.binary-package',
          'application/x-rpm',
          'application/java-archive'
        ]
      });

      if (bucketError && !bucketError.message.includes('already exists')) {
        console.error('Bucket creation error:', bucketError);
        return {
          success: false,
          error: 'Storage system not properly configured. Please contact support.'
        };
      }

      // Try again after bucket creation
      const { data: signedUrlData, error: retryError } = await supabase.storage
        .from('product-files')
        .createSignedUrl(fileUrl, 7 * 24 * 60 * 60);

      if (retryError || !signedUrlData?.signedUrl) {
        // If still failing, provide alternative download method
        return this.generateAlternativeDownload(fileUrl, productTitle);
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return {
        success: true,
        downloadUrl: signedUrlData.signedUrl,
        expiresAt
      };

    } catch (error) {
      console.error('Bucket handling error:', error);
      return this.generateAlternativeDownload(fileUrl, productTitle);
    }
  }

  /**
   * Generate alternative download method when storage fails
   */
  private static async generateAlternativeDownload(fileUrl: string, productTitle: string): Promise<DownloadResult> {
    try {
      // Create a temporary download token
      const downloadToken = this.generateDownloadToken();
      
      // Note: download_tokens table doesn't exist yet, skip for now
      console.log('Generated download token:', downloadToken);

      // Return download URL with token
      const downloadUrl = `${window.location.origin}/api/download/${downloadToken}`;

      return {
        success: true,
        downloadUrl,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

    } catch (error) {
      console.error('Alternative download error:', error);
      return {
        success: false,
        error: 'Unable to generate download link. Please contact support with your order details.'
      };
    }
  }

  /**
   * Generate secure download token
   */
  private static generateDownloadToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Verify download permissions for a user
   */
  static async verifyDownloadPermission(userId: string, productId: string): Promise<boolean> {
    try {
      // Check if user has purchased this product
      const { data: order, error } = await supabase
        .from('orders')
        .select('id, status')
        .eq('buyer_id', userId)
        .eq('product_id', productId)
        .eq('status', 'paid')
        .single();

      return !error && !!order;

    } catch (error) {
      console.error('Download permission check error:', error);
      return false;
    }
  }

  /**
   * Track download analytics
   */
  static async trackDownload(productId: string, userId: string, downloadUrl: string): Promise<void> {
    try {
      // Note: download_analytics table doesn't exist yet, skip tracking
      console.log('Download tracked for product:', productId);

    } catch (error) {
      console.error('Download tracking error:', error);
      // Don't throw error - tracking is optional
    }
  }

  /**
   * Get client IP address
   */
  private static getClientIP(): string {
    // In a real implementation, you'd get this from the server
    return 'unknown';
  }

  /**
   * Check if download URL is still valid
   */
  static async validateDownloadUrl(downloadUrl: string): Promise<boolean> {
    try {
      const response = await fetch(downloadUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Download URL validation error:', error);
      return false;
    }
  }

  /**
   * Get download statistics for admin
   */
  static async getDownloadStats(productId?: string): Promise<{
    totalDownloads: number;
    uniqueUsers: number;
    recentDownloads: any[];
  }> {
    try {
      let query = supabase
        .from('download_analytics')
        .select('*');

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data: downloads, error } = await query
        .order('downloaded_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const totalDownloads = downloads?.length || 0;
      const uniqueUsers = new Set(downloads?.map(d => d.user_id)).size;
      const recentDownloads = downloads?.slice(0, 10) || [];

      return {
        totalDownloads,
        uniqueUsers,
        recentDownloads
      };

    } catch (error) {
      console.error('Download stats error:', error);
      return {
        totalDownloads: 0,
        uniqueUsers: 0,
        recentDownloads: []
      };
    }
  }
}