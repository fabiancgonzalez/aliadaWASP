import { auth, currentUser } from "@clerk/nextjs/server";
import { inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { getMercadoPagoClients, getPublicAppUrl } from "@/lib/mercado-pago";

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
      return NextResponse.json({ error: "Inicia sesion para pagar." }, { status: 401 });
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
    const appUrl = getPublicAppUrl(request.nextUrl.origin);
    const { preference } = getMercadoPagoClients();
    const result = await preference.create({
      body: {
        items: resolvedItems.map(({ product, quantity }) => ({
          id: product!.id,
          title: product!.title,
          description: `Sticker ${product!.title} de Aliada Studio Print`,
          category_id: product!.category,
          currency_id: "ARS",
          quantity,
          unit_price: product!.priceInCents / 100,
        })),
        payer: {
          email: customerEmail,
          name: user?.firstName ?? undefined,
          surname: user?.lastName ?? undefined,
          date_created: user?.createdAt
            ? new Date(user.createdAt).toISOString()
            : undefined,
        },
        external_reference: orderId,
        notification_url: `${appUrl}/api/webhooks/mercado-pago`,
        back_urls: {
          success: `${appUrl}/checkout/resultado?status=success&order=${orderId}`,
          pending: `${appUrl}/checkout/resultado?status=pending&order=${orderId}`,
          failure: `${appUrl}/checkout/resultado?status=failure&order=${orderId}`,
        },
        auto_return: "approved",
        statement_descriptor: "ALIADA",
        metadata: { order_id: orderId, clerk_user_id: userId },
      },
      requestOptions: { idempotencyKey: orderId },
    });

    if (!result.id || (!result.init_point && !result.sandbox_init_point)) {
      throw new Error("Mercado Pago did not return a checkout URL");
    }

    await db.batch([
      db.insert(orders).values({
        id: orderId,
        clerkUserId: userId,
        customerEmail,
        totalInCents,
        mercadoPagoPreferenceId: result.id,
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

    const checkoutUrl = process.env.MERCADOPAGO_USE_SANDBOX === "true"
      ? result.sandbox_init_point
      : result.init_point;

    return NextResponse.json({ checkoutUrl, orderId });
  } catch (error) {
    console.error("Checkout creation failed", error);
    return NextResponse.json(
      { error: "No pudimos iniciar el pago. Intenta nuevamente." },
      { status: 500 }
    );
  }
}