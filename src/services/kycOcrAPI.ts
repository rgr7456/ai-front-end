// API service for KYC document OCR (HRMS face service /ocr/* endpoints).
//
// Backend endpoints (see project_face-recognition):
//   POST /ocr/extract   image + optional doc_type (pan|aadhaar|bank) -> structured fields
//   POST /ocr/read      image -> every detected text line + confidence
//
// Like the face endpoints, every call is tenant-scoped via X-Tenant-Id.
// OCR-only: the backend extracts and returns fields; business validation and
// persistence happen on the HRMS side. Aadhaar numbers come back masked.

import { TENANT_ID, ACTOR_ID } from './staffRegistrationAPI';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function authHeaders(): Record<string, string> {
  return { 'X-Tenant-Id': TENANT_ID, 'X-Actor-Id': ACTOR_ID };
}

export type DocType = 'pan' | 'aadhaar' | 'bank';

// Field shapes per document (all values may be null if OCR missed them).
export interface PanFields {
  document_type: 'PAN';
  pan_number: string | null;
  name: string | null;
  father_name: string | null;
  date_of_birth: string | null;
}
export interface AadhaarFields {
  document_type: 'AADHAAR';
  name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  checksum_valid: boolean;
  aadhaar_number_masked?: string | null; // when masking is on (default)
  aadhaar_number?: string | null;        // only when backend masking is off
}
export interface BankFields {
  document_type: 'BANK';
  account_number: string | null;
  ifsc: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
}
export type DocFields = PanFields | AadhaarFields | BankFields;

export interface ExtractResult {
  doc_type: DocType;
  auto_detected: boolean;
  fields: DocFields;
  mean_confidence: number;
  raw_lines: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function errorText(body: any): string {
  const d = body?.detail;
  if (typeof d === 'string') return d;
  if (d) return JSON.stringify(d);
  return 'Unknown error';
}

export class KycOcrAPI {
  /** Extract structured fields from a KYC document image. */
  static async extract(image: File | Blob, docType?: DocType): Promise<ApiResponse<ExtractResult>> {
    try {
      const formData = new FormData();
      if (image instanceof File) formData.append('image', image);
      else formData.append('image', image, 'document.jpg');
      if (docType) formData.append('doc_type', docType);

      const res = await fetch(`${API_BASE_URL}/ocr/extract`, {
        method: 'POST',
        headers: authHeaders(), // let the browser set the multipart boundary
        body: formData,
      });
      const body = await parseJson(res);
      if (res.ok) return { success: true, message: 'Extracted', data: body };
      return { success: false, message: 'Extraction failed', error: errorText(body) };
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /** Generic OCR: all detected text lines + confidence (no document parsing). */
  static async read(image: File | Blob): Promise<ApiResponse<{ lines: { text: string; confidence: number }[]; text: string; mean_confidence: number }>> {
    try {
      const formData = new FormData();
      if (image instanceof File) formData.append('image', image);
      else formData.append('image', image, 'document.jpg');

      const res = await fetch(`${API_BASE_URL}/ocr/read`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      const body = await parseJson(res);
      if (res.ok) return { success: true, message: 'ok', data: body };
      return { success: false, message: 'OCR failed', error: errorText(body) };
    } catch (error) {
      return {
        success: false,
        message: 'Network error',
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}

export default KycOcrAPI;
