import ProductSection from "@/components/product/ProductSection";

const App = () => {
  return (
    <>
      <main className="min-h-screen flex flex-col items-center py-8 bg-gradient-to-b from-[#ffb066] via-[#f7903d] to-[#d66a1f]">
        <section className="bg-[#fff3e6] w-[80%] mx-auto flex flex-col items-center justify-center px-8 py-8 gap-10 rounded-2xl shadow-lg border border-[#f1b27a] sm:w-[95%]">
          <div className="flex flex-col items-center gap-4 ">
            <h1 className="text-4xl font-bold text-[#8a3d00]">⭐ Aliada Stickers ⭐ </h1>
          </div>
          <ProductSection></ProductSection>
        </section>
      </main>
    </>
  );
};

export default App;
