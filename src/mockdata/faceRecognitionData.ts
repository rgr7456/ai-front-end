// Mock data for Face Recognition Admin Dashboard

export interface UserData {
  id: string;
  name: string;
  email: string;
  faceId: string;
  lastSeen: string;
  status: 'active' | 'inactive' | 'blocked';
  recognitionCount: number;
  accuracy: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  recognitionsToday: number;
  systemAccuracy: number;
  failedAttempts: number;
  newRegistrations: number;
}

export interface RecentActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  status: 'success' | 'failed' | 'warning';
  location?: string;
}

export interface SystemAlert {
  id: string;
  type: 'security' | 'system' | 'user';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
}

// Mock Dashboard Statistics
export const mockDashboardStats: DashboardStats = {
  totalUsers: 1247,
  activeUsers: 892,
  recognitionsToday: 3891,
  systemAccuracy: 98.7,
  failedAttempts: 23,
  newRegistrations: 12
};

// Mock Recent Users Data
export const mockUsers: UserData[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    faceId: 'face_001',
    lastSeen: '2 minutes ago',
    status: 'active',
    recognitionCount: 45,
    accuracy: 99.2
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    faceId: 'face_002',
    lastSeen: '15 minutes ago',
    status: 'active',
    recognitionCount: 67,
    accuracy: 98.8
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    faceId: 'face_003',
    lastSeen: '1 hour ago',
    status: 'inactive',
    recognitionCount: 23,
    accuracy: 97.5
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    faceId: 'face_004',
    lastSeen: '3 hours ago',
    status: 'active',
    recognitionCount: 89,
    accuracy: 99.1
  },
  {
    id: '5',
    name: 'David Brown',
    email: 'david.brown@company.com',
    faceId: 'face_005',
    lastSeen: '5 hours ago',
    status: 'blocked',
    recognitionCount: 12,
    accuracy: 95.3
  }
];

// Mock Recent Activity Data
export const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    userId: '1',
    userName: 'John Doe',
    action: 'Face Recognition Login',
    timestamp: '2 minutes ago',
    status: 'success',
    location: 'Main Entrance'
  },
  {
    id: '2',
    userId: '2',
    userName: 'Jane Smith',
    action: 'Access Granted',
    timestamp: '5 minutes ago',
    status: 'success',
    location: 'Conference Room A'
  },
  {
    id: '3',
    userId: 'unknown',
    userName: 'Unknown User',
    action: 'Recognition Failed',
    timestamp: '8 minutes ago',
    status: 'failed',
    location: 'Side Entrance'
  },
  {
    id: '4',
    userId: '3',
    userName: 'Mike Johnson',
    action: 'Profile Updated',
    timestamp: '15 minutes ago',
    status: 'success'
  },
  {
    id: '5',
    userId: '4',
    userName: 'Sarah Wilson',
    action: 'Face Re-enrollment',
    timestamp: '22 minutes ago',
    status: 'warning',
    location: 'HR Department'
  },
  {
    id: '6',
    userId: '5',
    userName: 'David Brown',
    action: 'Access Denied - User Blocked',
    timestamp: '45 minutes ago',
    status: 'failed',
    location: 'Main Entrance'
  }
];

// Mock System Alerts
export const mockSystemAlerts: SystemAlert[] = [
  {
    id: '1',
    type: 'security',
    message: 'Multiple failed recognition attempts detected at Main Entrance',
    severity: 'high',
    timestamp: '10 minutes ago',
    resolved: false
  },
  {
    id: '2',
    type: 'system',
    message: 'Camera 3 (Conference Room B) offline',
    severity: 'medium',
    timestamp: '25 minutes ago',
    resolved: false
  },
  {
    id: '3',
    type: 'user',
    message: 'New user registration pending approval',
    severity: 'low',
    timestamp: '1 hour ago',
    resolved: true
  },
  {
    id: '4',
    type: 'system',
    message: 'System accuracy dropped below 98% threshold',
    severity: 'critical',
    timestamp: '2 hours ago',
    resolved: false
  }
];

// Navigation items for face recognition admin
export const faceRecognitionNavItems = [
  {
    label: "User Management",
    icon: "Users",
    href: "/users",
    description: "Manage registered users and face profiles"
  },
  {
    label: "Face Database",
    icon: "Database",
    href: "/faces",
    description: "View and manage face encodings"
  },
  {
    label: "Recognition Logs",
    icon: "Activity",
    href: "/logs",
    description: "Access recognition history and analytics"
  },
  {
    label: "Camera Systems",
    icon: "Camera",
    href: "/cameras",
    description: "Monitor and configure camera feeds"
  },
  {
    label: "Security Alerts",
    icon: "Shield",
    href: "/alerts",
    description: "View security alerts and incidents"
  },
  {
    label: "System Settings",
    icon: "Settings",
    href: "/settings",
    description: "Configure system parameters"
  }
];

// Quick action items
export const quickActions = [
  {
    label: "Add New User",
    icon: "UserPlus",
    href: "/users/add",
    color: "blue"
  },
  {
    label: "Enroll Face",
    icon: "ScanFace",
    href: "/faces/enroll",
    color: "green"
  },
  {
    label: "View Alerts",
    icon: "AlertTriangle",
    href: "/alerts",
    color: "red"
  },
  {
    label: "System Reports",
    icon: "FileText",
    href: "/reports",
    color: "purple"
  }
];