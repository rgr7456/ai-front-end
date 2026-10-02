import Login from "@/src/components/main/login/Login";
import { Metadata } from "next";

export default function LoginPage() {
  return <Login />;
}

export const metadata: Metadata = {
  title: "Login - Face Recognition Admin",
  description: "Sign in to Face Recognition Administration System",
};