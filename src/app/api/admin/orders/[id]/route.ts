import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { orders, orderStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const body = await request.json();
  const status = body?.status;

  if (!orderStatus.enumValues.includes(status)) {
    return NextResponse.json({ error: "Estado invalido." }, { status: 400 });
  }

  const [updated] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  await db.delete(orders).where(eq(orders.id, params.id));
  return NextResponse.json({ ok: true });
}
