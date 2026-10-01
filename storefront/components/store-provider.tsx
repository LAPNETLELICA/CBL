"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartLine, Product } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";

type StoreContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  cartOpen: boolean;
  cartNotice: string;
  setCartOpen: (open: boolean) => void;
  dismissCartNotice: () => void;
  addToCart: (product: Product) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  const noticeTimer = useRef<number | null>(null);
  const storageKey = user ? `christ-beni-cart:${user.id}` : "christ-beni-cart:guest";
  const hydratedKey = useRef<string | null>(null);
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (hydratedKey.current === storageKey) return;
    skipNextSave.current = true;
    const readCart = (key: string): CartLine[] => {
      try {
        const value: unknown = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value.filter((line): line is CartLine => Boolean(line?.product?.id && Number.isInteger(line.quantity) && line.quantity > 0)) : [];
      } catch { return []; }
    };
    const saved = readCart(storageKey);
    if (user) {
      const guestKey = "christ-beni-cart:guest";
      const guest = readCart(guestKey);
      const combined = [...saved];
      for (const line of guest) {
        const existing = combined.find((item) => item.product.id === line.product.id);
        if (existing) existing.quantity = Math.min(10, existing.quantity + line.quantity);
        else combined.push(line);
      }
      setLines(combined);
      localStorage.removeItem(guestKey);
    } else setLines(saved);
    hydratedKey.current = storageKey;
  }, [storageKey, user]);

  useEffect(() => {
    if (hydratedKey.current !== storageKey) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(lines)); } catch { /* Cart remains available for the current visit. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [lines, storageKey]);

  const addToCart = useCallback((product: Product) => {
    setLines((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: Math.min(line.quantity + 1, 10) }
            : line,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
    setCartNotice(`${product.name} a été ajouté à votre panier.`);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setCartNotice(""), 3500);
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      current
        .map((line) =>
          line.product.id === productId
            ? { ...line, quantity: Math.min(Math.max(quantity, 0), 10) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }, []);

  const value = useMemo(
    () => ({
      lines,
      itemCount: lines.reduce((count, line) => count + line.quantity, 0),
      subtotal: lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
      cartOpen,
      cartNotice,
      setCartOpen,
      dismissCartNotice: () => setCartNotice(""),
      addToCart,
      setQuantity,
      clearCart: () => setLines([]),
    }),
    [addToCart, cartNotice, cartOpen, lines, setQuantity],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
}
