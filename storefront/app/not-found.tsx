import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell grid min-h-screen place-items-center py-32 text-center">
      <div><p className="eyebrow justify-center before:hidden">Page introuvable</p><h1 className="display-type text-7xl">Ce petit chemin s’arrête ici.</h1><p className="mt-5 text-ink/58">Revenez à la boutique pour poursuivre votre visite.</p><Link href="/" className="dark-button mt-7">Retour à l’accueil</Link></div>
    </main>
  );
}
