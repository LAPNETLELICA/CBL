"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { Check, KeyRound, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { requireSupabaseClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function AccountAccess({ mode = "login" }: { mode?: Mode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const submittingRef = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();

    try {
      const supabase = requireSupabaseClient();
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (authError) throw authError;
        if (!data.user) throw new Error("La création du compte n’a pas été confirmée. Réessayez plus tard.");
        if (data.user.identities && data.user.identities.length === 0) {
          setError("Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe.");
          return;
        }
        if (!data.session) {
          setAwaitingConfirmation(true);
          setComplete(true);
          return;
        }
        setAwaitingConfirmation(false);
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      }
      setComplete(true);
    } catch (cause) {
      const code = typeof cause === "object" && cause !== null && "code" in cause ? String(cause.code) : "";
      const message = cause instanceof Error ? cause.message : "";
      const rateLimited = code === "over_email_send_rate_limit" || /rate limit|too many requests/i.test(message);
      const invalidEmail = code === "email_address_invalid" || /email address.*invalid|invalid.*email/i.test(message);
      const weakPassword = code === "weak_password" || /password.*(weak|short|least)/i.test(message);
      setError(rateLimited ? "Trop de tentatives récentes. Veuillez patienter quelques minutes avant de réessayer." : invalidEmail ? "Vérifiez que l’adresse e-mail est complète et valide." : weakPassword ? "Le mot de passe est trop faible. Utilisez au moins 8 caractères." : message || "Impossible d’ouvrir votre compte. Vérifiez vos informations et réessayez.");
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    setBusy(true);
    setError("");
    try {
      const supabase = requireSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/profil` },
      });
      if (authError) throw authError;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La connexion Google est indisponible. Réessayez.");
      setBusy(false);
    }
  }

  return <div className="page-shell grid min-h-[calc(100svh-5rem)] place-items-center pb-24 pt-36">
    <section className="glass relative w-full max-w-xl overflow-hidden rounded-[2.2rem] p-6 sm:p-10" data-reveal>
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#ffb5c8]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#8ecae6]/40 blur-3xl" />
      {complete ? <div className="py-8 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#dff4ec] text-[#247457]"><Check size={34} /></span>
        <h1 className="display-type mt-6 text-5xl">{awaitingConfirmation ? "Vérifiez votre e-mail." : "Bienvenue chez Christ Béni."}</h1>
        <p className="mt-4 text-ink/60">{awaitingConfirmation ? "Votre compte a été créé. La confirmation e-mail est requise avant la connexion." : "Vous êtes connecté."}</p>
        {!awaitingConfirmation && <Link href="/profil" className="dark-button mt-7">Ouvrir mon profil</Link>}
      </div> : <>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#dff2fa]"><ShieldCheck size={24} /></span>
        <p className="eyebrow mt-7">{mode === "signup" ? "Créer votre espace" : "Espace personnel"}</p>
        <h1 className="display-type text-5xl sm:text-6xl">{mode === "signup" ? "Créez votre espace Christ Béni." : "Heureux de vous revoir."}</h1>
        <p className="mt-4 max-w-md leading-7 text-ink/60">{mode === "signup" ? "Créez votre compte pour enregistrer vos favoris, retrouver vos commandes et finaliser vos achats plus facilement." : "Connectez-vous avec votre adresse e-mail, ou continuez avec Google."}</p>

        <button type="button" onClick={() => void continueWithGoogle()} disabled={busy} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white/75 px-5 py-3 font-bold text-ink transition hover:bg-white disabled:opacity-60">
          <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full border border-ink/10 font-black text-[#4285f4]">G</span>
          Continuer avec Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-ink/40"><span className="h-px flex-1 bg-ink/10" />Ou avec votre e-mail<span className="h-px flex-1 bg-ink/10" /></div>
        <form onSubmit={submit} className="grid gap-4">
          {mode === "signup" && <label className="field-label">Nom complet<input className="field" name="fullName" required minLength={2} autoComplete="name" /></label>}
          <label className="field-label">Adresse e-mail<input className="field" name="email" type="email" required autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} /></label>
          <label className="field-label">Mot de passe<input className="field" name="password" type="password" required minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
          {mode === "signup" && <p className="text-sm leading-6 text-ink/55">Choisissez au moins 8 caractères. Aucun code ne sera envoyé si la confirmation e-mail est désactivée.</p>}
          {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
          <button className="dark-button mt-1" disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" size={18} /> Patientez…</> : mode === "signup" ? <><Mail size={17} /> Créer mon compte</> : <><KeyRound size={17} /> Me connecter</>}</button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/58">{mode === "signup" ? <>Déjà inscrit ? <Link className="font-bold text-[#267fa6]" href="/connexion">Se connecter</Link></> : <>Nouveau ici ? <Link className="font-bold text-[#267fa6]" href="/inscription">Créer un compte</Link></>}</p>
      </>}
    </section>
  </div>;
}
