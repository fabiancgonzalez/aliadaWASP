import ProductSection from "@/components/product/ProductSection";
import Image from "next/image";
import Link from "next/link";

const App = () => {
  return (
    <main>
   

        <section 
  className="relative flex h-[34svh] min-h-[260px] max-h-[360px] items-center justify-center overflow-hidden rounded-b-2xl bg-clay shadow-md"  style={{ 
    backgroundImage: "url('/aliadaround.jpeg')",
    backgroundRepeat: "repeat", 
    backgroundSize: "265px" 
  }}>
  <div className="absolute inset-0 bg-white/05" />
   <div className="hero-content relative z-10 mx-auto w-full max-w-2xl px-4 py-8 text-center text-black sm:px-6 lg:px-8">
    <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-black/60">
    
    </p>
  
   <h1 className="font-display text-5xl font-black sm:text-4xl text-black drop-shadow-sm leading-tight">
      Aliada Studio Print
    </h1>
       <p className="mt-3 text-sm font-bold text-black/90 sm:text-base max-w-none text-center whitespace-nowrap">
     {/* Etiquetas, stickers y packaging para convertir cada detalle en algo propio. */}
    </p>
          <Link href="#catalogo" className="rounded-full bg-black px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-black/80 transition-all">
            Ver coleccion
          </Link>
        </div>
      </section>
      <ProductSection />
    </main>
  );
};

export default App;
