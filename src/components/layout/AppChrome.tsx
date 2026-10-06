"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/src/components/ui/Sidebar";

// Pages that should NOT show the app sidebar (auth / landing).
const NO_CHROME = ["/", "/login"];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  // Restore the collapsed/expanded preference (per browser).
  useEffect(() => {
    try {
      const v = localStorage.getItem("sidebarOpen");
      if (v !== null) setOpen(v === "1");
    } catch {}
  }, []);

  const toggle = () =>
    setOpen((o) => {
      const next = !o;
      try { localStorage.setItem("sidebarOpen", next ? "1" : "0"); } catch {}
      return next;
    });

  // No sidebar on login / landing.
  if (NO_CHROME.includes(pathname)) return <>{children}</>;

  // The Sidebar is rendered by this persistent layout, so it stays mounted
  // across page navigations (it no longer disappears when you click around).
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={open} onToggle={toggle} />
      <div className={`flex-1 transition-all duration-300 ${open ? "ml-64" : "ml-16"}`}>
        {children}
      </div>
    </div>
  );
}
