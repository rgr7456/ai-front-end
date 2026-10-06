"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StaffRegistrationAPI, ORG_ID, generateUuid, isUuid } from '../../services/staffRegistrationAPI';
import { 
  Camera, 
  X, 
  Check, 
  ArrowLeft, 
  Trash2,
  AlertCircle,
  Upload
} from 'lucide-react';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  blob: Blob;
}

export default function AddStaffRegistrationPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);   // stream kept in a ref so re-renders never stop it
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);   // client-only (avoids SSR window/navigator access)

  useEffect(() => { setMounted(true); }, []);
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    show: boolean;
  }>({ type: 'info', message: '', show: false });
  
  // Form data — employee UUID + name + organization UUID for the backend
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    organizationId: ORG_ID,
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Show notification helper
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Camera functions
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        showNotification('error', 'Camera not supported in this browser (use HTTPS or localhost).');
        return;
      }
      // Stop any existing stream first.
      streamRef.current?.getTracks().forEach(track => track.stop());

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsCameraOn(true);           // the <video> mounts now; the effect below attaches the stream
      showNotification('info', 'Camera starting…');
    } catch (error: any) {
      const name = error?.name;
      if (name === 'NotAllowedError') showNotification('error', 'Camera denied. Allow it in the address bar and retry.');
      else if (name === 'NotFoundError') showNotification('error', 'No camera found.');
      else if (name === 'NotReadableError') showNotification('error', 'Camera is in use by another app. Close it and retry.');
      else showNotification('error', 'Camera access failed.');
      setIsCameraOn(false);
      setIsVideoReady(false);
    }
  };

  // Attach the stream to the video once it is mounted (after isCameraOn flips true).
  useEffect(() => {
    if (isCameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraOn]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
    setIsCameraOn(false);
    setIsVideoReady(false);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      showNotification('error', 'Camera not ready. Please start camera first.');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is playing
    if (video.readyState < 2) {
      showNotification('error', 'Video is still loading. Please wait a moment and try again.');
      return;
    }
    
    // If video dimensions are still 0, try using default dimensions
    let videoWidth = video.videoWidth || 640;
    let videoHeight = video.videoHeight || 480;
    
    if (videoWidth === 0 || videoHeight === 0) {
      console.log('Video dimensions are 0, trying to capture anyway with default size');
      // Try to get dimensions from the video element's display size
      const rect = video.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        videoWidth = Math.floor(rect.width);
        videoHeight = Math.floor(rect.height);
      }
    }
    
    const context = canvas.getContext('2d');
    if (!context) {
      showNotification('error', 'Unable to access canvas context.');
      return;
    }
    
    try {
      // Set canvas dimensions
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Clear canvas first
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw video frame to canvas (flip horizontally for natural selfie view)
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();
      
      // Get data URL first
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
        throw new Error('Failed to generate image data');
      }
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) {
          const newPhoto: CapturedPhoto = {
            id: Date.now().toString(),
            dataUrl,
            blob
          };
          
          setCapturedPhotos(prev => [...prev, newPhoto]);
          showNotification('success', `Photo ${capturedPhotos.length + 1} captured successfully!`);
        } else {
          showNotification('error', 'Failed to create image file. Please try again.');
        }
      }, 'image/jpeg', 0.8);
      
    } catch (error) {
      console.error('Capture error:', error);
      showNotification('error', `Capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [capturedPhotos.length]);

  const deletePhoto = (photoId: string) => {
    setCapturedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID (UUID) is required';
    } else if (!isUuid(formData.employeeId)) {
      newErrors.employeeId = 'Employee ID must be a valid UUID';
    }

    if (!formData.employeeName.trim()) {
      newErrors.employeeName = 'Employee name is required';
    }

    if (!formData.organizationId.trim() || !isUuid(formData.organizationId)) {
      newErrors.organizationId = 'Organization ID must be a valid UUID';
    }

    if (capturedPhotos.length < 5) {
      newErrors.photos = 'Minimum 5 photos are required';
    }
    
    if (capturedPhotos.length > 10) {
      newErrors.photos = 'Maximum 10 photos allowed';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (capturedPhotos.length < 5) {
      showNotification('error', 'Please capture at least 5 photos before registering.');
      return;
    }
    
    setIsSubmitting(true);
    showNotification('info', 'Submitting registration data...');
    
    try {
      // Prepare data for API
      const registrationData = {
        employee_id: formData.employeeId,
        employee_name: formData.employeeName,
        organization_id: formData.organizationId,
        images: capturedPhotos.map(photo => photo.blob)
      };

      // Use the API service
      const result = await StaffRegistrationAPI.registerStaff(registrationData);

      if (result.success) {
        showNotification('success', result.message);
        // Stop camera before navigation
        stopCamera();
        // Delay navigation to show success message
        setTimeout(() => {
          router.push('/staff_register');
        }, 2000);
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showNotification('error', `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup camera on unmount
  // Stop the camera only when the page unmounts (not on every state change).
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full rounded-lg shadow-lg p-4 ${
          notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
          'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' && <Check className="h-5 w-5 mr-2" />}
            {notification.type === 'error' && <X className="h-5 w-5 mr-2" />}
            {notification.type === 'info' && <AlertCircle className="h-5 w-5 mr-2" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add New Employee Registration</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID (UUID) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                      errors.employeeId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Paste HRMS employee UUID"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, employeeId: generateUuid() }))}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-200 whitespace-nowrap"
                    title="Generate a UUID (for testing)"
                  >
                    Generate
                  </button>
                </div>
                {errors.employeeId && (
                  <p className="text-red-500 text-sm mt-1">{errors.employeeId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.employeeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.employeeName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.employeeName && (
                  <p className="text-red-500 text-sm mt-1">{errors.employeeName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization ID (UUID) *
                </label>
                <input
                  type="text"
                  value={formData.organizationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizationId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                    errors.organizationId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Organization UUID"
                />
                {errors.organizationId && (
                  <p className="text-red-500 text-sm mt-1">{errors.organizationId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Camera Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Face Recognition Photos</h2>
            
            {/* Debug Info */}
            {mounted && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Browser Support:</span>
                  <div className="text-xs text-gray-600">
                    <div>MediaDevices: {navigator.mediaDevices ? '✅' : '❌'}</div>
                    <div>getUserMedia: {typeof navigator.mediaDevices?.getUserMedia === 'function' ? '✅' : '❌'}</div>
                    <div>Protocol: {window.location.protocol}</div>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Camera Status:</span>
                  <div className="text-xs text-gray-600">
                    <div>Stream: {stream ? '✅ Active' : '❌ None'}</div>
                    <div>Video Element: {videoRef.current ? '✅ Ready' : '❌ None'}</div>
                    <div>Camera On: {isCameraOn ? '✅ Yes' : '❌ No'}</div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Camera Controls */}
            <div className="mb-4">
              {!isCameraOn ? (
                <div className="space-y-2">
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Start Camera
                  </button>
                  
                  {/* Troubleshooting tips */}
                  <div className="text-sm text-gray-600">
                    <p>📝 Tips if camera won't start:</p>
                    <ul className="list-disc list-inside ml-2 text-xs">
                      <li>Allow camera permissions when prompted</li>
                      <li>Close other camera apps (Zoom, Teams, etc.)</li>
                      <li>Try refreshing the page</li>
                      <li>Use Chrome or Edge browser</li>
                      {mounted && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && (
                        <li className="text-red-600">⚠️ Use HTTPS or localhost for camera access</li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <span className={`font-medium ${isVideoReady ? 'text-green-600' : 'text-yellow-600'}`}>
                      {isVideoReady ? '✅ Camera Ready' : '⏳ Camera Loading...'}
                    </span>
                    {videoRef.current && (
                      <span className="text-sm text-gray-600">
                        Resolution: {videoRef.current.videoWidth || 0}x{videoRef.current.videoHeight || 0}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={stopCamera}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Stop Camera
                  </button>
                </div>
              )}
            </div>

            {/* Photo Requirements */}
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Photo Requirements:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Minimum 5 photos required, maximum 10 photos</li>
                    <li>Look directly at the camera</li>
                    <li>Take photos from different angles</li>
                    <li>Ensure good lighting</li>
                    <li>No glasses or hats if possible</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Camera Preview */}
            {isCameraOn && (
              <div className="mb-4">
                <div className="relative mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    controls={false}
                    className="w-full h-64 bg-gray-900 rounded-lg object-cover border-2 border-gray-200"
                    style={{ transform: 'scaleX(-1)' }}
                    onLoadedMetadata={() => {
                      console.log('Video metadata loaded event');
                      if (videoRef.current) {
                        const video = videoRef.current;
                        console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
                        if (video.videoWidth > 0 && video.videoHeight > 0) {
                          setIsVideoReady(true);
                          showNotification('success', 'Camera ready!');
                        }
                      }
                    }}
                    onCanPlay={() => {
                      console.log('Video can play event');
                      if (videoRef.current && videoRef.current.videoWidth > 0) {
                        setIsVideoReady(true);
                        showNotification('success', 'Camera ready!');
                      }
                    }}
                  />
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs ${
                    isVideoReady ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                  }`}>
                    {isVideoReady ? '● Live' : '⏳ Loading'}
                  </div>
                  
                  {/* Manual refresh button */}
                  {!isVideoReady && (
                    <button
                      onClick={() => {
                        if (videoRef.current && stream) {
                          console.log('Manual video refresh');
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
                              }
                            }, 1000);
                          }).catch(console.error);
                        }
                      }}
                      className="absolute bottom-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      🔄 Refresh Video
                    </button>
                  )}
                </div>
                
                {/* Troubleshooting for stuck video */}
                {isCameraOn && !isVideoReady && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-700 text-sm mb-2">
                      Camera is taking longer than expected to load.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          stopCamera();
                          setTimeout(startCamera, 1000);
                        }}
                        className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                      >
                        🔄 Restart Camera
                      </button>
                      <button
                        onClick={() => {
                          setIsVideoReady(true);
                          showNotification('info', 'Capture enabled manually. Try taking a photo now.');
                        }}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        ⚡ Force Enable Capture
                      </button>
                      <button
                        onClick={() => {
                          // Try to force capture even with 0x0
                          if (videoRef.current && canvasRef.current && stream) {
                            const video = videoRef.current;
                            const canvas = canvasRef.current;
                            const context = canvas.getContext('2d');
                            
                            if (context) {
                              // Use fixed dimensions if video dimensions are 0
                              const width = video.videoWidth || 640;
                              const height = video.videoHeight || 480;
                              
                              canvas.width = width;
                              canvas.height = height;
                              
                              try {
                                context.drawImage(video, 0, 0, width, height);
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                
                                if (dataUrl && dataUrl !== 'data:,') {
                                  canvas.toBlob((blob) => {
                                    if (blob) {
                                      const newPhoto = {
                                        id: Date.now().toString(),
                                        dataUrl,
                                        blob
                                      };
                                      setCapturedPhotos(prev => [...prev, newPhoto]);
                                      showNotification('success', 'Test photo captured!');
                                    }
                                  }, 'image/jpeg', 0.8);
                                } else {
                                  showNotification('error', 'Test capture failed - no video data');
                                }
                              } catch (e) {
                                showNotification('error', 'Test capture error: ' + (e as Error).message);
                              }
                            }
                          }
                        }}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        📸 Test Capture
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Capture Button - Make it prominent */}
                <div className="flex justify-center mb-4">
                  <button
                    onClick={capturePhoto}
                    disabled={capturedPhotos.length >= 10 || !isVideoReady}
                    className={`inline-flex items-center px-6 py-3 rounded-lg text-lg font-medium shadow-lg ${
                      !isVideoReady 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:bg-gray-400`}
                  >
                    <Camera className="h-6 w-6 mr-2" />
                    {!isVideoReady ? '⏳ Video Loading...' : '📸 Capture Photo'} ({capturedPhotos.length}/10)
                  </button>
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* Camera Status */}
            {!isCameraOn && (
              <div className="mb-4 p-4 bg-gray-100 rounded-lg text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Camera is not active. Click "Start Camera" to begin.</p>
              </div>
            )}

            {/* Error Message */}
            {errors.photos && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <p className="text-red-700 text-sm">{errors.photos}</p>
              </div>
            )}

            {/* Captured Photos */}
            {capturedPhotos.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Captured Photos ({capturedPhotos.length})
                  </h3>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    capturedPhotos.length >= 5 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {capturedPhotos.length >= 5 ? 'Ready to Register' : `Need ${5 - capturedPhotos.length} more`}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {capturedPhotos.map((photo, index) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.dataUrl}
                        alt={`Captured photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                      />
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Photos Message */}
            {capturedPhotos.length === 0 && isCameraOn && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
                <Upload className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-blue-700 font-medium">No photos captured yet</p>
                <p className="text-blue-600 text-sm">Click "Capture Photo" to start taking pictures</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || capturedPhotos.length < 5}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Registering...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Register Employee
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}