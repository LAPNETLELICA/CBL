import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type StaffRole = "store_manager" | "system_admin";
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("La clé serveur SUPABASE_SERVICE_ROLE_KEY doit être configurée pour gérer les invitations.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function authorize(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "Authentification requise." as const };
  const supabase = serviceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: "Session invalide." as const };
  const { data: profile } = await supabase.from("profiles").select("role,active").eq("id", user.id).maybeSingle();
  if (!profile?.active || profile.role !== "system_admin") return { error: "Accès réservé au system admin." as const };
  return { supabase, user };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 403 });
    const body = await request.json() as { email?: string; fullName?: string; role?: StaffRole };
    const email = body.email?.trim().toLowerCase();
    const fullName = body.fullName?.trim();
    const role = body.role;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !fullName || !["system_admin", "store_manager"].includes(role || "")) {
      return NextResponse.json({ error: "Nom, e-mail et rôle administrateur requis." }, { status: 400 });
    }
    const { data, error } = await auth.supabase.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName } });
    if (error || !data.user) return NextResponse.json({ error: error?.message || "Invitation impossible." }, { status: 400 });
    const { error: profileError } = await auth.supabase.from("profiles").update({ full_name: fullName, email, role, active: true }).eq("id", data.user.id);
    if (profileError) {
      await auth.supabase.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    await auth.supabase.from("audit_logs").insert({ actor_id: auth.user.id, action: "STAFF_INVITED", entity_type: "profile", entity_id: data.user.id, details: { email, role } });
    return NextResponse.json({ ok: true });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorize(request);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 403 });
    const { userId } = await request.json() as { userId?: string };
    if (!userId || userId === auth.user.id) return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte ici." }, { status: 400 });
    const { data: target } = await auth.supabase.from("profiles").select("id,role,email").eq("id", userId).maybeSingle();
    if (!target || !["system_admin", "store_manager"].includes(target.role)) return NextResponse.json({ error: "Compte d’équipe introuvable." }, { status: 404 });
    if (target.role === "system_admin") {
      const { count } = await auth.supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "system_admin").eq("active", true);
      if ((count || 0) <= 1) return NextResponse.json({ error: "Le dernier administrateur système ne peut pas être supprimé." }, { status: 400 });
    }
    const { error } = await auth.supabase.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await auth.supabase.from("audit_logs").insert({ actor_id: auth.user.id, action: "STAFF_REMOVED", entity_type: "profile", entity_id: userId, details: { email: target.email, role: target.role } });
    return NextResponse.json({ ok: true });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Erreur serveur." }, { status: 500 });
  }
}
