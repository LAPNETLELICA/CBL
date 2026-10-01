"use client";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/guard";
import { AdminShell, Head } from "@/components/shell";
import { requireSupabase } from "@/lib/supabase";
import { fcfa } from "@/lib/format";

type Status = "PENDING" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
type Payment = "UNPAID" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
type Order = { id: string; order_number: string; customer_name: string; customer_email: string; contact_phone: string; shipping_address: string; delivery_area: string; total_fcfa: number; status: Status; payment_status: Payment; payment_method: string; created_at: string; items: { product_name: string; quantity: number; unit_price_fcfa: number }[] };
const statusLabels: Record<Status,string> = { PENDING:"En attente", CONFIRMED:"Validée", PREPARING:"En préparation", OUT_FOR_DELIVERY:"En livraison", DELIVERED:"Terminée", CANCELLED:"Annulée" };
const paymentLabels: Record<Payment,string> = { UNPAID:"Non réglée", PENDING:"En attente", PAID:"Réglée", FAILED:"Échec", REFUNDED:"Remboursée" };
const transitions: Record<Status,Status[]> = { PENDING:["CONFIRMED","CANCELLED"], CONFIRMED:["PREPARING","CANCELLED"], PREPARING:["OUT_FOR_DELIVERY","CANCELLED"], OUT_FOR_DELIVERY:["DELIVERED"], DELIVERED:[], CANCELLED:[] };
const friendlyError = (message: string) => message.includes("Mobile Money") ? "Le paiement Mobile Money doit être confirmé avant de valider la commande." : message.includes("Transition") ? "Cette étape n’est pas disponible pour cette commande." : "La modification n’a pas pu être enregistrée. Réessayez.";
export default function Orders() {
  const [items,setItems] = useState<Order[]>([]); const [filter,setFilter] = useState<"ALL"|Status>("ALL"); const [message,setMessage] = useState(""); const [busy,setBusy] = useState(""); const [celebrating,setCelebrating] = useState(false);
  async function load(){ const {data,error}=await requireSupabase().from("orders").select("id,order_number,customer_name,customer_email,contact_phone,shipping_address,delivery_area,total_fcfa,status,payment_status,payment_method,created_at,order_items(product_name,quantity,unit_price_fcfa)").order("created_at",{ascending:false}); if(error){setMessage("Impossible de charger les commandes.");return} setItems((data||[]).map((row:any)=>({...row,items:row.order_items||[]})) as Order[]); }
  useEffect(()=>{
    const supabase=requireSupabase();
    void load();
    const channel=supabase.channel("admin-orders-status")
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"orders"},()=>{void load()})
      .subscribe();
    return()=>{void supabase.removeChannel(channel)};
  },[]);
  async function changeStatus(order:Order,status:Status){setBusy(order.id);setMessage("");const {error}=await requireSupabase().rpc("set_order_status",{p_order_id:order.id,p_status:status,p_note:null});if(error)setMessage(friendlyError(error.message));else setMessage(`Commande ${order.order_number} : ${statusLabels[status].toLowerCase()}.`);await load();setBusy("");}
  async function changePayment(order:Order,status:Payment){setBusy(order.id);setMessage("");const {error}=await requireSupabase().rpc("set_payment_status",{p_order_id:order.id,p_status:status});if(error)setMessage("Le paiement n’a pas pu être mis à jour. Réessayez.");else { setMessage(`Paiement de  mis à jour.`); if (status === "PAID") { setCelebrating(true); window.setTimeout(() => setCelebrating(false), 1800); } }await load();setBusy("");}
  const filtered=filter==="ALL"?items:items.filter(order=>order.status===filter);
  return <AdminGuard><AdminShell><Head kicker="VENTES" title="Commandes" copy="Suivez les achats, préparez les colis et mettez à jour leur avancement."/>
    {celebrating && <div className="payment-confetti" aria-hidden><i/><i/><i/><i/><i/><i/><i/><i/></div>}
    {message&&<div className="notice" role="status" style={{marginBottom:14}}>{message}</div>}
    <div className="cms-tabs" aria-label="Filtrer les commandes"><button className={`btn ${filter==="ALL"?"primary":"ghost"}`} onClick={()=>setFilter("ALL")}>Toutes ({items.length})</button>{(["PENDING","CONFIRMED","PREPARING","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"] as Status[]).map(status=><button key={status} className={`btn ${filter===status?"primary":"ghost"}`} onClick={()=>setFilter(status)}>{statusLabels[status]} ({items.filter(i=>i.status===status).length})</button>)}</div>
    {filtered.length? <div className="orders-list">{filtered.map(order=><article className="card order-card" key={order.id}><div className="order-card-top"><div><p className="eyebrow">{new Date(order.created_at).toLocaleString("fr-FR")}</p><h2>{order.order_number}</h2><span className={`tag ${order.status==="CANCELLED"?"danger":"manager"}`}>{statusLabels[order.status]}</span></div><strong className="order-total">{fcfa(order.total_fcfa)}</strong></div>
      <div className="order-details"><div><b>{order.customer_name}</b><span>{order.contact_phone}</span><span>{order.customer_email}</span><span>{order.shipping_address} · {order.delivery_area}</span></div><div><b>Articles commandés</b>{order.items.map((line,index)=><span key={`${line.product_name}-${index}`}>{line.quantity} × {line.product_name} — {fcfa(line.unit_price_fcfa*line.quantity)}</span>)}</div><div><b>Paiement</b><span>{paymentLabels[order.payment_status]} · {order.payment_method==="MOBILE_MONEY"?"Mobile Money":"Paiement à la livraison"}</span>{order.payment_status!=="PAID"&&order.payment_status!=="REFUNDED"&&<button className="btn ghost" disabled={busy===order.id} onClick={()=>void changePayment(order,"PAID")}>Confirmer le paiement reçu</button>}</div></div>
      {transitions[order.status].length>0&&<div className="order-actions">{transitions[order.status].map(status=><button key={status} className={`btn ${status==="CANCELLED"?"ghost":"primary"}`} disabled={busy===order.id||(status==="CONFIRMED"&&order.payment_method==="MOBILE_MONEY"&&order.payment_status!=="PAID")} onClick={()=>void changeStatus(order,status)}>{status==="CANCELLED"?"Annuler la commande":`Marquer : ${statusLabels[status].toLowerCase()}`}</button>)}</div>}
    </article>)}</div>:<div className="card cms-empty"><b>{items.length?"Aucune commande dans ce filtre":"Aucune commande reçue"}</b><span>Les nouvelles commandes apparaîtront ici.</span></div>}
  </AdminShell></AdminGuard>
}
