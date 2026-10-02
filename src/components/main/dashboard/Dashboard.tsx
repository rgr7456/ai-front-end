"use client";

import { Button, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/src/store";
import { loggedOut } from "@/src/store/slices/authSlice";
import Cookies from "js-cookie";
import { 
  Users, 
  UserPlus,
  Clock,
  Shield,
  Settings,
  BarChart3,
  Calendar,
  FileText,
  Eye,
  CheckCircle,
  AlertTriangle,
  Activity,
  MoreVertical,
  Menu
} from "lucide-react";
import Sidebar from "../../ui/Sidebar";

export default function Dashboard() {
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const handleLogout = () => {
    Cookies.remove("steelkartSession");
    dispatch(loggedOut());
    router.push("/login");
  };

  // Staff Management Data
  const staffStats = {
    totalStaff: 247,
    presentToday: 198,
    absentToday: 49,
    newRegistrations: 12
  };

  const moreMenuItems = [
    { title: "API Test", href: "/api-test" },
    { title: "Export Data", href: "/export" },
    { title: "Import Data", href: "/import" },
    { title: "System Logs", href: "/logs" },
    { title: "Backup", href: "/backup" },
    { title: "Help & Support", href: "/help" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 mr-4"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Staff Management System</h1>
                  <p className="text-sm text-gray-600">Welcome back, Administrator</p>
                </div>
              </div>
              
              {/* Three Dots Menu in Header */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-2 z-50">
                    {moreMenuItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          router.push(item.href);
                          setShowMoreMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        {item.title}
                      </button>
                    ))}
                    <hr className="my-2" />
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMoreMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{staffStats.totalStaff}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="text-2xl font-bold text-gray-900">{staffStats.presentToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Absent Today</p>
                <p className="text-2xl font-bold text-gray-900">{staffStats.absentToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <UserPlus className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">{staffStats.newRegistrations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Main Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Staff Registration Card */}
            <div
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => router.push("/staff_register")}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-blue-50">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">Staff Registration</h3>
                </div>
                <p className="text-gray-600 text-sm">Register new staff members with complete details</p>
              </div>
            </div>

            {/* Staff Attendance Card */}
            <div
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => router.push("/staff_attendance")}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-green-50">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">Staff Attendance</h3>
                </div>
                <p className="text-gray-600 text-sm">Track and manage staff attendance records</p>
              </div>
            </div>

            {/* Admin Creation Card */}
            <div
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => router.push("/admin_creation")}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-purple-50">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">Admin Creation</h3>
                </div>
                <p className="text-gray-600 text-sm">Create and manage administrator accounts</p>
              </div>
            </div>

            {/* Staff Management Card */}
            <div
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => router.push("/staff_management")}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-orange-50">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">Staff Management</h3>
                </div>
                <p className="text-gray-600 text-sm">View and manage all staff members</p>
              </div>
            </div>

            {/* Reports Card */}
            <div
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => router.push("/reports")}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-indigo-50">
                    <BarChart3 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">Reports</h3>
                </div>
                <p className="text-gray-600 text-sm">Generate attendance and staff reports</p>
              </div>
            </div>

            {/* Settings Card */}
            <div
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => router.push("/settings")}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <Settings className="h-6 w-6 text-gray-600" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">Settings</h3>
                </div>
                <p className="text-gray-600 text-sm">System configuration and preferences</p>
              </div>
            </div>

          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              
              <div
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => router.push("/staff_register")}
              >
                <div className="flex items-center">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  <span className="ml-3 text-sm font-medium text-gray-900">Add New Staff</span>
                </div>
              </div>

              <div
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => router.push("/staff_attendance")}
              >
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="ml-3 text-sm font-medium text-gray-900">Mark Attendance</span>
                </div>
              </div>

              <div
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => router.push("/reports")}
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="ml-3 text-sm font-medium text-gray-900">View Reports</span>
                </div>
              </div>

              <div
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => router.push("/settings")}
              >
                <div className="flex items-center">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <span className="ml-3 text-sm font-medium text-gray-900">System Settings</span>
                </div>
              </div>

            </div>
          </div>

          {/* Today's Summary */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Today's Summary</h2>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Present Staff</span>
                        <span className="text-sm font-medium text-green-600">{staffStats.presentToday}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Absent Staff</span>
                        <span className="text-sm font-medium text-red-600">{staffStats.absentToday}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Attendance Rate</span>
                        <span className="text-sm font-medium text-blue-600">
                          {Math.round((staffStats.presentToday / staffStats.totalStaff) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-gray-600">John Doe checked in at 9:00 AM</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-gray-600">New staff member registered</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                        <span className="text-gray-600">Sarah Wilson marked absent</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
