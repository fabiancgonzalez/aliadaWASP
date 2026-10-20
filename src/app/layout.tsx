import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Alegreya_Sans, Cormorant_Garamond } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import StoreMenu from "@/components/StoreMenu";
import "../app/globals.css";

const bodyFont = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});
const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Aliada Stickers",
  description: "Venta de stickers personalizados de alta calidad. ¡Haz tu pedido ahora y decora tus objetos con estilo!",
};

export default function RootLayout({
  children,
}: {
  children: React.JSX.Element;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={`${bodyFont.variable} ${displayFont.variable} font-sans`}>
        <header className="sticky top-0 z-40 w-full border-b border-ink/15 bg-paper/95 backdrop-blur-md">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3" aria-label="Aliada Studio Print, inicio">
              <Image
                src="/aliadacirculo.png"
                alt="Logo de Aliada"
                width={52}
                height={52}
                className="h-12 w-12 rounded-full"
              />
              <span className="font-display text-xl font-bold text-ink sm:text-2xl">
                Aliada
              </span>
            </Link>

            <nav className="flex items-center gap-3 text-sm font-bold sm:gap-6">
              <StoreMenu />
              <Link
                href="/envia-tu-sticker"
                className="text-ink transition-colors hover:text-clay"
              >
                Envía tu Sticker
              </Link>
              <Link
                href="/contacto"
                className="text-ink transition-colors hover:text-clay"
              >
                Contacto
              </Link>
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="border border-ink bg-ink px-4 py-2 text-paper transition-colors hover:bg-clay"
                >
                  Ingresar
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/admin" className="text-ink transition-colors hover:text-clay">
                  Panel
                </Link>
                <UserButton />
              </SignedIn>
            </nav>
          </div>
        </header>

        {children}
        <footer className="border-t border-ink/15 bg-ink px-4 py-8 text-paper">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="font-display text-xl font-semibold">Aliada Studio Print</p>
            <p className="text-sm text-paper/65">Etiquetas, stickers y packaging hechos en Cordoba.</p>
          </div>
        </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
