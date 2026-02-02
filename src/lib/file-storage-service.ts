// Enhanced File Storage Service for Digital Products
// Handles secure upload, storage, and download of digital products

import { supabase } from '@/integrations/supabase/clients';

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  compress?: boolean;
  generateThumbnail?: boolean;
}

export interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  publicUrl?: string;
  filePath?: string;
  fileSize?: number;
  error?: string;
}

export interface DownloadLinkOptions {
  expiresIn?: number; // seconds
  downloadLimit?: number;
  trackDownload?: boolean;
}

export class FileStorageService {
  // Default file size limits
  static readonly DEFAULT_LIMITS = {
    PRODUCT_FILE: 500 * 1024 * 1024, // 500MB
    THUMBNAIL: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
  };

  // Allowed file types
  static readonly ALLOWED_TYPES = {
    PRODUCT_FILES: [
      '.zip', '.rar', '.7z', '.tar.gz',
      '.exe', '.msi', '.dmg', '.pkg',
      '.deb', '.rpm', '.appimage',
      '.jar', '.war', '.apk'
    ],
    IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt', '.md'],
  };

  /**
   * Upload a product file to secure storage
   */
  static async uploadProductFile(
    file: File,
    sellerId: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, {
        maxSize: options.maxSize || this.DEFAULT_LIMITS.PRODUCT_FILE,
        allowedTypes: options.allowedTypes || this.ALLOWED_TYPES.PRODUCT_FILES,
      });

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = this.sanitizeFileName(file.name);
      const filePath = `${sellerId}/${timestamp}-${sanitizedName}`;

      // Upload to private bucket
      const { data, error } = await supabase.storage
        .from('product-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get file URL (private - requires signed URL for access)
      const fileUrl = data.path;

      return {
        success: true,
        fileUrl,
        filePath,
        fileSize: file.size,
      };

    } catch (error) {
      console.error('Product file upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload thumbnail/preview image
   */
  static async uploadThumbnail(
    file: File,
    sellerId: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    try {
      // Validate image file
      const validation = this.validateFile(file, {
        maxSize: options.maxSize || this.DEFAULT_LIMITS.THUMBNAIL,
        allowedTypes: options.allowedTypes || this.ALLOWED_TYPES.IMAGES,
      });

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = this.sanitizeFileName(file.name);
      const filePath = `${sellerId}/${timestamp}-${sanitizedName}`;

      // Upload to public bucket
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      return {
        success: true,
        fileUrl: data.path,
        publicUrl: publicUrlData.publicUrl,
        filePath: data.path,
        fileSize: file.size,
      };

    } catch (error) {
      console.error('Thumbnail upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Generate secure download link for purchased products
   */
  static async generateDownloadLink(
    filePath: string,
    options: DownloadLinkOptions = {}
  ): Promise<{ success: boolean; downloadUrl?: string; expiresAt?: Date; error?: string }> {
    try {
      const expiresIn = options.expiresIn || 7 * 24 * 60 * 60; // 7 days default
      
      const { data, error } = await supabase.storage
        .from('product-files')
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Failed to generate download link: ${error.message}`);
      }

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      return {
        success: true,
        downloadUrl: data.signedUrl,
        expiresAt,
      };

    } catch (error) {
      console.error('Download link generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate download link',
      };
    }
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(
    filePath: string,
    bucket: 'product-files' | 'product-images' = 'product-files'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      return { success: true };

    } catch (error) {
      console.error('File deletion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * Get file information
   */
  static async getFileInfo(
    filePath: string,
    bucket: 'product-files' | 'product-images' = 'product-files'
  ): Promise<{ success: boolean; fileInfo?: any; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(filePath.split('/')[0], {
          search: filePath.split('/')[1],
        });

      if (error) {
        throw new Error(`Failed to get file info: ${error.message}`);
      }

      const fileInfo = data?.[0];
      
      return {
        success: true,
        fileInfo,
      };

    } catch (error) {
      console.error('File info error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file info',
      };
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(
    file: File,
    options: { maxSize: number; allowedTypes: string[] }
  ): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > options.maxSize) {
      const maxSizeMB = Math.round(options.maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!options.allowedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type ${fileExtension} is not allowed`,
      };
    }

    // Check for suspicious files
    if (this.isSuspiciousFile(file.name)) {
      return {
        valid: false,
        error: 'File name contains suspicious content',
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize file name for safe storage
   */
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .toLowerCase();
  }

  /**
   * Check for suspicious file names
   */
  static isSuspiciousFile(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.(bat|cmd|com|cpl|dll|exe|hta|inf|ins|isp|jar|jse|lib|lnk|mde|msc|msp|mst|pif|scr|sct|shb|sys|vb|vbe|vbs|vxd|wsc|wsf|wsh)$/i,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
      /(script|eval|exec|system|shell)/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(sellerId: string): Promise<{
    success: boolean;
    stats?: {
      totalFiles: number;
      totalSize: number;
      productFiles: number;
      imageFiles: number;
    };
    error?: string;
  }> {
    try {
      // Get product files
      const { data: productFiles, error: productError } = await supabase.storage
        .from('product-files')
        .list(sellerId);

      if (productError) throw productError;

      // Get image files
      const { data: imageFiles, error: imageError } = await supabase.storage
        .from('product-images')
        .list(sellerId);

      if (imageError) throw imageError;

      const totalFiles = (productFiles?.length || 0) + (imageFiles?.length || 0);
      const totalSize = [
        ...(productFiles || []),
        ...(imageFiles || [])
      ].reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

      return {
        success: true,
        stats: {
          totalFiles,
          totalSize,
          productFiles: productFiles?.length || 0,
          imageFiles: imageFiles?.length || 0,
        },
      };

    } catch (error) {
      console.error('Storage stats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get storage stats',
      };
    }
  }

  /**
   * Compress file before upload
   */
  static async compressFile(file: File): Promise<File> {
    // File compression not implemented - return original file
    return file;
  }

  /**
   * Generate thumbnail from image
   */
  static async generateThumbnail(imageFile: File, maxWidth: number = 800): Promise<File> {
    // Thumbnail generation not implemented - return original file
    return imageFile;
  }

  /**
   * Scan file for viruses
   */
  static async scanFile(file: File): Promise<{ clean: boolean; threats?: string[] }> {
    // Virus scanning not implemented - assume files are clean
    return { clean: true };
  }

  /**
   * Track download analytics
   */
  static async trackDownload(
    productId: string,
    buyerId: string,
    filePath: string
  ): Promise<void> {
    try {
      await supabase.from('download_analytics').insert({
        product_id: productId,
        buyer_id: buyerId,
        file_path: filePath,
        downloaded_at: new Date().toISOString(),
        ip_address: this.getClientIP(),
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Download tracking error:', error);
      // Don't throw error - tracking is optional
    }
  }

  /**
   * Get client IP address
   */
  static getClientIP(): string {
    // IP detection not implemented
    return 'unknown';
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file type icon
   */
  static getFileTypeIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'zip':
      case 'rar':
      case '7z':
        return '📦';
      case 'exe':
      case 'msi':
        return '⚙️';
      case 'dmg':
      case 'pkg':
        return '🍎';
      case 'deb':
      case 'rpm':
        return '🐧';
      case 'jar':
        return '☕';
      case 'apk':
        return '🤖';
      case 'pdf':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📁';
    }
  }
}