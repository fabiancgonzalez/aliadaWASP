"use client";

import { useEffect, useState } from "react";
import {
  FaArrowRight,
  FaBagShopping,
  FaMinus,
  FaPlus,
  FaRotateRight,
  FaTrash,
  FaXmark,
} from "react-icons/fa6";

import { data } from "../../api";
import CheckoutButton from "../checkout/checkout-btn";
import Product from "./Product";
import { ProductTypes } from "./types";

const CART_STORAGE_KEY = "aliada-cart:v1";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);

const BEAUTY_CATEGORY = /belleza|cosm[eé]tica/i;
const isBeautyProduct = (product: ProductTypes) =>
  BEAUTY_CATEGORY.test(product.category);

export default function ProductSection({
  section = "print",
}: {
  section?: "print" | "beauty";
}) {
  const isBeauty = section === "beauty";
  const [cart, setCart] = useState<ProductTypes[]>([]);
  const [products, setProducts] = useState<ProductTypes[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [activeCategory, setActiveCategory] = useState("Todos");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) setCart(parsed);
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setCartReady(true);
    }
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Keep the cart functional for this session when storage is unavailable.
    }
  }, [cart, cartReady]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(false);
    data(controller.signal)
      .then((result) => {
        if (active) setProducts(result);
      })
      .catch((fetchError) => {
        if (active && fetchError.name !== "AbortError") setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [requestVersion]);

  const sectionProducts = products.filter(
    (product) => isBeautyProduct(product) === isBeauty
  );
  const categories = [
    "Todos",
    ...Array.from(
      new Map(
        sectionProducts.map((product) => [
          product.category.toLocaleLowerCase("es"),
          product.category,
        ])
      ).values()
    ),
  ];
  const visibleProducts =
    activeCategory === "Todos"
      ? sectionProducts
      : sectionProducts.filter(
          (product) =>
            product.category.toLocaleLowerCase("es") ===
            activeCategory.toLocaleLowerCase("es")
        );
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const addToCart = (product: ProductTypes) => {
    setCart((current) => {
      const existing = current.find((item) => item.title === product.title);
      if (!existing) return [...current, product];
      return current.map((item) =>
        item.title === product.title
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    });
    setCartOpen(true);
  };

  const changeQuantity = (title: string, change: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.title === title
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  return (
    <section id="catalogo" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 border-b border-ink/20 pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase text-clay">
            {isBeauty ? "Belleza y Cosmetica" : "Coleccion actual"}
          </p>
          <h2 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
            {isBeauty
              ? "Tu momento de cuidado y color."
              : "Stickers para hacer tuyo lo cotidiano."}
          </h2>
        </div>
        <p className="max-w-md text-lg text-ink/70">
          {isBeauty
            ? "Perfumeria, maquillaje y cuidado personal de Avon y Natura."
            : "Diseños impresos con cuidado para cuadernos, regalos, marcas y todo lo que quieras personalizar."}
        </p>
      </div>

      <div className="my-8 flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar por categoria">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={activeCategory === category}
            className={`whitespace-nowrap border px-4 py-2 text-sm font-bold transition-colors ${
              activeCategory === category
                ? "border-ink bg-ink text-paper"
                : "border-ink/25 text-ink hover:border-clay hover:text-clay"
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Cargando productos">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="aspect-[3/4] animate-pulse bg-ink/10" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="border border-clay bg-clay/10 p-8 text-center">
          <p className="font-display text-2xl font-semibold">No pudimos cargar el catalogo.</p>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 font-bold text-clay"
            onClick={() => setRequestVersion((version) => version + 1)}
          >
            <FaRotateRight aria-hidden="true" /> Reintentar
          </button>
        </div>
      ) : (
        <div className="product-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <Product key={product.id ?? product.title} {...product}>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between border-t border-ink/20 pt-4 font-bold text-ink transition-colors hover:text-clay"
                onClick={() => addToCart({ ...product, quantity: 1 })}
              >
                Agregar al carrito <FaArrowRight aria-hidden="true" />
              </button>
            </Product>
          ))}
        </div>
      )}

      <button
        type="button"
        aria-label={`Abrir carrito con ${itemCount} productos`}
        className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-3 bg-ink px-5 font-bold text-paper shadow-xl transition-transform hover:-translate-y-1"
        onClick={() => setCartOpen(true)}
      >
        <FaBagShopping className="h-5 w-5" aria-hidden="true" />
        <span>{itemCount}</span>
      </button>

      {cartOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/55" role="presentation" onMouseDown={() => setCartOpen(false)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            className="flex h-full w-full max-w-md flex-col bg-paper shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-ink/20 p-5">
              <div>
                <p className="text-xs font-bold uppercase text-clay">Tu seleccion</p>
                <h2 id="cart-title" className="font-display text-3xl font-semibold">Carrito</h2>
              </div>
              <button type="button" aria-label="Cerrar carrito" className="grid h-10 w-10 place-items-center border border-ink/20 hover:bg-ink hover:text-paper" onClick={() => setCartOpen(false)}>
                <FaXmark className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            {cart.length ? (
              <>
                <ul className="flex-1 overflow-y-auto p-5">
                  {cart.map((item) => (
                    <li key={item.title} className="grid grid-cols-[64px_1fr_auto] gap-4 border-b border-ink/15 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" className="h-16 w-16 object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-bold">{item.title}</p>
                        <p className="text-sm text-ink/65">{formatPrice(item.price)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" aria-label={`Quitar una unidad de ${item.title}`} className="grid h-8 w-8 place-items-center border border-ink/20" onClick={() => changeQuantity(item.title, -1)}><FaMinus aria-hidden="true" /></button>
                          <span className="w-6 text-center font-bold">{item.quantity}</span>
                          <button type="button" aria-label={`Agregar una unidad de ${item.title}`} className="grid h-8 w-8 place-items-center border border-ink/20" onClick={() => changeQuantity(item.title, 1)}><FaPlus aria-hidden="true" /></button>
                        </div>
                      </div>
                      <button type="button" aria-label={`Eliminar ${item.title}`} className="h-9 w-9 text-clay" onClick={() => setCart((current) => current.filter((product) => product.title !== item.title))}><FaTrash aria-hidden="true" /></button>
                    </li>
                  ))}
                </ul>
                <footer className="border-t border-ink/20 p-5">
                  <div className="mb-5 flex items-baseline justify-between">
                    <span className="text-sm font-bold uppercase">Total</span>
                    <span className="font-display text-3xl font-semibold">{formatPrice(totalPrice)}</span>
                  </div>
                  <CheckoutButton array={cart} />
                  <p className="mt-3 text-center text-xs text-ink/55">Pago seguro procesado en Mercado Pago.</p>
                </footer>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <div>
                  <FaBagShopping className="mx-auto h-8 w-8 text-clay" aria-hidden="true" />
                  <p className="mt-4 font-display text-2xl font-semibold">Tu carrito esta vacio</p>
                  <button type="button" className="mt-3 font-bold text-clay" onClick={() => setCartOpen(false)}>Explorar la coleccion</button>
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </section>
  );
}