import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HardDrive, 
  File, 
  Image, 
  Trash2, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { FileStorageService } from '@/lib/file-storage-service';
import { supabase } from '@/integrations/supabase/clients';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface StorageFile {
  name: string;
  size: number;
  created_at: string;
  bucket: string;
  path: string;
  productTitle?: string;
  productId?: string;
}

export function StorageManagement() {
  const { profile } = useAuth();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [storageStats, setStorageStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    productFiles: 0,
    imageFiles: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Storage limits (can be made configurable)
  const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5GB
  const FILE_LIMIT = 1000; // 1000 files

  useEffect(() => {
    if (profile) {
      fetchStorageData();
    }
  }, [profile]);

  const fetchStorageData = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Get storage statistics
      const statsResult = await FileStorageService.getStorageStats(profile.user_id);
      if (statsResult.success && statsResult.stats) {
        setStorageStats(statsResult.stats);
      }

      // Get detailed file list
      await fetchFileList();

    } catch (error) {
      console.error('Error fetching storage data:', error);
      toast.error('Failed to load storage data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFileList = async () => {
    if (!profile) return;

    try {
      // Get product files
      const { data: productFiles, error: productError } = await supabase.storage
        .from('product-files')
        .list(profile.user_id);

      // Get image files
      const { data: imageFiles, error: imageError } = await supabase.storage
        .from('product-images')
        .list(profile.user_id);

      if (productError || imageError) {
        throw new Error('Failed to fetch file list');
      }

      // Get product information for file mapping
      const { data: products } = await supabase
        .from('products')
        .select('id, title, file_url, thumbnail_url')
        .eq('seller_id', profile.id);

      // Combine and map files
      const allFiles: StorageFile[] = [
        ...(productFiles || []).map(file => {
          const product = products?.find(p => p.file_url?.includes(file.name));
          return {
            name: file.name,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            bucket: 'product-files',
            path: `${profile.user_id}/${file.name}`,
            productTitle: product?.title,
            productId: product?.id,
          };
        }),
        ...(imageFiles || []).map(file => {
          const product = products?.find(p => p.thumbnail_url?.includes(file.name));
          return {
            name: file.name,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            bucket: 'product-images',
            path: `${profile.user_id}/${file.name}`,
            productTitle: product?.title,
            productId: product?.id,
          };
        }),
      ];

      // Sort by creation date (newest first)
      allFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setFiles(allFiles);

    } catch (error) {
      console.error('Error fetching file list:', error);
      toast.error('Failed to load file list');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStorageData();
    setRefreshing(false);
    toast.success('Storage data refreshed');
  };

  const handleDeleteFile = async (file: StorageFile) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) {
      return;
    }

    try {
      const result = await FileStorageService.deleteFile(
        file.path,
        file.bucket as 'product-files' | 'product-images'
      );

      if (result.success) {
        toast.success('File deleted successfully');
        await fetchStorageData();
      } else {
        toast.error(result.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDownloadFile = async (file: StorageFile) => {
    if (file.bucket !== 'product-files') {
      // For images, use public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(file.path);
      
      window.open(data.publicUrl, '_blank');
      return;
    }

    try {
      // Generate signed URL for product files
      const result = await FileStorageService.generateDownloadLink(file.path);
      
      if (result.success && result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
        toast.success('Download started');
      } else {
        toast.error(result.error || 'Failed to generate download link');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const getStorageUsagePercentage = () => {
    return Math.min((storageStats.totalSize / STORAGE_LIMIT) * 100, 100);
  };

  const getFileUsagePercentage = () => {
    return Math.min((storageStats.totalFiles / FILE_LIMIT) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Storage Management</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <HardDrive className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">
                  {FileStorageService.formatFileSize(storageStats.totalSize)}
                </p>
                <Progress value={getStorageUsagePercentage()} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {getStorageUsagePercentage().toFixed(1)}% of {FileStorageService.formatFileSize(STORAGE_LIMIT)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <File className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Product Files</p>
                <p className="text-2xl font-bold">{storageStats.productFiles}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Digital products uploaded
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Image className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Image Files</p>
                <p className="text-2xl font-bold">{storageStats.imageFiles}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Thumbnails and previews
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Warnings */}
      {getStorageUsagePercentage() > 80 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're using {getStorageUsagePercentage().toFixed(1)}% of your storage limit. 
            Consider deleting unused files or upgrading your plan.
          </AlertDescription>
        </Alert>
      )}

      {getFileUsagePercentage() > 90 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You're approaching the file limit ({storageStats.totalFiles}/{FILE_LIMIT} files). 
            Consider organizing or removing old files.
          </AlertDescription>
        </Alert>
      )}

      {/* File List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">
                      {FileStorageService.getFileTypeIcon(file.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      {file.productTitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          Product: {file.productTitle}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{FileStorageService.formatFileSize(file.size)}</span>
                        <span>{formatDate(file.created_at)}</span>
                        <Badge variant="outline" className="text-xs">
                          {file.bucket === 'product-files' ? 'Product' : 'Image'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadFile(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFile(file)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Storage Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Optimize File Sizes:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Compress files before uploading (ZIP recommended)</li>
                <li>• Use optimized images (WebP, compressed JPEG)</li>
                <li>• Remove unnecessary files from packages</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Best Practices:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Use descriptive file names</li>
                <li>• Keep backups of important files</li>
                <li>• Regularly clean up old versions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}