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
  const priceInCents = Number(body?.priceInCents);
  const stock = Number(body?.stock ?? 0);

  if (!title || !category || !imageUrl || !Number.isInteger(priceInCents) || priceInCents < 0) {
    return NextResponse.json({ error: "Datos de producto invalidos." }, { status: 400 });
  }

  const [created] = await db
    .insert(products)
    .values({ title, category, imageUrl, priceInCents, stock: Number.isInteger(stock) ? stock : 0 })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
