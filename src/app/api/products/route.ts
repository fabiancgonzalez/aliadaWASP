import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { normalizeProductImage } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const catalog = await db
			.select()
			.from(products)
			.where(eq(products.active, true))
			.orderBy(asc(products.title));

		return NextResponse.json(
			catalog.map((product) => ({
				id: product.id,
				title: product.title,
				category: product.category,
				image: normalizeProductImage(product.imageUrl),
				price: product.priceInCents / 100,
				quantity: 1,
				stock: product.stock,
			}))
		);
	} catch {
		return NextResponse.json(
			{ error: "No se pudo cargar el catalogo." },
			{ status: 500 }
		);
	}
}
