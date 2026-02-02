/**
 * Thumbnail Service
 * Handles thumbnail generation and optimization for uploaded products
 */

import { supabase } from '@/integrations/supabase/clients';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export class ThumbnailService {
  private static readonly DEFAULT_OPTIONS: Required<ThumbnailOptions> = {
    width: 400,
    height: 250,
    quality: 80,
    format: 'webp'
  };

  /**
   * Generate thumbnail from uploaded file
   */
  static async generateThumbnail(
    file: File,
    options: ThumbnailOptions = {}
  ): Promise<{ file: File; url: string } | null> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        return this.generateDefaultThumbnail(file.name, opts);
      }

      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Load image
      const img = await this.loadImage(file);
      
      // Calculate dimensions maintaining aspect ratio
      const { width, height } = this.calculateDimensions(
        img.width,
        img.height,
        opts.width,
        opts.height
      );

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw and resize image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const blob = await this.canvasToBlob(canvas, opts.format, opts.quality);
      const thumbnailFile = new File([blob], `thumb_${file.name}`, {
        type: `image/${opts.format}`
      });

      // Create object URL for preview
      const url = URL.createObjectURL(blob);

      return { file: thumbnailFile, url };
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return null;
    }
  }

  /**
   * Upload thumbnail to Supabase Storage
   */
  static async uploadThumbnail(
    thumbnailFile: File,
    productId: string,
    userId: string
  ): Promise<string | null> {
    try {
      const fileName = `${productId}/thumbnail_${Date.now()}.webp`;
      const filePath = `thumbnails/${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, thumbnailFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      return null;
    }
  }

  /**
   * Generate default thumbnail for non-image files
   */
  private static async generateDefaultThumbnail(
    fileName: string,
    options: Required<ThumbnailOptions>
  ): Promise<{ file: File; url: string } | null> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.width = options.width;
      canvas.height = options.height;

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, options.width, options.height);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#1d4ed8');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, options.width, options.height);

      // Add file icon
      ctx.fillStyle = 'white';
      ctx.font = `${options.height * 0.3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📦', options.width / 2, options.height / 2 - 20);

      // Add file extension
      const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
      ctx.font = `${options.height * 0.1}px Arial`;
      ctx.fillText(ext, options.width / 2, options.height / 2 + 30);

      const blob = await this.canvasToBlob(canvas, options.format, options.quality);
      const thumbnailFile = new File([blob], `thumb_${fileName}.webp`, {
        type: `image/${options.format}`
      });

      const url = URL.createObjectURL(blob);
      return { file: thumbnailFile, url };
    } catch (error) {
      console.error('Default thumbnail generation failed:', error);
      return null;
    }
  }

  /**
   * Load image from file
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate dimensions maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = maxWidth;
    let height = maxWidth / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Convert canvas to blob
   */
  private static canvasToBlob(
    canvas: HTMLCanvasElement,
    format: string,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to blob conversion failed'));
        },
        `image/${format}`,
        quality / 100
      );
    });
  }

  /**
   * Get optimized thumbnail URL from Supabase
   */
  static getOptimizedThumbnailUrl(
    originalUrl: string,
    options: ThumbnailOptions = {}
  ): string {
    if (!originalUrl) return '';
    
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // If it's a Supabase storage URL, add transformation parameters
    if (originalUrl.includes('supabase.co/storage')) {
      const url = new URL(originalUrl);
      url.searchParams.set('width', opts.width.toString());
      url.searchParams.set('height', opts.height.toString());
      url.searchParams.set('quality', opts.quality.toString());
      url.searchParams.set('format', opts.format);
      return url.toString();
    }
    
    return originalUrl;
  }

  /**
   * Preload thumbnail for faster display
   */
  static preloadThumbnail(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }
}