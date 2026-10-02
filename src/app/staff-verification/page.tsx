"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StaffRegistrationAPI } from "../../services/staffRegistrationAPI";
import {
  Camera,
  X,
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";

interface VerificationResult {
  success: boolean;
  staff_id?: string;
  staff_name?: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  confidence?: number;
}

export default function StaffVerificationPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<{
    dataUrl: string;
    blob: Blob;
  } | null>(null);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);

  // Notification
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
    show: boolean;
  }>({ type: "info", message: "", show: false });

  const showNotification = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Start Camera
  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported on this browser.");
      }

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        
        // Wait a moment and check if video is ready
        setTimeout(() => {
          if (videoRef.current && videoRef.current.videoWidth > 0) {
            setIsVideoReady(true);
            showNotification("success", "Camera ready for verification!");
          } else {
            setIsVideoReady(false);
            showNotification("info", "Camera started. Use refresh button if video appears blank.");
          }
        }, 1000);
      }

      setStream(mediaStream);
      setIsCameraOn(true);
    } catch (error) {
      console.error(error);
      showNotification("error", "Unable to start camera. Please try again.");
    }
  }, [stream]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOn(false);
    setIsVideoReady(false);
    setCapturedImage(null); // Clear captured image when stopping camera
  }, [stream]);

  // Capture Image
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isVideoReady) {
      showNotification("error", "Camera not ready. Please wait for video to load.");
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Unable to access canvas context');
      }

      // Use video dimensions or fallback
      let videoWidth = video.videoWidth || 640;
      let videoHeight = video.videoHeight || 480;

      if (videoWidth === 0 || videoHeight === 0) {
        const rect = video.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          videoWidth = Math.floor(rect.width);
          videoHeight = Math.floor(rect.height);
        }
      }

      // Set canvas dimensions
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Draw video frame to canvas (mirrored)
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.scale(-1, 1); // Mirror the image
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();

      // Get image data
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
        throw new Error('Failed to capture image data from video');
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image file'));
          }
        }, 'image/jpeg', 0.8);
      });

      // Store captured image
      setCapturedImage({ dataUrl, blob });
      showNotification("success", "Image captured! Click 'Verify Face' to check identity.");

    } catch (error) {
      console.error('Capture error:', error);
      showNotification("error", "Failed to capture image. Please try again.");
    }
  }, [isVideoReady]);



  // Verify Face using captured image
  const verifyFace = useCallback(async () => {
    if (!capturedImage) {
      showNotification("error", "Please capture an image first.");
      return;
    }

    try {
      setIsVerifying(true);
      showNotification("info", "Verifying face...");

      const result = await StaffRegistrationAPI.verifyStaff("", capturedImage.blob);

      if (result.success && result.data) {
        setVerificationResult({ success: true, ...result.data });
        showNotification(
          "success",
          `Staff verified: ${result.data.staff_name || "Unknown"}`
        );
      } else {
        setVerificationResult({ success: false });
        showNotification("error", "No matching staff found.");
      }
    } catch (err) {
      console.error("Verification Error:", err);
      showNotification("error", "Verification failed. Try again.");
    } finally {
      setIsVerifying(false);
    }
  }, [capturedImage]);

  const resetVerification = () => {
    setVerificationResult(null);
    showNotification("info", "Ready for new verification");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm w-full rounded-lg shadow-lg p-4 ${
            notification.type === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : notification.type === "error"
              ? "bg-red-100 border border-red-400 text-red-700"
              : "bg-blue-100 border border-blue-400 text-blue-700"
          }`}
        >
          <div className="flex items-center">
            {notification.type === "success" && (
              <CheckCircle className="h-5 w-5 mr-2" />
            )}
            {notification.type === "error" && (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Staff Face Verification
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Camera</h2>
            
            {/* Instructions */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700">
                <p className="font-medium">Verification Steps:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Start Camera</li>
                  <li>Position your face clearly in frame</li>
                  <li>Click "Capture Image" to take a photo</li>
                  <li>Review your captured image</li>
                  <li>Click "Verify Face" to identify yourself</li>
                </ol>
              </div>
            </div>

            {!isCameraOn ? (
              <button
                onClick={startCamera}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Camera className="h-5 w-5 mr-2" />
                Start Camera
              </button>
            ) : (
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={captureImage}
                  disabled={!isVideoReady}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Capture Image
                </button>
                <button
                  onClick={verifyFace}
                  disabled={isVerifying || !capturedImage}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Verify Face
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (videoRef.current && videoRef.current.srcObject) {
                      const stream = videoRef.current.srcObject as MediaStream;
                      videoRef.current.srcObject = null;
                      videoRef.current.srcObject = stream;
                      videoRef.current.play();
                      showNotification('info', 'Video refreshed - ready for verification');
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  title="Refresh video if blank"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
                <button
                  onClick={stopCamera}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <X className="h-5 w-5 mr-2" />
                  Stop
                </button>
              </div>
            )}

            {isCameraOn ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs ${
                  isVideoReady ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                }`}>
                  {isVideoReady ? '● Live' : '⏳ Loading'}
                </div>
                
                {/* Refresh Button - shows when video is not ready */}
                {!isVideoReady && (
                  <button
                    onClick={() => {
                      if (videoRef.current && stream) {
                        console.log('Manual video refresh...');
                        const video = videoRef.current;
                        video.srcObject = null;
                        video.srcObject = stream;
                        video.load();
                        video.play().then(() => {
                          console.log('Manual play successful');
                          setTimeout(() => {
                            if (video.videoWidth > 0) {
                              setIsVideoReady(true);
                              showNotification('success', 'Camera manually refreshed!');
                            } else {
                              showNotification('info', 'Still loading - please wait or try again');
                            }
                          }, 1000);
                        }).catch((err) => {
                          console.error('Play failed:', err);
                          showNotification('error', 'Unable to start video playback');
                        });
                      } else {
                        showNotification('error', 'Camera stream not found');
                      }
                    }}
                    className="absolute bottom-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-700 shadow-lg"
                  >
                    🔄 Refresh Video
                  </button>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-100 rounded-lg">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">
                  Camera is not active. Click “Start Camera”.
                </p>
              </div>
            )}
            
            {/* Captured Image Display */}
            {capturedImage && (
              <div className="mt-6">
                <h3 className="text-md font-semibold mb-3">Captured Image</h3>
                <div className="relative">
                  <img
                    src={capturedImage.dataUrl}
                    alt="Captured for verification"
                    className="w-full h-48 bg-gray-100 rounded-lg object-cover border-2 border-green-200"
                  />
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                    ✓ Ready for Verification
                  </div>
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      showNotification('info', 'Image cleared. Capture a new one.');
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs hover:bg-red-600"
                  >
                    ✕ Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Verification Results</h2>

            {!verificationResult ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                No verification yet.
              </div>
            ) : verificationResult.success ? (
              <div>
                <div className="flex items-center text-green-600 mb-4">
                  <CheckCircle className="h-6 w-6 mr-2" />
                  <span className="font-semibold">Staff Verified!</span>
                </div>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Name:</strong> {verificationResult.staff_name}
                  </p>
                  <p>
                    <strong>ID:</strong> {verificationResult.staff_id}
                  </p>
                  <p>
                    <strong>Department:</strong> {verificationResult.department}
                  </p>
                  <p>
                    <strong>Email:</strong> {verificationResult.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {verificationResult.phone}
                  </p>
                  {verificationResult.confidence && (
                    <p>
                      <strong>Confidence:</strong>{" "}
                      {Math.round(verificationResult.confidence * 100)}%
                    </p>
                  )}
                </div>
                <button
                  onClick={resetVerification}
                  className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Verify Another Staff
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
                <p className="text-red-600 font-medium">No Staff Found</p>
                <button
                  onClick={resetVerification}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push("/add-staff-registration")}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Register New Staff
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
