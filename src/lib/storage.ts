/**
 * Storage helper functions for file uploads and management
 */

export interface UploadResult {
  url: string;
}

export interface UploadOptions {
  projectId: string;
  path: string;
  file: File | Blob;
}

/**
 * Upload a file to storage
 * @param projectId - The project ID
 * @param path - The path where the file should be stored
 * @param file - The file or blob to upload
 * @returns Promise with the uploaded file URL
 */
export async function uploadFile(
  projectId: string, 
  path: string, 
  file: File | Blob
): Promise<UploadResult> {
  try {
    // For now, we'll simulate the upload process
    // This would need to be replaced with actual storage implementation
    console.log('Uploading file:', { projectId, path, fileName: file instanceof File ? file.name : 'blob' });
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock URL for now
    const mockUrl = `https://storage.example.com/${projectId}/${path}`;
    
    return { url: mockUrl };
  } catch (error) {
    console.error('File upload failed:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from storage
 * @param url - The URL of the file to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    // For now, we'll just log the deletion
    // This would need to be replaced with actual storage deletion implementation
    console.log('Deleting file:', url);
    
    // TODO: Implement actual file deletion logic
    // This might involve:
    // 1. Extracting file path/ID from URL
    // 2. Calling storage service to delete the file
    // 3. Handling errors appropriately
    
    // For now, we'll simulate successful deletion
    return Promise.resolve();
  } catch (error) {
    console.error('File deletion failed:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a unique file path for uploads
 * @param projectId - The project ID
 * @param originalName - The original file name
 * @param category - Optional category for organization (e.g., 'images', 'documents')
 * @returns A unique file path
 */
export function generateFilePath(
  projectId: string, 
  originalName: string, 
  category: string = 'uploads'
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || '';
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${projectId}/${category}/${timestamp}_${randomId}_${sanitizedName}`;
}

/**
 * Validate file before upload
 * @param file - The file to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateFile(
  file: File | Blob,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = ['image/*'] } = options; // 10MB default

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit` };
  }

  if (file instanceof File && allowedTypes.length > 0) {
    const fileType = file.type;
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.slice(0, -1));
      }
      return fileType === type;
    });

    if (!isAllowed) {
      return { valid: false, error: `File type ${fileType} not allowed` };
    }
  }

  return { valid: true };
}
