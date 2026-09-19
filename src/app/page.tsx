import ProductSection from "@/components/product/ProductSection";
import Image from "next/image";
import Link from "next/link";

const App = () => {
  return (
    <main>
      <section className="relative flex h-[34svh] min-h-[260px] max-h-[360px] items-end overflow-hidden rounded-b-2xl bg-clay shadow-md">
        <Image
          src="/aliada.jpeg"
          alt="Identidad de Aliada Studio Print"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-ink/35" />
        <div className="hero-content relative mx-auto w-full max-w-7xl px-4 pb-6 text-paper sm:px-6 sm:pb-8 lg:px-8">
          <p className="mb-1 text-xs font-bold uppercase">Cordoba, Argentina</p>
          <h1 className="max-w-3xl font-display text-3xl font-semibold sm:text-5xl">
            Aliada Studio Print
          </h1>
          <p className="mt-2 max-w-xl text-sm text-paper/90 sm:text-base">
            Etiquetas, stickers y packaging para convertir cada detalle en algo propio.
          </p>
          <Link href="#catalogo" className="mt-4 inline-flex min-h-10 items-center bg-paper px-5 py-2 text-sm font-bold text-ink transition-colors hover:bg-gold">
            Ver coleccion
          </Link>
        </div>
      </section>
      <ProductSection />
    </main>
  );
};

export default App;
