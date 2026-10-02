"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/src/store";
import { loggedIn } from "@/src/store/slices/authSlice";
import Cookies from "js-cookie";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = () => {
      const token = Cookies.get("steelkartSession");
      
      if (token && !auth.isAuthenticated) {
        // Restore session from cookie
        const mockUser = {
          id: "1",
          name: "Administrator",
          email: "admin@example.com"
        };
        dispatch(loggedIn({ user: mockUser, token }));
      } else if (!token && !auth.isAuthenticated) {
        // No session, redirect to login
        router.push("/login");
        return;
      }
      
      setIsInitialized(true);
    };

    checkSession();
  }, [dispatch, router]); // Removed auth.isAuthenticated from dependency array

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #e2e8f0',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <p style={{ color: '#64748b' }}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after initialization, don't render protected content
  if (!auth.isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#64748b' }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}