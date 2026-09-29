export type CategoryId =
  | "chaussettes"
  | "vetements"
  | "sommeil"
  | "eveil"
  | "repas"
  | "bain"
  | "accessoires";

export type Category = {
  id: CategoryId;
  name: string;
  description: string;
  image: string;
  accent: string;
};

export type Product = {
  id: string;
  variantId: string;
  slug: string;
  name: string;
  description: string;
  categoryId: CategoryId;
  price: number;
  image: string;
  age: string;
  size: string;
  gender: "Fille" | "Garçon" | "Mixte";
  color: string;
  available: boolean;
  featured: boolean;
};

export type CartLine = {
  product: Product;
  quantity: number;
};

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type TrackedOrder = {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  updatedAt: string;
  estimatedDelivery?: string;
};
