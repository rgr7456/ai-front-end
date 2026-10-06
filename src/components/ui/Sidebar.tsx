"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  FileText,
  ScanLine,
  User,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Home
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleLogout = () => {
    Cookies.remove("steelkartSession");
    dispatch(loggedOut());
    router.push("/login");
  };

  const navigationItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard"
    },
    { 
      title: "Employee Registration", 
      icon: UserPlus, 
      href: "/staff_register"
    },
    { 
      title: "Employee Attendance", 
      icon: Clock, 
      href: "/staff_attendance"
    },
    { 
      title: "Admin Creation", 
      icon: Shield, 
      href: "/admin_creation"
    },
    {
      title: "Employee Management",
      icon: Users,
      href: "/staff_management"
    },
    {
      title: "KYC Documents",
      icon: ScanLine,
      href: "/kyc-verification"
    },
    {
      title: "Reports",
      icon: BarChart3, 
      href: "/reports"
    }
  ];

  const moreMenuItems = [
    { title: "Settings", icon: Settings, href: "/settings" },
    { title: "Help", icon: FileText, href: "/help" },
    { title: "About", icon: FileText, href: "/about" }
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-50 ${isOpen ? 'w-64' : 'w-16'}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className={`${isOpen ? 'block' : 'hidden'}`}>
            <h2 className="text-lg font-bold text-gray-900">Employee System</h2>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="w-4 h-4 border-2 border-gray-600 rounded"></div>
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.title}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className={`ml-3 ${isOpen ? 'block' : 'hidden'}`}>
                {item.title}
              </span>
            </button>
          ))}

          {/* Three Dots Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-full flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <MoreVertical className="h-5 w-5" />
              <span className={`ml-3 ${isOpen ? 'block' : 'hidden'}`}>
                More
              </span>
            </button>
            
            {showMoreMenu && (
              <div className={`${isOpen ? 'relative' : 'absolute left-16 top-0'} mt-2 bg-white border rounded-lg shadow-lg py-2 min-w-[200px]`}>
                {moreMenuItems.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => {
                      router.push(item.href);
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="ml-3">{item.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Account Section at Bottom */}
      <div className="border-t p-4">
        <div className="space-y-2">
          <button
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <div className="flex items-center">
              <User className="h-5 w-5" />
              <span className={`ml-3 ${isOpen ? 'block' : 'hidden'}`}>
                Account
              </span>
            </div>
            {isOpen && (
              isAccountOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isAccountOpen && (
            <div className={`${isOpen ? 'space-y-1' : 'absolute left-16 bottom-16 bg-white border rounded-lg shadow-lg py-2 min-w-[200px]'}`}>
              <button
                onClick={() => router.push("/account")}
                className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <User className="h-4 w-4" />
                <span className="ml-3">Profile</span>
              </button>
              <button
                onClick={() => router.push("/settings")}
                className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="h-4 w-4" />
                <span className="ml-3">Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <span className="ml-7">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}