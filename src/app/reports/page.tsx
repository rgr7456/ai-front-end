import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reports | Staff Management System',
  description: 'Generate attendance and staff reports',
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
          <p className="text-gray-600">This page will contain various reports and analytics.</p>
          
          <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
            <h2 className="text-lg font-semibold text-indigo-800 mb-2">Available Reports</h2>
            <p className="text-indigo-700">The reporting system will include:</p>
            <ul className="list-disc list-inside text-indigo-700 mt-2">
              <li>Daily/Weekly/Monthly attendance reports</li>
              <li>Staff performance analytics</li>
              <li>Department-wise reports</li>
              <li>Leave and absence reports</li>
              <li>Payroll preparation reports</li>
              <li>Custom report generation</li>
              <li>Export to PDF/Excel formats</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}