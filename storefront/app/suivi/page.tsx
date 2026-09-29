import type { Metadata } from "next";
import { OrderTracking } from "@/components/order-tracking";

export const metadata: Metadata = { title: "Suivre ma commande", description: "Suivez votre commande Christ Béni Layette, de la confirmation à la livraison." };

export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ commande?: string }> }) {
  const params = await searchParams;
  return <main><OrderTracking initialOrderNumber={params.commande} /></main>;
}
