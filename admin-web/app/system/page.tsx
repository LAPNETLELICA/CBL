"use client";
import { FormEvent, useEffect, useState } from "react";
import { Activity, Database, KeyRound, LockKeyhole, Save, Truck } from "lucide-react";
import { AdminGuard } from "@/components/guard";
import { AdminShell, Head } from "@/components/shell";
import { requireSupabase } from "@/lib/supabase";

type Setting = { key: string; value: Record<string, unknown>; updated_at: string };
type Zone = { id: string; name: string; delivery_window: string; fee_fcfa: number; active: boolean };

export default function System() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const s = requireSupabase();
    const [a, b, c] = await Promise.all([
      s.from("site_settings").select("*").order("key"),
      s.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
      s.from("delivery_zones").select("*").order("display_order"),
    ]);
    setSettings((a.data || []) as Setting[]);
    setLogs((b.data || []) as Record<string, unknown>[]);
    setZones((c.data || []) as Zone[]);
  }

  useEffect(() => { void load(); }, []);

  async function saveSetting(event: FormEvent<HTMLFormElement>, key: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const value = JSON.parse(String(form.get("json") || "{}")) as Record<string, unknown>;
      const { error } = await requireSupabase().from("site_settings").upsert({ key, value });
      if (error) throw error;
      setMessage(`${key} enregistré.`);
      await load();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "JSON invalide.");
    }
  }

  async function updateZone(zone: Zone, patch: Partial<Zone>) {
    const { error } = await requireSupabase().from("delivery_zones").update(patch).eq("id", zone.id);
    setMessage(error ? error.message : "Zone mise à jour.");
    await load();
  }

  return <AdminGuard><AdminShell>
    <Head kicker="PLATFORM / SECURITY" title="Système & configuration" copy="Paramètres publics, zones de livraison, sécurité et audit global de l’application." />
    {message && <div className="error" style={{ marginBottom: 14 }}>{message}</div>}
    <section className="cards">
      <div className="card"><LockKeyhole/><strong>RLS</strong><small>politiques d’accès actives</small></div>
      <div className="card"><KeyRound/><strong>OTP</strong><small>authentification passwordless</small></div>
      <div className="card"><Database/><strong>{settings.length}</strong><small>clés CMS contrôlées</small></div>
      <div className="card"><Activity/><strong>{logs.length}</strong><small>événements d’audit chargés</small></div>
    </section>

    <section className="layout-2">
      <div className="card">
        <h2>Configuration publique</h2>
        <p className="sub">Édition JSON volontairement réservée au system admin.</p>
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {settings.map(setting => <form key={setting.key} onSubmit={event => void saveSetting(event, setting.key)} style={{ display: "grid", gap: 8 }}>
            <label style={{ fontWeight: 800 }}>{setting.key}</label>
            <textarea name="json" defaultValue={JSON.stringify(setting.value, null, 2)} style={{ minHeight: 120, borderRadius: 12, border: "1px solid #303a56", background: "#0d1220", color: "white", padding: 12, fontFamily: "monospace" }} />
            <button className="btn primary" style={{ justifySelf: "start" }}><Save size={15}/>Enregistrer</button>
          </form>)}
        </div>
      </div>

      <div className="card">
        <h2><Truck size={18} style={{ display: "inline", marginRight: 8 }}/>Zones de livraison</h2>
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {zones.map(zone => <div key={zone.id} style={{ border: "1px solid #202940", borderRadius: 14, padding: 12 }}>
            <b>{zone.name}</b><p className="sub">{zone.delivery_window}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="number" defaultValue={zone.fee_fcfa} onBlur={e => void updateZone(zone, { fee_fcfa: Number(e.currentTarget.value) })} style={{ width: 120, borderRadius: 10, border: "1px solid #303a56", background: "#0d1220", color: "white", padding: 8 }} />
              <button className="btn ghost" onClick={() => void updateZone(zone, { active: !zone.active })}>{zone.active ? "Actif" : "Inactif"}</button>
            </div>
          </div>)}
        </div>
      </div>
    </section>

    <div className="card table-wrap" style={{ marginTop: 16 }}>
      <h2>Journal d’audit</h2>
      <table className="table"><thead><tr><th>Action</th><th>Entité</th><th>Détails</th><th>Date</th></tr></thead><tbody>{logs.map((log, index) => <tr key={String(log.id ?? index)}><td>{String(log.action ?? "")}</td><td>{String(log.entity_type ?? "")}</td><td><code>{JSON.stringify(log.details ?? {})}</code></td><td>{log.created_at ? new Date(String(log.created_at)).toLocaleString("fr-FR") : "—"}</td></tr>)}</tbody></table>
    </div>
  </AdminShell></AdminGuard>;
}
