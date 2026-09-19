"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  customerEmail: string;
  status: string;
  totalInCents: number;
  createdAt: string;
};

const STATUSES = [
  "pending_payment",
  "paid",
  "preparing",
  "ready",
  "completed",
  "cancelled",
  "refunded",
  "charged_back",
];

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);

  const load = () =>
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then(setItems);

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminar este pedido?")) return;
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <main className="min-h-screen px-4 py-10 text-[#2f241f]">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <div className="mt-6 space-y-2">
          {items.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#dfc7ad] bg-white p-3">
              <div>
                <p className="font-bold">{o.customerEmail}</p>
                <p className="text-sm">${(o.totalInCents / 100).toFixed(2)} · {new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="rounded border p-1 text-sm">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={() => remove(o.id)} className="rounded border border-red-400 px-3 py-1 text-sm text-red-600">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
