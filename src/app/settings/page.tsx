import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings | Staff Management System',
  description: 'System configuration and preferences',
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
          <p className="text-gray-600">This page will contain system configuration and preferences.</p>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">System Settings</h2>
            <p className="text-gray-700">The settings page will include:</p>
            <ul className="list-disc list-inside text-gray-700 mt-2">
              <li>General system preferences</li>
              <li>User account settings</li>
              <li>Security configurations</li>
              <li>Notification settings</li>
              <li>Data backup options</li>
              <li>System maintenance tools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}