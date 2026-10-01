import type { Metadata } from "next";
import { CatalogExplorer } from "@/components/catalog-explorer";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Découvrez la sélection Christ Béni Layette et filtrez les essentiels par âge, taille, couleur et disponibilité.",
};

export default async function CataloguePage({ searchParams }: { searchParams: Promise<{ rayon?: string; disponible?: string }> }) {
  const params = await searchParams;
  const category = params.rayon;
  return <main><CatalogExplorer initialCategory={category} availableOnly={params.disponible === "oui"} /></main>;
}
