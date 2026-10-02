import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Staff Attendance | Staff Management System',
  description: 'Track and manage staff attendance',
}

export default function StaffAttendancePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Staff Attendance</h1>
          <p className="text-gray-600">This page will contain attendance tracking and management features.</p>
          
          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Features</h2>
            <p className="text-green-700">The attendance system will include:</p>
            <ul className="list-disc list-inside text-green-700 mt-2">
              <li>Daily attendance marking</li>
              <li>Check-in/Check-out times</li>
              <li>Attendance history and reports</li>
              <li>Late arrival tracking</li>
              <li>Leave management</li>
              <li>Attendance analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}