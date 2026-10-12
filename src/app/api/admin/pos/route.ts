import { and, eq, gte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type SaleItem = { productId: string; quantity: number };

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  const body = await request.json();

  const items: SaleItem[] = Array.isArray(body?.items) ? body.items : [];
  const customerEmail =
    typeof body?.customerEmail === "string" && body.customerEmail.trim()
      ? body.customerEmail.trim()
      : "mostrador@aliada.local";

  const valid = items.every(
    (i) => typeof i?.productId === "string" && Number.isInteger(i.quantity) && i.quantity > 0
  );
  if (!items.length || !valid) {
    return NextResponse.json({ error: "Carrito invalido." }, { status: 400 });
  }

  // Descuenta stock de forma atomica; si algun producto no alcanza, revierte los anteriores.
  const reserved: SaleItem[] = [];
  const lines: { productId: string; title: string; price: number; quantity: number }[] = [];

  const rollback = async () => {
    for (const r of reserved) {
      await db
        .update(products)
        .set({ stock: sql`${products.stock} + ${r.quantity}` })
        .where(eq(products.id, r.productId));
    }
  };

  for (const item of items) {
    const [updated] = await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: new Date() })
      .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
      .returning({ title: products.title, price: products.priceInCents });

    if (!updated) {
      await rollback();
      return NextResponse.json(
        { error: "Stock insuficiente o producto inexistente." },
        { status: 409 }
      );
    }
    reserved.push(item);
    lines.push({
      productId: item.productId,
      title: updated.title,
      price: updated.price,
      quantity: item.quantity,
    });
  }

  const total = lines.reduce((acc, l) => acc + l.price * l.quantity, 0);

  try {
    const [order] = await db
      .insert(orders)
      .values({
        clerkUserId: user.id,
        customerEmail,
        status: "completed",
        totalInCents: total,
        paidAt: new Date(),
        paymentStatusDetail: `POS - ${typeof body?.formaPago === "string" ? body.formaPago : "Efectivo"}`,
      })
      .returning({ id: orders.id });

    await db.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        productTitle: l.title,
        unitPriceInCents: l.price,
        quantity: l.quantity,
      }))
    );

    return NextResponse.json({ id: order.id, totalInCents: total });
  } catch {
    await rollback();
    return NextResponse.json({ error: "No se pudo registrar la venta." }, { status: 500 });
  }
}
