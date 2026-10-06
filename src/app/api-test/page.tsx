"use client";

import { useState } from 'react';
import { StaffRegistrationAPI } from '../../services/staffRegistrationAPI';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function APITestPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<{
    connection: 'pending' | 'success' | 'error';
    message: string;
  }>({ connection: 'pending', message: 'Click test button to check API connection' });
  
  const [isLoading, setIsLoading] = useState(false);

  const testAPIConnection = async () => {
    setIsLoading(true);
    setTestResults({ connection: 'pending', message: 'Testing API connection...' });

    try {
      // Test with a simple employee list request
      const result = await StaffRegistrationAPI.getStaffList();
      
      if (result.success) {
        setTestResults({
          connection: 'success',
          message: `✅ API Connected Successfully! Backend is running at ${process.env.NEXT_PUBLIC_API_URL || 'https://ai-chat-bot-jx9w.onrender.com'}`
        });
      } else {
        setTestResults({
          connection: 'error',
          message: `❌ API Error: ${result.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      setTestResults({
        connection: 'error',
        message: `❌ Connection Failed: ${error instanceof Error ? error.message : 'Network error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">API Connection Test</h1>
        </div>

        {/* Test Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Face Recognition Backend API</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">API Endpoint</p>
                <p className="text-sm text-gray-600">{process.env.NEXT_PUBLIC_API_URL || 'https://ai-chat-bot-jx9w.onrender.com'}</p>
              </div>
              <button
                onClick={testAPIConnection}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>
            </div>

            {/* Results */}
            <div className={`p-4 rounded-lg border ${
              testResults.connection === 'success' ? 'bg-green-50 border-green-200' :
              testResults.connection === 'error' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center">
                {testResults.connection === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
                {testResults.connection === 'error' && <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                {testResults.connection === 'pending' && <div className="h-5 w-5 bg-gray-300 rounded-full mr-2"></div>}
                <p className={`text-sm ${
                  testResults.connection === 'success' ? 'text-green-800' :
                  testResults.connection === 'error' ? 'text-red-800' :
                  'text-gray-700'
                }`}>
                  {testResults.message}
                </p>
              </div>
            </div>

            {/* API Documentation */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Expected API Endpoints:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><code className="bg-blue-100 px-2 py-1 rounded">POST /register</code> - Register new employee with photos</li>
                <li><code className="bg-blue-100 px-2 py-1 rounded">POST /verify</code> - Verify employee identity</li>
                <li><code className="bg-blue-100 px-2 py-1 rounded">GET /employee</code> - Get employee list</li>
                <li><code className="bg-blue-100 px-2 py-1 rounded">DELETE /employee/:id</code> - Delete employee record</li>
              </ul>
            </div>

            {/* Backend Setup Instructions */}
            {testResults.connection === 'error' && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">🚀 Backend Setup Instructions:</h3>
                <div className="text-sm text-yellow-800 space-y-2">
                  <p>1. Make sure your FastAPI backend is running on <code>http://localhost:8000</code></p>
                  <p>2. Ensure CORS is enabled for <code>http://localhost:3000</code></p>
                  <p>3. Check that the <code>/register</code> endpoint accepts multipart form data</p>
                  <p>4. Verify the backend is accepting staff_id, staff_name, and image files</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}