import { asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const all = await db.select().from(products).orderBy(asc(products.title));
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const barcode = typeof body?.barcode === "string" && body.barcode.trim() ? body.barcode.trim().slice(0, 64) : null;
  const priceInCents = Number(body?.priceInCents);
  const stock = Number(body?.stock ?? 0);

  if (!title || !category || !imageUrl || !Number.isInteger(priceInCents) || priceInCents < 0) {
    return NextResponse.json({ error: "Datos de producto invalidos." }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(products)
      .values({ title, category, imageUrl, description, barcode, priceInCents, stock: Number.isInteger(stock) ? stock : 0 })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const msg = String((e as { message?: string; cause?: { message?: string } })?.cause?.message ?? (e as Error)?.message ?? "");
    if (msg.includes("barcode_unique")) {
      return NextResponse.json({ error: "Ese codigo de barras ya existe en otro producto." }, { status: 409 });
    }
    throw e;
  }
}
