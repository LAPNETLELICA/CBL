"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, LoaderCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { deliveryAreas, formatFcfa } from "@/lib/catalog";
import { useStore } from "@/components/store-provider";
import { requireSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";

type DrawerStep = "cart" | "checkout" | "success";

type OrderResponse = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentRedirectUrl?: string | null;
  paymentMessage?: string | null;
};


export function CartDrawer() {
  const { lines, subtotal, cartOpen, setCartOpen, setQuantity, clearCart } = useStore();
  const { user } = useAuth();
  const [step, setStep] = useState<DrawerStep>("cart");
  const [deliveryArea, setDeliveryArea] = useState<string>(deliveryAreas[0].name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResponse | null>(null);

  const selectedArea = useMemo(
    () => deliveryAreas.find((area) => area.name === deliveryArea) ?? deliveryAreas[0],
    [deliveryArea],
  );
  const total = subtotal + selectedArea.fee;

  useEffect(() => {
    if (!cartOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [cartOpen, setCartOpen]);

  const close = () => {
    setCartOpen(false);
    if (step === "success") {
      setTimeout(() => {
        setStep("cart");
        setOrder(null);
      }, 220);
    }
  };

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lines.length || busy) return;
    if (!user) { window.location.href = "/connexion"; return; }
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const supabase = requireSupabaseClient();
      const items = lines.map((line) => {
        if (line.product.id.startsWith("fallback-")) throw new Error("Cet article ne peut pas être commandé en ligne pour le moment. Actualisez la page et réessayez.");
        return { product_id: line.product.id, quantity: line.quantity };
      });
      const { data, error: rpcError } = await supabase.rpc("create_order", {
        p_customer_name: String(user.user_metadata.full_name || user.email || "Client"),
        p_customer_email: String(user.email || ""),
        p_contact_phone: String(form.get("contactPhone") ?? ""),
        p_shipping_address: String(form.get("shippingAddress") ?? ""),
        p_delivery_area: deliveryArea,
        p_payment_method: String(form.get("paymentMethod") ?? "CASH_ON_DELIVERY"),
        p_items: items,
      });
      if (rpcError) throw rpcError;
      if (!data) throw new Error("La commande n’a pas pu être créée.");
      setOrder(data as OrderResponse);
      clearCart();
      setStep("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur inattendue s’est produite.");
    } finally {
      setBusy(false);
    }
  }

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Panier">
      <button type="button" className="absolute inset-0 cursor-default bg-[#0a1626]/48 backdrop-blur-sm" onClick={close} aria-label="Fermer le panier" />
      <section className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-hidden border-l border-white/35 bg-[#f3f8fa]/92 shadow-2xl backdrop-blur-2xl">
        <header className="flex items-center justify-between border-b border-ink/8 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            {step === "checkout" && (
              <button type="button" className="icon-button" onClick={() => setStep("cart")} aria-label="Retour au panier"><ChevronLeft size={19} /></button>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">{step === "success" ? "C’est noté" : step === "checkout" ? "Finaliser" : "Votre sélection"}</p>
              <h2 className="text-2xl font-bold">{step === "success" ? "Commande reçue" : step === "checkout" ? "Livraison & paiement" : "Panier"}</h2>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={close} aria-label="Fermer"><X size={20} /></button>
        </header>

        {step === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              {lines.length === 0 ? (
                <div className="grid min-h-[55vh] place-items-center text-center">
                  <div>
                    <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/80 shadow-glass"><ShoppingBag size={28} strokeWidth={1.5} /></span>
                    <h3 className="display-type mt-6 text-4xl">Votre panier est léger.</h3>
                    <p className="mx-auto mt-3 max-w-xs text-ink/58">Ajoutez les essentiels qui vous plaisent, ils apparaîtront ici.</p>
                    <Link href="/catalogue" className="dark-button mt-7" onClick={close}>Découvrir le catalogue</Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {lines.map(({ product, quantity }) => (
                    <article key={product.id} className="grid grid-cols-[5.5rem_1fr] gap-4 rounded-[1.35rem] border border-white/70 bg-white/58 p-3">
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
                        {product.image.startsWith("http") ? (
                          <img src={product.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <Image src={product.image} alt="" fill sizes="88px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold leading-tight">{product.name}</h3>
                            <p className="mt-1 text-sm text-ink/52">{product.size} · {product.color}</p>
                          </div>
                          <button type="button" onClick={() => setQuantity(product.id, 0)} className="text-ink/35 hover:text-[#c13d66]" aria-label={`Retirer ${product.name}`}><Trash2 size={17} /></button>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-ink/10 bg-white/70 p-1">
                            <button type="button" className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#e5f2f7]" onClick={() => setQuantity(product.id, quantity - 1)} aria-label="Diminuer la quantité"><Minus size={14} /></button>
                            <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                            <button type="button" className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#e5f2f7]" onClick={() => setQuantity(product.id, quantity + 1)} aria-label="Augmenter la quantité"><Plus size={14} /></button>
                          </div>
                          <p className="font-bold">{formatFcfa(product.price * quantity)}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
            {lines.length > 0 && (
              <footer className="border-t border-ink/8 bg-white/46 px-5 py-5 backdrop-blur-xl sm:px-7">
                <div className="mb-4 flex items-center justify-between"><span className="text-ink/58">Sous-total</span><strong className="text-xl">{formatFcfa(subtotal)}</strong></div>
                <p className="mb-4 text-sm text-ink/48">Les frais de livraison sont calculés à l’étape suivante.</p>
                <button type="button" className="dark-button w-full" onClick={() => { if (!user) { window.location.href = "/connexion"; } else setStep("checkout"); }}>Passer la commande</button>
              </footer>
            )}
          </>
        )}

        {step === "checkout" && (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={placeOrder}>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="field-label">Téléphone pour la livraison<input className="field" name="contactPhone" type="tel" autoComplete="tel" required pattern="[+0-9 ()-]{8,20}" /></label>
                </div>
                <label className="field-label">Adresse de livraison<textarea className="field min-h-24 resize-y" name="shippingAddress" autoComplete="street-address" required minLength={8} /></label>
                <label className="field-label">Zone de livraison
                  <select className="field" value={deliveryArea} onChange={(event) => setDeliveryArea(event.target.value)}>
                    {deliveryAreas.map((area) => <option key={area.name}>{area.name}</option>)}
                  </select>
                </label>
                <fieldset>
                  <legend className="mb-2 text-sm font-bold text-[#42506a]">Mode de paiement</legend>
                  <div className="grid gap-2">
                    <label className="cursor-not-allowed rounded-2xl border border-ink/10 bg-white/45 p-4 opacity-65">
                      <input type="radio" name="paymentMethod" value="MOBILE_MONEY" disabled className="mr-2 accent-[#267fa6]" />
                      <span className="font-bold">MTN Mobile Money</span><span className="ml-2 text-sm text-ink/55">Bientôt disponible</span>
                    </label>
                    <label className="cursor-not-allowed rounded-2xl border border-ink/10 bg-white/45 p-4 opacity-65">
                      <input type="radio" name="paymentMethod" value="ORANGE_MONEY" disabled className="mr-2 accent-[#267fa6]" />
                      <span className="font-bold">Orange Money</span><span className="ml-2 text-sm text-ink/55">Bientôt disponible</span>
                    </label>
                    <label className="cursor-pointer rounded-2xl border border-ink/10 bg-white/66 p-4 has-[:checked]:border-[#429bc2] has-[:checked]:bg-[#e8f5fa]">
                      <input type="radio" name="paymentMethod" value="CASH_ON_DELIVERY" defaultChecked className="mr-2 accent-[#267fa6]" />
                      <span className="font-bold">Paiement à la livraison</span>
                    </label>
                  </div>
                </fieldset>
                {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
              </div>
            </div>
            <footer className="border-t border-ink/8 bg-white/56 px-5 py-5 backdrop-blur-xl sm:px-7">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between text-ink/60"><span>Articles</span><span>{formatFcfa(subtotal)}</span></div>
                <div className="flex justify-between text-ink/60"><span>Livraison · {selectedArea.window}</span><span>{formatFcfa(selectedArea.fee)}</span></div>
                <div className="mt-1 flex justify-between text-lg font-bold"><span>Total</span><span>{formatFcfa(total)}</span></div>
              </div>
              <button type="submit" className="dark-button mt-4 w-full" disabled={busy}>
                {busy ? <><LoaderCircle className="animate-spin" size={18} /> Validation…</> : <>Confirmer · {formatFcfa(total)}</>}
              </button>
            </footer>
          </form>
        )}

        {step === "success" && order && (
          <div className="grid flex-1 place-items-center px-6 py-10 text-center">
            <div>
              <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#dff4ec] text-[#247457]"><Check size={38} strokeWidth={1.8} /></span>
              <p className="mt-7 text-sm font-bold uppercase tracking-[0.14em] text-ink/45">Commande {order.orderNumber}</p>
              <h3 className="display-type mt-2 text-5xl">Merci, tout est bien reçu.</h3>
              <p className="mx-auto mt-4 max-w-sm leading-7 text-ink/60">{order.paymentMessage ?? "Conservez votre numéro de commande et votre téléphone pour suivre chaque étape de la livraison."}</p>
              {order.paymentRedirectUrl && (
                <a href={order.paymentRedirectUrl} className="dark-button mt-7">Finaliser le paiement</a>
              )}
              <Link href={`/suivi?commande=${encodeURIComponent(order.orderNumber)}`} className="outline-button mt-3" onClick={close}>Suivre cette commande</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
