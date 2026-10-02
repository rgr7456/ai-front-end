"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { Button, Text } from "@radix-ui/themes";
import { m } from "framer-motion";
import { LucideUser, LucideEdit, LucideSave, LucideX } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  lastLogin: string;
}

export default function Account() {
  const auth = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: auth.user?.name || "Administrator",
    email: auth.user?.email || "admin@example.com",
    role: "System Administrator",
    department: "IT Security",
    lastLogin: "2024-10-24 14:30:00"
  });

  const handleSave = () => {
    // Here you would typically save to your API
    console.log("Saving profile:", profile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset changes
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <LucideUser className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <Text size="6" weight="bold" className="text-slate-800">
                  Account Settings
                </Text>
                <Text size="3" className="text-slate-600">
                  Manage your profile and preferences
                </Text>
              </div>
            </div>
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="!cursor-pointer"
                >
                  <LucideEdit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleSave}
                    className="!cursor-pointer bg-green-600 hover:bg-green-700"
                  >
                    <LucideSave className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button 
                    onClick={handleCancel}
                    className="!cursor-pointer bg-gray-600 hover:bg-gray-700"
                  >
                    <LucideX className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={profile.role}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Last Login
              </label>
              <input
                type="text"
                value={profile.lastLogin}
                disabled
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
              />
            </div>
          </div>

          {/* Security Section */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <Text size="5" weight="bold" className="text-slate-800 mb-4">
              Security Settings
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="!cursor-pointer">
                Change Password
              </Button>
              <Button className="!cursor-pointer bg-orange-600 hover:bg-orange-700">
                Two-Factor Authentication
              </Button>
            </div>
          </div>
        </m.div>
      </div>
    </div>
  );
}