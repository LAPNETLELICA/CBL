"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle } from "lucide-react";
import { requireSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = requireSupabase();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setBusy(true);

    const { error } = await requireSupabase().auth.updateUser({
      password,
    });

    setBusy(false);

    if (error) {
      setError("Le mot de passe n’a pas pu être modifié. Vérifiez le lien reçu et réessayez.");
      return;
    }

    setMessage("Mot de passe modifié avec succès.");

    setTimeout(() => {
      router.replace("/login");
    }, 1500);
  }

  return (
    <main className="login">
      <div className="grid-glow" />

      <section className="login-box">
        <KeyRound size={42} />

        <p className="mono">SYSTEM CONTROL / PASSWORD</p>

        <h1>Créer votre mot de passe</h1>

        <p className="sub">
          Définissez le mot de passe de votre compte administrateur.
        </p>

        {!ready ? (
          <div className="error">
            Session de récupération en cours...
            <br />
            Utilisez le lien reçu par e-mail pour définir votre mot de passe.
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>
              Nouveau mot de passe
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>

            <label>
              Confirmer le mot de passe
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                minLength={8}
                required
              />
            </label>

            {error && <div className="error">{error}</div>}

            {message && (
              <div className="success">
                {message}
              </div>
            )}

            <button className="btn primary" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" />
              ) : (
                <>
                  <KeyRound size={17} />
                  Enregistrer le mot de passe
                </>
              )}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
