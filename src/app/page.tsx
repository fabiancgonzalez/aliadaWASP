/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import ProductSection from "@/components/product/ProductSection";

const App = () => {
  return (
    <>
      <main className="min-h-screen flex flex-col items-center py-8 bg-gradient-to-b from-[#ffb066] via-[#f7903d] to-[#d66a1f]">
        <section className="bg-[#fff3e6] w-[80%] mx-auto flex flex-col items-center justify-center px-8 py-8 gap-10 rounded-2xl shadow-lg border border-[#f1b27a] sm:w-[95%]">
          <div className="flex flex-col items-center gap-4 ">
            <img
              src="/aliada.jpeg"
              alt="Logo de Aliada"
              className="rounded-full w-40 h-40 object-cover ring-4 ring-[#f7903d]"
            />
            <h1 className="text-4xl font-bold text-[#8a3d00]">⭐ Aliada Stickers ⭐ </h1>
            <Link
              href="/contacto"
              className="rounded-full bg-[#a74700] px-6 py-2 font-semibold text-[#fff3e6] transition-colors hover:bg-[#8a3d00]"
            >
              Contacto
            </Link>
          </div>
          <ProductSection></ProductSection>
        </section>
      </main>
    </>
  );
};

export default App;
