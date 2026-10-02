// Mock staff data file

export interface Staff {
  id: number;
  staffName: string;
  branch: string;
  images: number;
  mobile: string;
  email: string;
}

export const mockStaffData: Staff[] = [
  {
    id: 1,
    staffName: "John Doe",
    branch: "Hyderabad",
    images: 3,
    mobile: "9876543210",
    email: "john@example.com",
  },
  {
    id: 2,
    staffName: "Ravi Kumar",
    branch: "Bangalore",
    images: 2,
    mobile: "9998887776",
    email: "ravi@example.com",
  },
  {
    id: 3,
    staffName: "Sita Devi",
    branch: "Chennai",
    images: 4,
    mobile: "9123456780",
    email: "sita@example.com",
  },
];
