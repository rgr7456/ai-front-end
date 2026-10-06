// API service for employee face enrollment + verification (HRMS face service).
//
// Backend endpoints (see project_face-recognition):
//   POST   /face/enroll                   employee_id, employee_name, organization_id, images[]
//   POST   /face/verify                   image  (1:N, returns matched employee)
//   GET    /face/employees                list enrolled employees (tenant-scoped)
//   DELETE /face/employees/{employee_id}  delete an employee's faces
//
// Identity is multi-tenant: every call sends X-Tenant-Id (and X-Actor-Id for
// created_by). In production these come from the logged-in HRMS JWT; here they
// come from env so the admin tool works standalone.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Demo UUIDs — override in .env.local with your real HRMS tenant/org/user ids.
export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || '11111111-1111-1111-1111-111111111111';
export const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || '22222222-2222-2222-2222-222222222222';
export const ACTOR_ID = process.env.NEXT_PUBLIC_ACTOR_ID || '99999999-9999-9999-9999-999999999999';

function authHeaders(): Record<string, string> {
  return { 'X-Tenant-Id': TENANT_ID, 'X-Actor-Id': ACTOR_ID };
}

export interface RegisterEmployeeData {
  employee_id: string;        // UUID (HRMS employees.id)
  employee_name: string;
  organization_id?: string;   // UUID; defaults to ORG_ID
  images: File[] | Blob[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface VerifyResult {
  verified: boolean;
  employee_id: string;
  employee_name: string;
  organization_id: string;
  cosine: number;             // similarity 0..1 (higher = better)
  passive_score: number | null;
}

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function errorText(body: any): string {
  // FastAPI puts messages in `detail` (string or object).
  const d = body?.detail;
  if (typeof d === 'string') return d;
  if (d) return JSON.stringify(d);
  return 'Unknown error';
}

export class StaffRegistrationAPI {
  /** Enroll an employee with one or more captured photos. */
  static async registerStaff(data: RegisterEmployeeData): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('employee_id', data.employee_id);
      formData.append('employee_name', data.employee_name);
      formData.append('organization_id', data.organization_id || ORG_ID);

      data.images.forEach((image, index) => {
        if (image instanceof File) {
          formData.append('images', image);
        } else {
          formData.append('images', image, `photo_${index + 1}.jpg`);
        }
      });

      const res = await fetch(`${API_BASE_URL}/face/enroll`, {
        method: 'POST',
        headers: authHeaders(), // do NOT set Content-Type; browser adds the boundary
        body: formData,
      });
      const body = await parseJson(res);

      if (res.ok) {
        return { success: true, message: `Enrolled ${body.enrolled_images} photo(s)`, data: body };
      }
      return { success: false, message: 'Enrollment failed', error: errorText(body) };
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /** 1:N verify: identify who a captured face belongs to. */
  static async verifyStaff(image: File | Blob, organizationId?: string): Promise<ApiResponse<VerifyResult>> {
    try {
      const formData = new FormData();
      if (image instanceof File) formData.append('image', image);
      else formData.append('image', image, 'verification.jpg');

      const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : '';
      const res = await fetch(`${API_BASE_URL}/face/verify${qs}`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      const body = await parseJson(res);

      if (res.ok) {
        return { success: true, message: 'Verification successful', data: body };
      }
      // 422 no_match / liveness_failed etc. — treat as "not verified", not a crash.
      return { success: false, message: 'No match', error: errorText(body) };
    } catch (error) {
      return {
        success: false,
        message: 'Verification error',
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /** Liveness step 1: ask the backend for a random head-turn challenge. */
  static async startLivenessChallenge(): Promise<ApiResponse<{ challenge_id: string; action: string; prompt: string; ttl_seconds: number }>> {
    try {
      const res = await fetch(`${API_BASE_URL}/face/punch/challenge`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const body = await parseJson(res);
      if (res.ok) return { success: true, message: 'ok', data: body };
      return { success: false, message: 'Could not start challenge', error: errorText(body) };
    } catch (error) {
      return { success: false, message: 'Network error', error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  /** Liveness step 2: submit the frame burst for the challenge; returns matched employee. */
  static async verifyLiveness(challengeId: string, frames: Blob[], organizationId?: string): Promise<ApiResponse<VerifyResult & { active_passed: boolean }>> {
    try {
      const formData = new FormData();
      formData.append('challenge_id', challengeId);
      if (organizationId) formData.append('organization_id', organizationId);
      frames.forEach((f, i) => formData.append('frames', f, `frame_${i + 1}.jpg`));

      const res = await fetch(`${API_BASE_URL}/face/punch/verify`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      const body = await parseJson(res);
      if (res.ok) return { success: true, message: 'Liveness + identity verified', data: body };
      return { success: false, message: 'Liveness/verify failed', error: errorText(body) };
    } catch (error) {
      return { success: false, message: 'Network error', error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  /** 1:1 verification: liveness + match ONLY against the given employee_id. */
  static async verifyEmployee(employeeId: string, challengeId: string, frames: Blob[], organizationId?: string): Promise<ApiResponse<VerifyResult & { active_passed: boolean }>> {
    try {
      const formData = new FormData();
      formData.append('employee_id', employeeId);
      formData.append('challenge_id', challengeId);
      if (organizationId) formData.append('organization_id', organizationId);
      frames.forEach((f, i) => formData.append('frames', f, `frame_${i + 1}.jpg`));

      const res = await fetch(`${API_BASE_URL}/face/verify-employee`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      const body = await parseJson(res);
      if (res.ok) return { success: true, message: 'Verified', data: body };
      return { success: false, message: 'Verification failed', error: errorText(body) };
    } catch (error) {
      return { success: false, message: 'Network error', error: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  /** Recent verification attempts (for the dashboard activity feed). */
  static async getRecentVerifications(limit = 8): Promise<ApiResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/face/recent?limit=${limit}`, { headers: authHeaders() });
      const body = await parseJson(res);
      if (res.ok) return { success: true, message: 'ok', data: body };
      return { success: false, message: 'Failed to load activity', error: errorText(body) };
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /** List enrolled employees for the current tenant. */
  static async getStaffList(): Promise<ApiResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/face/employees`, { headers: authHeaders() });
      const body = await parseJson(res);
      if (res.ok) return { success: true, message: 'ok', data: body };
      return { success: false, message: 'Failed to list employees', error: errorText(body) };
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /** Delete an employee's enrolled faces (right to erasure). */
  static async deleteStaff(employeeId: string): Promise<ApiResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/face/employees/${employeeId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const body = await parseJson(res);
      if (res.ok) return { success: true, message: 'Deleted', data: body };
      return { success: false, message: 'Failed to delete', error: errorText(body) };
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}

// ---- helpers ----
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback RFC4122 v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim());
}

export class ImageUtils {
  static async blobToFile(blob: Blob, filename: string): Promise<File> {
    return new File([blob], filename, { type: blob.type });
  }

  static validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file.type.startsWith('image/')) return { valid: false, error: 'File must be an image' };
    if (file.size > 5 * 1024 * 1024) return { valid: false, error: 'Image size must be less than 5MB' };
    return { valid: true };
  }
}

export default StaffRegistrationAPI;
