import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  File, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  Package,
  Tag,
  Globe,
  FileText,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/clients';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProductUploadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ProductFormData {
  title: string;
  description: string;
  short_description: string;
  category: string;
  tags: string[];
  price: number;
  pricing_type: string;
  version: string;
  demo_url: string;
  documentation_url: string;
}

export function ProductUploadForm({ onSuccess, onCancel }: ProductUploadFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    short_description: '',
    category: '',
    tags: [],
    price: 0,
    pricing_type: 'one_time',
    version: '1.0.0',
    demo_url: '',
    documentation_url: ''
  });

  const [files, setFiles] = useState({
    productFile: null as File | null,
    thumbnail: null as File | null
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentTag, setCurrentTag] = useState('');

  const categories = [
    'bots',
    'software', 
    'templates',
    'assets',
    'apis',
    'plugins'
  ];

  const pricingTypes = [
    { value: 'one_time', label: 'One-time Purchase' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'freemium', label: 'Freemium' },
    { value: 'free', label: 'Free' }
  ];

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (type: 'productFile' | 'thumbnail', file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      handleInputChange('tags', [...formData.tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Product title is required';
    if (!formData.description.trim()) return 'Product description is required';
    if (!formData.category) return 'Please select a category';
    if (formData.price < 0) return 'Price cannot be negative';
    if (!files.productFile) return 'Product file is required';
    if (!files.thumbnail) return 'Thumbnail image is required';
    
    // File size validation
    if (files.productFile.size > 500 * 1024 * 1024) {
      return 'Product file must be smaller than 500MB';
    }
    if (files.thumbnail.size > 10 * 1024 * 1024) {
      return 'Thumbnail must be smaller than 10MB';
    }

    return null;
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      return data.path;
    } catch (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: 'Validation Error',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }

    if (!profile) {
      toast({
        title: 'Authentication Error',
        description: 'Please sign in to upload products',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file names
      const timestamp = Date.now();
      const productFileName = `${profile.user_id}/${timestamp}_${files.productFile!.name}`;
      const thumbnailFileName = `${profile.user_id}/${timestamp}_thumbnail_${files.thumbnail!.name}`;

      // Upload product file
      setUploadProgress(25);
      const productFilePath = await uploadFile(files.productFile!, 'product-files', productFileName);
      if (!productFilePath) {
        throw new Error('Failed to upload product file');
      }

      // Upload thumbnail
      setUploadProgress(50);
      const thumbnailPath = await uploadFile(files.thumbnail!, 'product-images', thumbnailFileName);
      if (!thumbnailPath) {
        throw new Error('Failed to upload thumbnail');
      }

      // Get file URLs
      const { data: productFileUrl } = supabase.storage
        .from('product-files')
        .getPublicUrl(productFilePath);

      const { data: thumbnailUrl } = supabase.storage
        .from('product-images')
        .getPublicUrl(thumbnailPath);

      // Create product record
      setUploadProgress(75);
      const productData = {
        seller_id: profile.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        short_description: formData.short_description.trim() || null,
        category: formData.category,
        tags: formData.tags,
        price: formData.price,
        pricing_type: formData.pricing_type,
        version: formData.version.trim(),
        demo_url: formData.demo_url.trim() || null,
        documentation_url: formData.documentation_url.trim() || null,
        file_url: productFileUrl.publicUrl,
        file_size: files.productFile!.size,
        thumbnail_url: thumbnailUrl.publicUrl,
        status: 'pending'
      };

      const { error: insertError } = await supabase
        .from('products')
        .insert(productData);

      if (insertError) throw insertError;

      setUploadProgress(100);
      
      toast({
        title: 'Product Uploaded Successfully! 🎉',
        description: 'Your product is now pending review and will be live soon.',
      });

      onSuccess();

    } catch (error: any) {
      console.error('Error uploading product:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload product. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Upload New Product
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Share your digital product with the world
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {uploading && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="mb-2" />
              <p className="text-xs text-muted-foreground">
                Please don't close this page while uploading
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter product title"
                    disabled={uploading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                    disabled={uploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  placeholder="Brief one-line description"
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed description of your product..."
                  rows={6}
                  disabled={uploading}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricing_type">Pricing Type</Label>
                  <Select 
                    value={formData.pricing_type} 
                    onValueChange={(value) => handleInputChange('pricing_type', value)}
                    disabled={uploading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pricingTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    disabled={uploading || formData.pricing_type === 'free'}
                  />
                  {formData.pricing_type !== 'free' && (
                    <p className="text-xs text-muted-foreground">
                      You'll receive 90% (${(formData.price * 0.9).toFixed(2)}) per sale
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </h3>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    disabled={uploading}
                  />
                  <Button type="button" onClick={addTag} disabled={uploading}>
                    Add
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                          disabled={uploading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                    placeholder="1.0.0"
                    disabled={uploading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="demo_url">Demo URL</Label>
                  <Input
                    id="demo_url"
                    type="url"
                    value={formData.demo_url}
                    onChange={(e) => handleInputChange('demo_url', e.target.value)}
                    placeholder="https://demo.example.com"
                    disabled={uploading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="documentation_url">Documentation URL</Label>
                  <Input
                    id="documentation_url"
                    type="url"
                    value={formData.documentation_url}
                    onChange={(e) => handleInputChange('documentation_url', e.target.value)}
                    placeholder="https://docs.example.com"
                    disabled={uploading}
                  />
                </div>
              </div>
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">File Uploads</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product File */}
                <div className="space-y-2">
                  <Label>Product File *</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {files.productFile ? (
                      <div className="space-y-2">
                        <File className="h-8 w-8 mx-auto text-green-600" />
                        <p className="font-medium">{files.productFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(files.productFile.size)}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileChange('productFile', null)}
                          disabled={uploading}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm">Upload your product file</p>
                        <p className="text-xs text-muted-foreground">
                          ZIP, RAR, EXE, DMG, etc. (Max 500MB)
                        </p>
                        <Input
                          type="file"
                          onChange={(e) => handleFileChange('productFile', e.target.files?.[0] || null)}
                          accept=".zip,.rar,.7z,.tar.gz,.exe,.msi,.dmg,.pkg,.deb,.rpm,.jar,.apk"
                          disabled={uploading}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="space-y-2">
                  <Label>Thumbnail Image *</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {files.thumbnail ? (
                      <div className="space-y-2">
                        <ImageIcon className="h-8 w-8 mx-auto text-green-600" />
                        <p className="font-medium">{files.thumbnail.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(files.thumbnail.size)}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileChange('thumbnail', null)}
                          disabled={uploading}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm">Upload thumbnail image</p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG, WebP (Max 10MB)
                        </p>
                        <Input
                          type="file"
                          onChange={(e) => handleFileChange('thumbnail', e.target.files?.[0] || null)}
                          accept="image/*"
                          disabled={uploading}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Review Guidelines */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Review Guidelines:</strong> Your product will be reviewed within 24-48 hours. 
                Ensure your files are original, functional, and properly documented for faster approval.
              </AlertDescription>
            </Alert>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Product
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}