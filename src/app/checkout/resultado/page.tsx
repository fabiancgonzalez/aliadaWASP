import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import ClearPaidCart from "@/components/checkout/clear-paid-cart";
import { db } from "@/db";
import { orders } from "@/db/schema";

export const dynamic = "force-dynamic";

type ResultPageProps = {
  searchParams: { order?: string };
};

const contentByStatus = {
  paid: {
    eyebrow: "Pago confirmado",
    title: "Gracias por tu compra.",
    message: "Recibimos el pago y ya podemos preparar tu pedido.",
  },
  pending_payment: {
    eyebrow: "Pago en proceso",
    title: "Estamos esperando la confirmacion.",
    message: "Algunos medios de pago pueden demorar. Tu pedido se actualizara automaticamente.",
  },
  cancelled: {
    eyebrow: "Pago no completado",
    title: "No se realizo ningun cobro.",
    message: "Podes volver a la tienda e intentar con otro medio de pago.",
  },
  refunded: {
    eyebrow: "Pago devuelto",
    title: "El pago fue reembolsado.",
    message: "La devolucion puede demorar en aparecer segun el medio de pago.",
  },
  charged_back: {
    eyebrow: "Pago observado",
    title: "El pago se encuentra en revision.",
    message: "Contactanos si necesitas mas informacion sobre el pedido.",
  },
} as const;

export default async function CheckoutResultPage({ searchParams }: ResultPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!searchParams.order) redirect("/");

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, searchParams.order), eq(orders.clerkUserId, userId)))
    .limit(1);

  if (!order) redirect("/");
  const resultStatus =
    order.status === "pending_payment" ||
    order.status === "cancelled" ||
    order.status === "refunded" ||
    order.status === "charged_back"
      ? order.status
      : "paid";
  const content = contentByStatus[resultStatus];

  return (
    <main className="grid min-h-[calc(100vh-5rem)] place-items-center px-4 py-16">
      {order.status === "paid" ? <ClearPaidCart /> : null}
      <section className="w-full max-w-2xl border border-ink/20 bg-paper p-8 sm:p-12">
        <p className="text-sm font-bold uppercase text-clay">{content.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{content.title}</h1>
        <p className="mt-4 text-lg text-ink/70">{content.message}</p>
        <p className="mt-8 border-t border-ink/15 pt-5 text-sm text-ink/60">
          Pedido: <span className="font-bold text-ink">{order.id}</span>
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="bg-ink px-5 py-3 font-bold text-paper">Volver a la tienda</Link>
          <Link href="/contacto" className="border border-ink px-5 py-3 font-bold">Contactar</Link>
        </div>
      </section>
    </main>
  );
}