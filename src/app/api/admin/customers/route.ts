import { desc, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const rows = await db
    .select()
    .from(customers)
    .where(
      q
        ? or(
            ilike(customers.name, `%${q}%`),
            ilike(customers.phone, `%${q}%`),
            ilike(customers.email, `%${q}%`),
          )
        : undefined,
    )
    .orderBy(desc(customers.createdAt))
    .limit(50);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const body = await request.json();
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = str(body?.name);
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  const [row] = await db
    .insert(customers)
    .values({
      name,
      phone: str(body?.phone),
      email: str(body?.email),
      address: str(body?.address),
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
