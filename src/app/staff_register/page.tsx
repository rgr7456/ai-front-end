"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Search, Trash2, Camera, Shield, Users, Building2, RefreshCw } from 'lucide-react';
import { StaffRegistrationAPI } from '@/src/services/staffRegistrationAPI';

interface EmployeeRow {
  employee_id: string;
  employee_name: string;
  organization_id: string;
  enrollments: number;
}

export default function StaffRegisterPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await StaffRegistrationAPI.getStaffList();
    if (res.success && res.data) {
      setEmployees(res.data.employees || []);
    } else {
      setError(res.error || 'Could not load employees');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = employees.filter((e) =>
    (e.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPhotos = employees.reduce((s, e) => s + (e.enrollments || 0), 0);
  const organizations = new Set(employees.map((e) => e.organization_id)).size;

  const handleDelete = async (employeeId: string, name: string) => {
    if (!confirm(`Delete all face data for ${name || employeeId}? This cannot be undone.`)) return;
    const res = await StaffRegistrationAPI.deleteStaff(employeeId);
    if (res.success) load();
    else alert(res.error || 'Delete failed');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Registration</h1>
              <p className="text-gray-600 mt-1">Enrolled employees and their face records</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => router.push('/staff-verification')}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Shield className="h-5 w-5 mr-2" /> Verify Employee
              </button>
              <button onClick={() => router.push('/add-staff-registration')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <UserPlus className="h-5 w-5 mr-2" /> Add Employee
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search by name or employee ID..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {/* Stats (real) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard icon={Users} color="blue" label="Total Employees" value={employees.length} />
          <StatCard icon={Camera} color="purple" label="Total Face Records" value={totalPhotos} />
          <StatCard icon={Building2} color="orange" label="Organizations" value={organizations} />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Enrolled Employees</h2>
            <button onClick={load} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Face Records</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((e) => (
                  <tr key={e.employee_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{e.employee_name || '—'}</div>
                      <div className="text-xs text-gray-500 font-mono">{e.employee_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">{e.organization_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Camera className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{e.enrollments}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleDelete(e.employee_id, e.employee_name)}
                        className="text-red-600 hover:text-red-900" title="Delete face data">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try a different search.' : 'Get started by enrolling an employee.'}
              </p>
              {!searchTerm && (
                <button onClick={() => router.push('/add-staff-registration')}
                  className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <UserPlus className="h-5 w-5 mr-2" /> Add Employee
                </button>
              )}
            </div>
          )}
          {loading && <div className="text-center py-12 text-gray-500 text-sm">Loading employees…</div>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }:
  { icon: any; color: 'blue' | 'purple' | 'orange'; label: string; value: number }) {
  const ring = { blue: 'bg-blue-100', purple: 'bg-purple-100', orange: 'bg-orange-100' }[color];
  const text = { blue: 'text-blue-600', purple: 'text-purple-600', orange: 'text-orange-600' }[color];
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${ring}`}><Icon className={`h-6 w-6 ${text}`} /></div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
