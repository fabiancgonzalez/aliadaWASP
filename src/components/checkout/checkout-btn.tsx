"use client";

import { useState } from "react";
import { FaSpinner, FaWhatsapp } from "react-icons/fa6";

import {
  ADMIN_WHATSAPP_NUMBER,
  MP_ALIAS,
  MP_ALIAS_NAME,
  TRANSFER_CONFIRMATION_MESSAGE,
  buildWhatsAppLink,
} from "@/lib/whatsapp";

import { ProductTypes } from "../product/types";

type OrderResult = {
  orderId: string;
  total: number;
  items: { title: string; quantity: number; unitPrice: number }[];
};

export default function CheckoutButton({ array }: { array: ProductTypes[] }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);
/*
 */ const sendOrder = async () => {
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/orders/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: array.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (response.status === 401) {
        window.location.assign("/sign-in?redirect_url=/");
        return;
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "No pudimos registrar el pedido.");
      }

      setOrder(result);

      const detail = result.items
        .map((item: OrderResult["items"][number]) => `${item.quantity}x ${item.title}`)
        .join(", ");
      const text = `Hola Alicia! Quiero hacer el pedido ${result.orderId}: ${detail}. Total: $${result.total}`;
      window.open(buildWhatsAppLink(ADMIN_WHATSAPP_NUMBER, text), "_blank");
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "No pudimos registrar el pedido."
      );
    } finally {
      setPending(false);
    }
  };

  if (order) {
    return (
      <div className="rounded-lg border border-[#dfc7ad] bg-white p-4 text-sm text-[#2f241f]">
        <p className="font-bold">{TRANSFER_CONFIRMATION_MESSAGE}</p>
        <p className="mt-2">
          Transferi a Mercado Pago con el alias:{" "}
          <span className="font-bold">{MP_ALIAS}</span> ({MP_ALIAS_NAME})
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending || array.length === 0}
        className="flex min-h-12 w-full items-center justify-center gap-3 bg-[#25D366] px-5 py-3 font-bold text-white transition-colors hover:bg-[#1ebe57] disabled:cursor-wait disabled:opacity-65"
        onClick={sendOrder}
      >
        {pending ? (
          <FaSpinner className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <FaWhatsapp className="h-5 w-5" aria-hidden="true" />
        )}
        {pending ? "Enviando pedido..." : "Enviar pedido por WhatsApp"}
      </button>
      {error ? <p role="alert" className="mt-3 text-center text-sm text-clay">{error}</p> : null}
    </div>
  );
}