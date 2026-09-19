import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { getMercadoPagoClients } from "@/lib/mercado-pago";

type PaymentNotification = {
  type?: string;
  data?: { id?: string | number };
};

function resolveOrderStatus(
  paymentStatus: string,
  currentStatus: typeof orders.$inferSelect.status
) {
  if (paymentStatus === "refunded") return "refunded" as const;
  if (paymentStatus === "charged_back") return "charged_back" as const;

  if (paymentStatus === "approved") {
    return currentStatus === "preparing" ||
      currentStatus === "ready" ||
      currentStatus === "completed"
      ? currentStatus
      : "paid";
  }

  if (
    (paymentStatus === "cancelled" || paymentStatus === "rejected") &&
    currentStatus === "pending_payment"
  ) {
    return "cancelled" as const;
  }

  return currentStatus;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  let notification: PaymentNotification;
  try {
    notification = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const dataId =
    request.nextUrl.searchParams.get("data.id") ??
    request.nextUrl.searchParams.get("data_id") ??
    String(notification.data?.id ?? "");

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret: webhookSecret,
      toleranceSeconds: 300,
    });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      console.warn("Rejected Mercado Pago webhook", {
        reason: error.reason,
        requestId: error.requestId,
      });
    }
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (notification.type !== "payment" || !dataId) {
    return NextResponse.json({ received: true });
  }

  try {
    const { payment } = getMercadoPagoClients();
    const paymentData = await payment.get({ id: dataId });
    const orderId = paymentData.external_reference;
    if (!orderId) return NextResponse.json({ received: true });

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return NextResponse.json({ received: true });

    const paidInCents = Math.round((paymentData.transaction_amount ?? 0) * 100);
    if (paidInCents !== order.totalInCents) {
      console.error("Mercado Pago amount mismatch", {
        orderId,
        paymentId: dataId,
      });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 409 });
    }

    const paymentStatus = paymentData.status ?? "pending";
    const nextStatus = resolveOrderStatus(paymentStatus, order.status);

    await db
      .update(orders)
      .set({
        status: nextStatus,
        mercadoPagoPaymentId: String(paymentData.id ?? dataId),
        paymentStatusDetail: paymentData.status_detail ?? paymentStatus,
        paidAt:
          nextStatus === "paid"
            ? new Date(paymentData.date_approved ?? Date.now())
            : order.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mercado Pago webhook processing failed", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}