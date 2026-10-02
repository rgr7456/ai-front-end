import Account from "@/src/components/main/account/Account";
import { Metadata } from "next";

export default function AccountPage() {
  return <Account />;
}

export const metadata: Metadata = {
  title: "Account - Face Recognition Admin",
  description: "Manage your account settings and profile",
};