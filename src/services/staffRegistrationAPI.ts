// API service for staff registration with face recognition backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface RegisterStaffData {
  staff_id: string;
  staff_name: string;
  images: File[] | Blob[];
}

export interface ApiResponse {
  message: string;
  success: boolean;
  data?: any;
  error?: string;
}

export class StaffRegistrationAPI {
  static async registerStaff(data: RegisterStaffData): Promise<ApiResponse> {
    try {
      console.log('🚀 Starting staff registration API call...');
      console.log('📊 Data summary:', {
        staff_id: data.staff_id,
        staff_name: data.staff_name,
        images_count: data.images.length,
        api_url: `${API_BASE_URL}/face/register`
      });

      const formData = new FormData();
      formData.append('staff_id', data.staff_id);
      formData.append('staff_name', data.staff_name);
      
      // Add all images to FormData
      data.images.forEach((image, index) => {
        if (image instanceof File) {
          formData.append('image', image);
          console.log(`📷 Added File ${index + 1}: ${image.name} (${image.size} bytes)`);
        } else if (image instanceof Blob) {
          formData.append('image', image, `photo_${index + 1}.jpg`);
          console.log(`📷 Added Blob ${index + 1}: photo_${index + 1}.jpg (${image.size} bytes)`);
        }
      });

      console.log('📤 Sending POST request to:', `${API_BASE_URL}/face/register`);
      
      const response = await fetch(`${API_BASE_URL}/face/register`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser set it with boundary
      });
      
      console.log('📥 Response status:', response.status, response.statusText);

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: responseData.message || 'Staff registered successfully',
          data: responseData
        };
      } else {
        return {
          success: false,
          message: 'Registration failed',
          error: responseData.detail || 'Unknown error occurred'
        };
      }
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  static async verifyStaff(staffId: string, image: File | Blob): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('staff_id', staffId);
      
      if (image instanceof File) {
        formData.append('image', image);
      } else if (image instanceof Blob) {
        formData.append('image', image, 'verification.jpg');
      }

      const response = await fetch(`${API_BASE_URL}/face/verify`, {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Verification successful',
          data: responseData
        };
      } else {
        return {
          success: false,
          message: 'Verification failed',
          error: responseData.detail || 'Verification unsuccessful'
        };
      }
    } catch (error) {
      console.error('Verification Error:', error);
      return {
        success: false,
        message: 'Verification error',
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  static async getStaffList(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/face/staff`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Staff list retrieved successfully',
          data: responseData
        };
      } else {
        return {
          success: false,
          message: 'Failed to retrieve staff list',
          error: responseData.detail || 'Unknown error'
        };
      }
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  static async deleteStaff(staffId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/face/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Staff deleted successfully'
        };
      } else {
        const responseData = await response.json();
        return {
          success: false,
          message: 'Failed to delete staff',
          error: responseData.detail || 'Unknown error'
        };
      }
    } catch (error) {
      console.error('Delete Error:', error);
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }
}

// Utility functions for image handling
export class ImageUtils {
  static async blobToFile(blob: Blob, filename: string): Promise<File> {
    return new File([blob], filename, { type: blob.type });
  }

  static async resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve(blob!);
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'Image size must be less than 5MB' };
    }

    return { valid: true };
  }
}

export default StaffRegistrationAPI;