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
  if (typeof body?.description === "string") updates.description = body.description.trim();
  if (typeof body?.barcode === "string") updates.barcode = body.barcode.trim() ? body.barcode.trim().slice(0, 64) : null;
  if (Number.isInteger(body?.priceInCents)) updates.priceInCents = body.priceInCents;
  if (Number.isInteger(body?.stock)) updates.stock = body.stock;
  if (typeof body?.active === "boolean") updates.active = body.active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });
  }

  updates.updatedAt = new Date();
  let updated;
  try {
    [updated] = await db.update(products).set(updates).where(eq(products.id, params.id)).returning();
  } catch (e) {
    const msg = String((e as { cause?: { message?: string } })?.cause?.message ?? (e as Error)?.message ?? "");
    if (msg.includes("barcode_unique")) {
      return NextResponse.json({ error: "Ese codigo de barras ya existe en otro producto." }, { status: 409 });
    }
    throw e;
  }

  if (!updated) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, params.id));
  return NextResponse.json({ ok: true });
}
