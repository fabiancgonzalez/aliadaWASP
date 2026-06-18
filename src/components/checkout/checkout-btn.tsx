"use client";
import React, { useMemo, useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import { ProductTypes } from "../product/types";

const createCheckout = (array: ProductTypes[], totalPrice: number) => {
  const texto: Array<String> = [];

  array.forEach((item) => {
    const { title, quantity, price } = item;
    texto.push(`${quantity} ${title} - $${price}`);
  });

  const textoFinal = `¡Hola Aliada!, quería pedirte: %0A${texto.join(
    "%0A"
  )} %0A %0A Total: $${totalPrice}%0A ¡Muchas Gracias!`;
  window.location.href = "https://wa.me/5493513707249?text=" + textoFinal;
  console.log(textoFinal);
  return textoFinal;
};

function CheckoutButton({
  array,
  totalPrice,
  onCartUpdate,
}: {
  array: ProductTypes[];
  totalPrice: number;
  onCartUpdate: (nextCart: ProductTypes[]) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftItems, setDraftItems] = useState<ProductTypes[]>([]);

  const hasProducts = useMemo(() => draftItems.length > 0, [draftItems]);

  const modalTotal = useMemo(
    () => draftItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [draftItems]
  );

  const openModal = () => {
    setDraftItems(array.map((item) => ({ ...item })));
    setIsModalOpen(true);
  };

  const increaseDraftItem = (title: string) => {
    setDraftItems((prev) =>
      prev.map((item) =>
        item.title === title ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseDraftItem = (title: string) => {
    setDraftItems((prev) =>
      prev
        .map((item) =>
          item.title === title
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDraftItems([]);
  };

  const confirmCheckout = () => {
    onCartUpdate(draftItems);
    createCheckout(draftItems, modalTotal);
    closeModal();
  };

  return (
    <>
      <button
        className="bg-green-700 w-[80%] rounded-full shadow-2xl flex items-center py-2 justify-center text-md gap-4 underline underline-offset-4"
        onClick={openModal}
      >
        <SiWhatsapp className="w-5 h-5" /> Confirmar pedido
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="w-full max-w-lg rounded-2xl bg-[#fff3e6] p-4 sm:p-6 text-[#6e2e00] border border-[#f1b27a]">
            <h2 className="text-xl sm:text-2xl font-bold text-[#8a3d00]">
              Confirmar pedido
            </h2>

            <ul className="mt-4 max-h-[45vh] overflow-y-auto space-y-2">
              {draftItems.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl bg-[#ffd6b3] border border-[#f1b27a] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{item.title}</p>
                      <p className="text-sm">${item.price} c/u</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="h-8 w-8 rounded-full bg-[#8a3d00] text-[#fff3e6] font-bold"
                        onClick={() => decreaseDraftItem(item.title)}
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="h-8 w-8 rounded-full bg-[#8a3d00] text-[#fff3e6] font-bold"
                        onClick={() => increaseDraftItem(item.title)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between font-bold">
              <span>Total</span>
              <span>${modalTotal || totalPrice}</span>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                className="rounded-full border border-[#a74700] px-5 py-2 font-semibold"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-full bg-green-700 text-white px-5 py-2 font-semibold disabled:opacity-60"
                disabled={!hasProducts}
                onClick={confirmCheckout}
              >
                Enviar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default CheckoutButton;
