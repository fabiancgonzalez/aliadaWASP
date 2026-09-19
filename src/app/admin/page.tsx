import { count, eq } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

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
    <main className="min-h-screen bg-[#f7f2e8] px-4 py-10 text-[#2f241f]">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase text-[#a74700]">Administracion</p>
        <h1 className="mt-2 text-3xl font-bold">Hola, {user.firstName ?? "Aliada"}</h1>
        <nav className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
          <Link href="/admin/products" className="rounded border border-[#dfc7ad] bg-white px-4 py-2 hover:bg-[#f0e2cf]">Productos</Link>
          <Link href="/admin/orders" className="rounded border border-[#dfc7ad] bg-white px-4 py-2 hover:bg-[#f0e2cf]">Pedidos</Link>
          <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="rounded border border-[#dfc7ad] bg-white px-4 py-2 hover:bg-[#f0e2cf]">Usuarios (Clerk)</a>
        </nav>
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