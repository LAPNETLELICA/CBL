import type { Metadata } from "next";
import { AccountAccess } from "@/components/account-access";

export const metadata: Metadata = { title: "Mon compte", description: "Accédez à votre espace Christ Béni Layette en toute sécurité." };

export default function AccountPage() {
  return <main><AccountAccess /></main>;
}
