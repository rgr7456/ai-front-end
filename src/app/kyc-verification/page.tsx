"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, UploadCloud, FileText, Loader2, CheckCircle, XCircle,
  ShieldCheck, ShieldAlert, Image as ImageIcon,
} from "lucide-react";
import KycOcrAPI, { DocType, ExtractResult } from "@/src/services/kycOcrAPI";

type Mode = "" | DocType; // "" = auto-detect

const DOC_OPTIONS: { value: Mode; label: string }[] = [
  { value: "", label: "Auto-detect" },
  { value: "pan", label: "PAN card" },
  { value: "aadhaar", label: "Aadhaar" },
  { value: "bank", label: "Bank (cheque / passbook)" },
];

// Fields to show per document type, in order: [label, key].
const FIELD_LABELS: Record<string, [string, string][]> = {
  PAN: [
    ["PAN Number", "pan_number"],
    ["Name", "name"],
    ["Father's Name", "father_name"],
    ["Date of Birth", "date_of_birth"],
  ],
  AADHAAR: [
    ["Aadhaar Number", "aadhaar_number_masked"],
    ["Aadhaar Number", "aadhaar_number"],
    ["Name", "name"],
    ["Date of Birth", "date_of_birth"],
    ["Gender", "gender"],
  ],
  BANK: [
    ["Account Number", "account_number"],
    ["IFSC", "ifsc"],
    ["Bank Name", "bank_name"],
    ["Account Holder", "account_holder_name"],
  ],
};

export default function KycVerificationPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onPick(f: File | null) {
    setResult(null);
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file (JPG or PNG).");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError("Image must be smaller than 8 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function extract() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await KycOcrAPI.extract(file, mode || undefined);
    setLoading(false);
    if (res.success && res.data) setResult(res.data);
    else setError(res.error || res.message);
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const fields = result ? (FIELD_LABELS[result.fields.document_type] || []) : [];
  const confPct = result ? Math.round(result.mean_confidence * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-1">
        <FileText className="h-6 w-6 text-indigo-600" />
        <h1 className="text-2xl font-semibold text-gray-900">KYC Document OCR</h1>
      </div>
      <p className="text-gray-500 mb-6">
        Upload a PAN, Aadhaar, or bank document to extract its details. Aadhaar
        numbers are masked for privacy.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ---- Left: upload + controls ---- */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document type
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="w-full mb-4 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {DOC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onPick(e.dataTransfer.files?.[0] || null);
            }}
            className="cursor-pointer border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition overflow-hidden"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="document preview" className="h-full w-full object-contain" />
            ) : (
              <>
                <UploadCloud className="h-10 w-10 mb-2" />
                <span className="text-sm">Click or drag an image here</span>
                <span className="text-xs mt-1">JPG / PNG, up to 8 MB</span>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] || null)}
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={extract}
              disabled={!file || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {loading ? "Extracting…" : "Extract details"}
            </button>
            {(file || result) && (
              <button
                onClick={reset}
                className="px-4 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ---- Right: results ---- */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 min-h-[20rem]">
          {!result && !error && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <FileText className="h-10 w-10 mb-2" />
              <span className="text-sm">Extracted details will appear here</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 text-red-600 bg-red-50 rounded-lg p-4">
              <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Could not extract</p>
                <p className="text-sm text-red-500">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  {result.fields.document_type}
                  {result.auto_detected && <span className="text-xs text-indigo-400">(auto)</span>}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    confPct >= 80 ? "bg-green-100 text-green-700"
                    : confPct >= 50 ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                  }`}
                >
                  {confPct}% confidence
                </span>
              </div>

              {/* Aadhaar checksum badge */}
              {result.fields.document_type === "AADHAAR" && (
                <div
                  className={`flex items-center gap-2 text-sm mb-4 px-3 py-2 rounded-lg ${
                    (result.fields as any).checksum_valid
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {(result.fields as any).checksum_valid ? (
                    <><ShieldCheck className="h-4 w-4" /> Verhoeff checksum valid</>
                  ) : (
                    <><ShieldAlert className="h-4 w-4" /> Checksum not valid — recheck the number</>
                  )}
                </div>
              )}

              <dl className="divide-y divide-gray-100">
                {fields
                  .filter(([, key]) => (result.fields as any)[key] !== undefined)
                  .map(([label, key]) => {
                    const val = (result.fields as any)[key];
                    return (
                      <div key={key} className="flex justify-between py-2.5 gap-4">
                        <dt className="text-sm text-gray-500">{label}</dt>
                        <dd className="text-sm font-medium text-gray-900 text-right break-all">
                          {val ?? <span className="text-gray-300">—</span>}
                        </dd>
                      </div>
                    );
                  })}
              </dl>

              <details className="mt-4">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                  Raw OCR lines ({result.raw_lines.length})
                </summary>
                <pre className="mt-2 text-xs bg-gray-50 rounded-lg p-3 text-gray-600 whitespace-pre-wrap">
                  {result.raw_lines.join("\n")}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
