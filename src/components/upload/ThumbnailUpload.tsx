import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbnailService } from '@/lib/thumbnail-service';
import { cn } from '@/lib/utils';

interface ThumbnailUploadProps {
  onThumbnailChange: (file: File | null, previewUrl: string | null) => void;
  currentThumbnail?: string;
  className?: string;
}

export function ThumbnailUpload({ onThumbnailChange, currentThumbnail, className }: ThumbnailUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentThumbnail || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    setIsGenerating(true);
    
    try {
      // Generate thumbnail
      const result = await ThumbnailService.generateThumbnail(file, {
        width: 400,
        height: 250,
        quality: 85,
        format: 'webp'
      });

      if (result) {
        setPreviewUrl(result.url);
        onThumbnailChange(result.file, result.url);
      } else {
        // Fallback to original file if thumbnail generation fails
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        onThumbnailChange(file, url);
      }
    } catch (error) {
      console.error('Thumbnail processing failed:', error);
      // Fallback to original file
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onThumbnailChange(file, url);
    } finally {
      setIsGenerating(false);
    }
  }, [onThumbnailChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const removeThumbnail = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onThumbnailChange(null, null);
  }, [previewUrl, onThumbnailChange]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Product Thumbnail</label>
        <p className="text-xs text-muted-foreground">
          Upload an image to represent your product. Recommended size: 400x250px
        </p>
      </div>

      {previewUrl ? (
        /* Preview */
        <Card className="relative overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-[16/10] bg-muted">
              <img
                src={previewUrl}
                alt="Thumbnail preview"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeThumbnail}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Upload Area */
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            isGenerating && "pointer-events-none opacity-50"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => document.getElementById('thumbnail-upload')?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            {isGenerating ? (
              <>
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium">Generating thumbnail...</p>
                <p className="text-xs text-muted-foreground">Optimizing your image</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium mb-2">Upload Product Thumbnail</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Drag and drop an image here, or click to browse
                </p>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Choose Image
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        id="thumbnail-upload"
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Supported formats: JPG, PNG, WebP, GIF</p>
        <p>• Recommended aspect ratio: 16:10 (e.g., 400x250px)</p>
        <p>• Maximum file size: 5MB</p>
        <p>• Images will be automatically optimized for web</p>
      </div>
    </div>
  );
}