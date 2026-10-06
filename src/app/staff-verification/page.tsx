"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StaffRegistrationAPI, isUuid } from "@/src/services/staffRegistrationAPI";
import {
  Camera, X, ArrowLeft, CheckCircle, XCircle, User, ShieldCheck, RefreshCw, AlertTriangle,
} from "lucide-react";

type Phase = "idle" | "running" | "verifying" | "done";

interface Result {
  success: boolean;
  employee_id?: string;
  employee_name?: string;
  organization_id?: string;
  cosine?: number;
  passive_score?: number | null;
  active_passed?: boolean;
  errorTitle?: string;
  errorDetail?: string;
}

const BURST_FRAMES = 12;
const FRAME_INTERVAL = 300;

// Map backend error codes -> friendly on-screen messages.
function mapError(code: string): { title: string; detail: string } {
  const c = (code || "").toLowerCase();
  if (c.startsWith("invalid_uuid")) return { title: "Invalid Employee ID", detail: "The Employee ID must be a valid UUID." };
  if (c.includes("employee_not_found")) return { title: "Employee Not Found", detail: "No enrolled face found for this Employee ID." };
  if (c.includes("active_liveness_failed") || c.includes("passive_liveness") || c.includes("liveness_failed"))
    return { title: "Liveness Check Failed", detail: "Could not confirm a live person. Follow the on-screen instruction and avoid photos/screens." };
  if (c.includes("no_face_detected")) return { title: "No Face Detected", detail: "Keep your face clearly in the frame and try again." };
  if (c.includes("face_not_matched")) return { title: "Face Does Not Match", detail: "The captured face does not match this Employee ID." };
  if (c.includes("no_frames")) return { title: "No Frames Captured", detail: "Camera did not capture frames. Try again." };
  return { title: "Verification Failed", detail: code || "Please try again." };
}

export default function EmployeeVerificationPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [prompt, setPrompt] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string; show: boolean }>(
    { type: "info", message: "", show: false }
  );
  const notify = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message, show: true });
    setTimeout(() => setNotification((p) => ({ ...p, show: false })), 4000);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return notify("error", "Camera not supported in this browser.");
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
      });
      streamRef.current = media;
      setIsCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        try { await videoRef.current.play(); } catch {}
      }
    } catch (e: any) {
      const n = e?.name;
      if (n === "NotAllowedError") notify("error", "Camera permission denied.");
      else if (n === "NotReadableError") notify("error", "Camera is in use by another app.");
      else notify("error", "Unable to start camera.");
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
    setIsVideoReady(false);
    setPhase("idle");
    setProgress(0);
  };

  const captureFrame = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const video = videoRef.current, canvas = canvasRef.current;
      if (!video || !canvas) return resolve(null);
      const w = video.videoWidth || 640, h = video.videoHeight || 480;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.save(); ctx.scale(-1, 1); ctx.drawImage(video, -w, 0, w, h); ctx.restore();
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.8);
    });

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runVerification = async () => {
    // Validate Employee ID first.
    if (!employeeId.trim()) return notify("error", "Enter an Employee ID first.");
    if (!isUuid(employeeId)) {
      setResult({ success: false, ...{ errorTitle: "Invalid Employee ID", errorDetail: "The Employee ID must be a valid UUID." } });
      setPhase("done");
      return;
    }
    if (!isCameraOn) return notify("error", "Start the camera first.");
    if (!isVideoReady || (videoRef.current?.videoWidth || 0) === 0) return notify("error", "Camera still loading — wait a moment.");

    setResult(null);
    setPhase("running");
    setProgress(0);

    // 1) Challenge
    const ch = await StaffRegistrationAPI.startLivenessChallenge();
    if (!ch.success || !ch.data) {
      setPhase("idle");
      return notify("error", ch.error || "Could not start liveness challenge.");
    }

    const frames: Blob[] = [];
    const FRONTAL = 5;                       // frames while facing the camera
    const TURN = BURST_FRAMES;               // frames while turning
    const total = FRONTAL + TURN;
    let done = 0;
    const grab = async () => {
      const b = await captureFrame();
      if (b) frames.push(b);
      done += 1;
      setProgress(Math.round((done / total) * 100));
      await sleep(FRAME_INTERVAL);
    };

    // 2a) Hold still, capture frontal frames.
    setPrompt("Look straight at the camera…");
    await sleep(700);
    for (let i = 0; i < FRONTAL; i++) await grab();

    // 2b) Perform the head turn, capture turned frames.
    setPrompt(ch.data.prompt);
    notify("info", ch.data.prompt);
    for (let i = 0; i < TURN; i++) await grab();

    // 3) Verify against THIS employee id only
    setPhase("verifying");
    const res = await StaffRegistrationAPI.verifyEmployee(employeeId.trim(), ch.data.challenge_id, frames);
    if (res.success && res.data) {
      setResult({ success: true, ...res.data });
      notify("success", `Verified: ${res.data.employee_name || "Employee"}`);
    } else {
      const m = mapError(res.error || "");
      setResult({ success: false, errorTitle: m.title, errorDetail: m.detail });
      notify("error", m.title);
    }
    setPhase("done");
  };

  const reset = () => { setResult(null); setPhase("idle"); setProgress(0); setPrompt(""); };

  const busy = phase === "running" || phase === "verifying";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full rounded-lg shadow-lg p-4 ${
          notification.type === "success" ? "bg-green-100 border border-green-400 text-green-700"
          : notification.type === "error" ? "bg-red-100 border border-red-400 text-red-700"
          : "bg-blue-100 border border-blue-400 text-blue-700"}`}>
          <div className="flex items-center">
            {notification.type === "success" && <CheckCircle className="h-5 w-5 mr-2" />}
            {notification.type === "error" && <XCircle className="h-5 w-5 mr-2" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
            <ArrowLeft className="h-5 w-5 mr-1" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShieldCheck className="h-6 w-6 mr-2 text-green-600" /> Employee Verification
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Employee ID + camera */}
          <div className="bg-white rounded-lg shadow p-6">
            {/* Step 1: Employee ID */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID (UUID) *</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter the employee's UUID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm mb-4"
            />

            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-medium">Flow:</p>
              <p className="mt-1">Employee ID → Start Camera → Liveness Check → Face Match (only against this employee).</p>
            </div>

            <div className="flex space-x-2 mb-4">
              {!isCameraOn ? (
                <button onClick={startCamera}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Camera className="h-5 w-5 mr-2" /> Start Camera
                </button>
              ) : (
                <>
                  <button onClick={runVerification} disabled={busy || !isVideoReady || !employeeId.trim()}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    {phase === "running" ? "Follow the prompt…" : phase === "verifying" ? "Verifying…" : "Start Verification"}
                  </button>
                  <button onClick={stopCamera} disabled={busy}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300">
                    <X className="h-5 w-5 mr-2" /> Stop
                  </button>
                </>
              )}
            </div>

            <div className="relative">
              <video ref={videoRef} autoPlay playsInline muted
                onLoadedMetadata={() => setIsVideoReady(true)} onCanPlay={() => setIsVideoReady(true)}
                className={`w-full h-72 bg-gray-900 rounded-lg object-cover ${isCameraOn ? "" : "hidden"}`}
                style={{ transform: "scaleX(-1)" }} />

              {isCameraOn && (
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs ${isVideoReady ? "bg-green-500 text-white" : "bg-yellow-500 text-black"}`}>
                  {isVideoReady ? "● Live" : "⏳ Loading"}
                </div>
              )}
              {phase === "running" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-lg">
                  <div className="text-white text-xl font-bold text-center px-6">{prompt}</div>
                  <div className="w-2/3 h-2 bg-white/30 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-green-400 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
              {phase === "verifying" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                  <div className="text-white font-medium flex items-center">
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" /> Checking liveness & identity…
                  </div>
                </div>
              )}
              {!isCameraOn && (
                <div className="h-72 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
                  <Camera className="h-12 w-12 text-gray-400 mb-2" /> Camera is off. Click “Start Camera”.
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          {/* Right: Result */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Result</h2>
            {!result ? (
              <div className="text-center py-10 text-gray-500">
                <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                Enter an Employee ID and run the verification.
              </div>
            ) : result.success ? (
              <div>
                <div className="flex items-center text-green-600 mb-4">
                  <CheckCircle className="h-6 w-6 mr-2" />
                  <span className="font-semibold">Verification Successful</span>
                </div>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Name:</strong> {result.employee_name}</p>
                  <p className="break-all"><strong>Employee ID:</strong> {result.employee_id}</p>
                  <p className="break-all"><strong>Organization ID:</strong> {result.organization_id}</p>
                  <p>
                    <strong>Liveness:</strong>{" "}
                    {result.active_passed
                      ? <span className="text-green-600 font-medium">✅ Live person confirmed (head-turn)</span>
                      : "—"}
                  </p>
                  {typeof result.cosine === "number" && <p><strong>Match confidence:</strong> {Math.round(result.cosine * 100)}%</p>}
                  {result.passive_score != null && (
                    <p className="text-xs text-gray-400 pt-1">
                      Passive anti-spoof (experimental, advisory): {Math.round(result.passive_score * 100)}% —
                      not used to block; the head-turn check is the liveness gate.
                    </p>
                  )}
                </div>
                <button onClick={reset} className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Verify Again</button>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <p className="text-red-600 font-semibold text-lg">{result.errorTitle}</p>
                <p className="text-sm text-gray-600 mt-2">{result.errorDetail}</p>
                <button onClick={reset} className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
