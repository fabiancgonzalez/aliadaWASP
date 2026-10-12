import type { Metadata } from "next";
import Link from "next/link";
import ProductSection from "@/components/product/ProductSection";

export const metadata: Metadata = {
  title: "Aliada Beauty",
  description: "Productos de belleza y cosmetica de Avon y Natura.",
};

export default function BeautyPage() {
  return (
    <main>
      <section className="rounded-b-2xl bg-clay px-4 py-14 text-center shadow-md">
        <h1 className="font-display text-5xl font-black text-paper sm:text-6xl">
          Aliada Beauty
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base font-bold text-paper/90">
          Productos Avon y Natura: perfumes, maquillaje, cuidado de la piel y mas.
        </p>
        <Link
          href="#catalogo"
          className="mt-6 inline-block rounded-full bg-black px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-black/80"
        >
          Ver productos
        </Link>
      </section>
      <ProductSection section="beauty" />
    </main>
  );
}
