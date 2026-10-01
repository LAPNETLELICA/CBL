import type { Metadata } from "next";
import { AccountAccess } from "@/components/account-access";
export const metadata: Metadata = { title: "Créer un compte", description: "Créez votre compte Christ Béni." };
export default function SignupPage(){ return <main><AccountAccess mode="signup" /></main>; }
