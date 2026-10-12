import { count, eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import AdminNav from "./components/nav/nav";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();
  const [[productMetric], [orderMetric], [pendingMetric]] = await Promise.all([
    db.select({ value: count() }).from(products),
    db.select({ value: count() }).from(orders),
    db
      .select({ value: count() })
      .from(orders)
      .where(eq(orders.status, "pending_payment")),
  ]);

  const metrics = [
    { label: "Productos", value: productMetric.value },
    { label: "Pedidos", value: orderMetric.value },
    { label: "Pendientes", value: pendingMetric.value },
  ];

  return (
    <main className="min-h-screen bg-[#E86423] px-4 py-10 text-[#2f241f] placeholder-black">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase text-black">Administracion</p>
        <h1 className="mt-2 text-3xl font-bold">Hola, {user.firstName ?? "Aliada"}</h1>
      <AdminNav />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-lg border border-[#dfc7ad] bg-white p-5 shadow-sm">
              <p className="text-sm text-[#6e625b]">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold text-[#8a3d00]">{metric.value}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}