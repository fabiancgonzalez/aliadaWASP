import type { Metadata } from "next";

import StickerUploadForm from "./sticker-upload-form";

export const metadata: Metadata = {
  title: "Envía tu Sticker | Aliada",
  description: "Subí tu dibujo y lo recibimos para convertirlo en sticker.",
};

export default function EnviaTuStickerPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Envía tu Sticker</h1>
      <p className="mt-3 text-ink/70">
        Envíanos tu dibujo  y lo recibiremos directamente en el estudio.
      </p>
      <StickerUploadForm />
    </main>
  );
}
