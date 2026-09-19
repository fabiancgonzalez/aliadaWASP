import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  const body = await request.json();

  const updates: Partial<typeof products.$inferInsert> = {};
  if (typeof body?.title === "string") updates.title = body.title.trim();
  if (typeof body?.category === "string") updates.category = body.category.trim();
  if (typeof body?.imageUrl === "string") updates.imageUrl = body.imageUrl.trim();
  if (Number.isInteger(body?.priceInCents)) updates.priceInCents = body.priceInCents;
  if (Number.isInteger(body?.stock)) updates.stock = body.stock;
  if (typeof body?.active === "boolean") updates.active = body.active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });
  }

  updates.updatedAt = new Date();
  const [updated] = await db
    .update(products)
    .set(updates)
    .where(eq(products.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, params.id));
  return NextResponse.json({ ok: true });
}
