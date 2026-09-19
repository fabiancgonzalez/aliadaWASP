import { auth, currentUser } from "@clerk/nextjs/server";
import { inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";

type CheckoutItem = { productId?: unknown; quantity?: unknown };

function parseItems(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) return null;

  const items = value.map((item: CheckoutItem) => ({
    productId: typeof item?.productId === "string" ? item.productId : "",
    quantity:
      typeof item?.quantity === "number" && Number.isInteger(item.quantity)
        ? item.quantity
        : 0,
  }));

  if (items.some((item) => !item.productId || item.quantity < 1 || item.quantity > 100)) {
    return null;
  }

  return items;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Inicia sesion para continuar." }, { status: 401 });
    }

    const user = await currentUser();
    const customerEmail = user?.primaryEmailAddress?.emailAddress;
    if (!customerEmail) {
      return NextResponse.json({ error: "Tu cuenta necesita un email verificado." }, { status: 400 });
    }

    const body = await request.json();
    const requestedItems = parseItems(body?.items);
    if (!requestedItems) {
      return NextResponse.json({ error: "El carrito no es valido." }, { status: 400 });
    }

    const uniqueProductIds = [...new Set(requestedItems.map((item) => item.productId))];
    const catalog = await db
      .select()
      .from(products)
      .where(inArray(products.id, uniqueProductIds));
    const productById = new Map(catalog.map((product) => [product.id, product]));

    const resolvedItems = requestedItems.map((item) => ({
      product: productById.get(item.productId),
      quantity: item.quantity,
    }));

    if (
      resolvedItems.some(
        ({ product, quantity }) => !product?.active || (product.stock > 0 && quantity > product.stock)
      )
    ) {
      return NextResponse.json(
        { error: "Un producto ya no esta disponible en la cantidad solicitada." },
        { status: 409 }
      );
    }

    const orderId = crypto.randomUUID();
    const totalInCents = resolvedItems.reduce(
      (total, { product, quantity }) => total + product!.priceInCents * quantity,
      0
    );

    await db.batch([
      db.insert(orders).values({
        id: orderId,
        clerkUserId: userId,
        customerEmail,
        totalInCents,
      }),
      db.insert(orderItems).values(
        resolvedItems.map(({ product, quantity }) => ({
          orderId,
          productId: product!.id,
          productTitle: product!.title,
          unitPriceInCents: product!.priceInCents,
          quantity,
        }))
      ),
    ]);

    const items = resolvedItems.map(({ product, quantity }) => ({
      title: product!.title,
      quantity,
      unitPrice: product!.priceInCents / 100,
    }));

    return NextResponse.json({
      orderId,
      total: totalInCents / 100,
      items,
      customerEmail,
      customerName: user?.firstName ?? undefined,
    });
  } catch (error) {
    console.error("WhatsApp order creation failed", error);
    return NextResponse.json(
      { error: "No pudimos registrar el pedido. Intenta nuevamente." },
      { status: 500 }
    );
  }
}
