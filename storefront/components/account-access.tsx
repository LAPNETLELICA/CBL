"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Check, KeyRound, LoaderCircle, Mail, Phone, ShieldCheck } from "lucide-react";
import { requireSupabaseClient } from "@/lib/supabase/client";

type Channel = "email" | "phone";
type Stage = "request" | "verify" | "done";

export function AccountAccess({ mode = "login" }: { mode?: "login" | "signup" }) {
  const [channel, setChannel] = useState<Channel>("email");
  const [stage, setStage] = useState<Stage>("request");
  const [destination, setDestination] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const value = String(form.get(channel) ?? "").trim();
    const name = String(form.get("fullName") ?? "").trim();
    try {
      const supabase = requireSupabaseClient();
      const options = { shouldCreateUser: mode === "signup", data: { full_name: name, phone: channel === "phone" ? value : undefined } };
      const result = channel === "email"
        ? await supabase.auth.signInWithOtp({ email: value, options })
        : await supabase.auth.signInWithOtp({ phone: value, options });
      if (result.error) throw result.error;
      setDestination(value); setFullName(name); setStage("verify");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible d’envoyer le code OTP."); }
    finally { setBusy(false); }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const token = String(new FormData(event.currentTarget).get("token") ?? "").trim();
    try {
      const supabase = requireSupabaseClient();
      const result = channel === "email"
        ? await supabase.auth.verifyOtp({ email: destination, token, type: "email" })
        : await supabase.auth.verifyOtp({ phone: destination, token, type: "sms" });
      if (result.error) throw result.error;
      if (result.data.user && mode === "signup") {
        await supabase.from("profiles").update({ full_name: fullName || null, phone: channel === "phone" ? destination : null }).eq("id", result.data.user.id);
      }
      setStage("done");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Code OTP incorrect ou expiré."); }
    finally { setBusy(false); }
  }

  return <div className="page-shell grid min-h-[calc(100svh-5rem)] place-items-center pb-24 pt-36">
    <section className="glass relative w-full max-w-xl overflow-hidden rounded-[2.2rem] p-6 sm:p-10" data-reveal>
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#ffb5c8]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#8ecae6]/40 blur-3xl" />
      {stage === "request" && <>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#dff2fa]"><ShieldCheck size={24} /></span>
        <p className="eyebrow mt-7">{mode === "signup" ? "Créer votre espace" : "Espace personnel"}</p>
        <h1 className="display-type text-5xl sm:text-6xl">{mode === "signup" ? "Votre compte, en quelques secondes." : "Heureux de vous revoir."}</h1>
        <p className="mt-4 max-w-md leading-7 text-ink/60">Connexion sans mot de passe : recevez un code unique par e-mail ou SMS.</p>
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-white/55 p-1.5">
          <button type="button" onClick={() => setChannel("email")} className={`rounded-full px-4 py-3 text-sm font-bold ${channel === "email" ? "bg-[#172033] text-white" : "text-ink/60"}`}><Mail className="mr-2 inline" size={16}/>E-mail</button>
          <button type="button" onClick={() => setChannel("phone")} className={`rounded-full px-4 py-3 text-sm font-bold ${channel === "phone" ? "bg-[#172033] text-white" : "text-ink/60"}`}><Phone className="mr-2 inline" size={16}/>Téléphone</button>
        </div>
        <form onSubmit={requestOtp} className="mt-6 grid gap-4">
          {mode === "signup" && <label className="field-label">Nom complet<input className="field" name="fullName" required minLength={2} autoComplete="name" /></label>}
          {channel === "email" ? <label className="field-label">Adresse e-mail<input className="field" name="email" type="email" required autoComplete="email" /></label> : <label className="field-label">Téléphone international<input className="field" name="phone" type="tel" placeholder="+237…" required autoComplete="tel" /></label>}
          {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
          <button className="dark-button mt-1" disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" size={18}/> Envoi…</> : "Recevoir mon code OTP"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/58">{mode === "signup" ? <>Déjà inscrit ? <Link className="font-bold text-[#267fa6]" href="/connexion">Se connecter</Link></> : <>Nouveau ici ? <Link className="font-bold text-[#267fa6]" href="/inscription">Créer un compte</Link></>}</p>
      </>}
      {stage === "verify" && <>
        <p className="eyebrow">Code de sécurité</p><h1 className="display-type text-5xl">Vérifiez votre identité.</h1>
        <p className="mt-4 text-ink/60">Nous avons envoyé un code à <strong>{destination}</strong>.</p>
        <form onSubmit={verifyOtp} className="mt-7 grid gap-4">
          <label className="field-label">Code OTP<input className="field text-center text-2xl font-black tracking-[.45em]" name="token" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required autoFocus /></label>
          {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
          <button className="dark-button" disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" size={18}/> Vérification…</> : <><KeyRound size={18}/> Valider le code</>}</button>
          <button type="button" className="text-sm font-bold text-[#267fa6]" onClick={() => { setStage("request"); setError(""); }}>Changer l’adresse ou le numéro</button>
        </form>
      </>}
      {stage === "done" && <div className="py-8 text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#dff4ec] text-[#247457]"><Check size={34}/></span><h1 className="display-type mt-6 text-5xl">Bienvenue chez Christ Béni.</h1><p className="mt-4 text-ink/60">Votre session Supabase est active.</p><Link href="/profil" className="dark-button mt-7">Ouvrir mon profil</Link></div>}
    </section>
  </div>;
}
