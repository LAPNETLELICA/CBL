"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle } from "lucide-react";
import { requireSupabase } from "@/lib/supabase";

export function Login() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");

    const supabase = requireSupabase();

    let email = identifier.trim();

    if (!email.includes("@")) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("full_name", email)
        .eq("role", "system_admin")
        .eq("active", true)
        .maybeSingle();

      if (profileError || !profile?.email) {
        setError("Nom administrateur ou e-mail introuvable.");
        setBusy(false);
        return;
      }

      email = profile.email;
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    console.log("SUPABASE LOGIN:", {
      user: authData?.user?.email,
      userId: authData?.user?.id,
      error: authError?.message,
      errorCode: authError?.code,
      status: authError?.status,
    });

    if (authError || !authData.user) {
      setError("Identifiant ou mot de passe incorrect.");
      setBusy(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", authData.user.id)
      .single();

    if (profile?.role !== "system_admin" || !profile.active) {
      await supabase.auth.signOut();
      setError("Ce compte n’a pas les droits d’accès à l’administration.");
      setBusy(false);
      return;
    }

    setBusy(false);
    router.replace("/");
  }

  async function forgotPassword() {
    setError("");

    const email = identifier.trim();

    if (!email.includes("@")) {
      setError(
        "Pour réinitialiser le mot de passe, saisissez d’abord votre adresse e-mail."
      );
      return;
    }

    setBusy(true);

    const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3002/reset-password",
    });

    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setError("Un lien de réinitialisation a été envoyé à votre adresse e-mail.");
  }

  return (
    <main className="login">
      <div className="grid-glow" />

      <section className="login-box">
        <Image
          src="/brand/christ-beni-logo.jpg"
          width={92}
          height={92}
          alt="Christ Béni"
        />

        <p className="mono">SYSTEM CONTROL / SECURE ACCESS</p>

        <h1>Administration de la plateforme.</h1>

        <p className="sub">
          Utilisateurs, rôles, catalogue, commandes, configuration et audit.
        </p>

        <form onSubmit={login}>
          <label>
            Nom ou e-mail administrateur
            <input
              name="identifier"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </label>

          <label>
            Mot de passe
            <input
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button className="btn primary" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" />
            ) : (
              <>
                <KeyRound size={17} />
                Se connecter
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          className="btn"
          onClick={forgotPassword}
          disabled={busy}
          style={{ marginTop: 10 }}
        >
          Mot de passe oublié ?
        </button>
      </section>
    </main>
  );
}