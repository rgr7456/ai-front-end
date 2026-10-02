import Dashboard from "@/src/components/main/dashboard/Dashboard";
import { Metadata } from "next";

export default function page() {
  return (
    <div>
      <Dashboard />
    </div>
  );
}

export const metadata: Metadata = {
  title: "Dashboard",
  alternates: {
    canonical: `/dashboard`,
  },
};
