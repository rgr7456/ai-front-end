"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { loggedOut } from "@/src/store/slices/authSlice";
import Cookies from "js-cookie";
import {
  Users,
  UserPlus,
  Clock,
  Shield,
  Settings,
  BarChart3,
  Camera,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  MoreVertical,
} from "lucide-react";
import { StaffRegistrationAPI } from "@/src/services/staffRegistrationAPI";

// Static class strings so Tailwind keeps them (dynamic `bg-${x}` would be purged).
const COLORS: Record<string, { ring: string; soft: string; text: string }> = {
  blue:   { ring: "bg-blue-100",   soft: "bg-blue-50",   text: "text-blue-600" },
  green:  { ring: "bg-green-100",  soft: "bg-green-50",  text: "text-green-600" },
  purple: { ring: "bg-purple-100", soft: "bg-purple-50", text: "text-purple-600" },
  orange: { ring: "bg-orange-100", soft: "bg-orange-50", text: "text-orange-600" },
  indigo: { ring: "bg-indigo-100", soft: "bg-indigo-50", text: "text-indigo-600" },
  gray:   { ring: "bg-gray-100",   soft: "bg-gray-50",   text: "text-gray-600" },
};

interface RecentItem {
  employee_name: string | null;
  verified: boolean | null;
  cosine: number | null;
  reason: string | null;
  created_at: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const [stats, setStats] = useState({ totalEmployees: 0, faceRecords: 0, organizations: 0 });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const res = await StaffRegistrationAPI.getStaffList();
    if (res.success && res.data) {
      const emps = res.data.employees || [];
      const faceRecords = emps.reduce((s: number, e: any) => s + (e.enrollments || 0), 0);
      const orgs = new Set(emps.map((e: any) => e.organization_id)).size;
      setStats({ totalEmployees: res.data.count || emps.length, faceRecords, organizations: orgs });
    } else {
      setError(res.error || "Could not reach the face service");
    }
    const rec = await StaffRegistrationAPI.getRecentVerifications(8);
    if (rec.success && rec.data) setRecent(rec.data.items || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleLogout = () => {
    Cookies.remove("steelkartSession");
    dispatch(loggedOut());
    router.push("/login");
  };

  const avgPhotos = stats.totalEmployees > 0 ? (stats.faceRecords / stats.totalEmployees).toFixed(1) : "0";

  const statCards = [
    { label: "Total Employees", value: stats.totalEmployees, icon: Users, color: "blue" },
    { label: "Face Records", value: stats.faceRecords, icon: Camera, color: "green" },
    { label: "Organizations", value: stats.organizations, icon: Building2, color: "purple" },
    { label: "Avg Photos / Employee", value: avgPhotos, icon: BarChart3, color: "orange" },
  ];

  const features = [
    { title: "Employee Registration", desc: "Register new employees with face photos", icon: UserPlus, color: "blue", href: "/staff_register" },
    { title: "Employee Attendance", desc: "Track and manage attendance records", icon: Clock, color: "green", href: "/staff_attendance" },
    { title: "Admin Creation", desc: "Create and manage administrator accounts", icon: Shield, color: "purple", href: "/admin_creation" },
    { title: "Employee Management", desc: "View and manage all employees", icon: Users, color: "orange", href: "/staff_management" },
    { title: "Reports", desc: "Generate attendance and employee reports", icon: BarChart3, color: "indigo", href: "/reports" },
    { title: "Settings", desc: "System configuration and preferences", icon: Settings, color: "gray", href: "/settings" },
  ];

  const timeAgo = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Management System</h1>
              <p className="text-sm text-gray-600">Welcome back, Administrator</p>
            </div>
            <div className="relative">
              <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 rounded-lg hover:bg-gray-100">
                <MoreVertical className="h-5 w-5" />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-2 z-50">
                  <button onClick={() => { router.push("/api-test"); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">API Test</button>
                  <button onClick={() => { loadData(); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">Refresh Data</button>
                  <hr className="my-2" />
                  <button onClick={() => { handleLogout(); setShowMoreMenu(false); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error} — is the face service running on {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}?
          </div>
        )}

        {/* Stats Cards (real data) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((c) => (
            <div key={c.label} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${COLORS[c.color].ring}`}>
                  <c.icon className={`h-6 w-6 ${COLORS[c.color].text}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? "…" : c.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Features */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Main Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} onClick={() => router.push(f.href)}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${COLORS[f.color].soft}`}>
                      <f.icon className={`h-6 w-6 ${COLORS[f.color].text}`} />
                    </div>
                    <h3 className="ml-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <ActionRow icon={UserPlus} label="Add New Employee" onClick={() => router.push("/add-staff-registration")} />
              <ActionRow icon={CheckCircle} label="Verify Employee" onClick={() => router.push("/staff-verification")} />
              <ActionRow icon={FileText} label="View Reports" onClick={() => router.push("/reports")} />
              <ActionRow icon={Settings} label="System Settings" onClick={() => router.push("/settings")} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Verifications</h2>
              <button onClick={loadData} className="text-sm text-blue-600 hover:underline">Refresh</button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                {loading ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : recent.length === 0 ? (
                  <p className="text-sm text-gray-500">No verification activity yet. Verifications will appear here.</p>
                ) : (
                  <div className="space-y-3">
                    {recent.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          {r.verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mr-3" />
                          )}
                          <span className="text-gray-700">
                            {r.verified
                              ? `${r.employee_name || "Employee"} verified`
                              : `Verification failed${r.reason ? ` (${r.reason})` : ""}`}
                            {r.verified && r.cosine != null && (
                              <span className="text-gray-400"> · {Math.round(r.cosine * 100)}%</span>
                            )}
                          </span>
                        </div>
                        <span className="text-gray-400">{timeAgo(r.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionRow({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="flex items-center">
        <Icon className="h-5 w-5 text-blue-600" />
        <span className="ml-3 text-sm font-medium text-gray-900">{label}</span>
      </div>
    </div>
  );
}
