import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { StoreProvider } from "@/components/store-provider";
import { SmoothExperience } from "@/components/smooth-experience";
import { CartDrawer } from "@/components/cart-drawer";
import { VisitorAnalytics } from "@/components/visitor-analytics";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: { default: "Christ Béni Layette", template: "%s | Christ Béni Layette" },
  description: "Vêtements, soin et accessoires pour bébé, choisis avec tendresse.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E8F1F5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
        <StoreProvider>
          <SmoothExperience />
          <VisitorAnalytics />
          <Navigation />
          {children}
          <Footer />
          <CartDrawer />
        </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
