import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "../app/globals.css";
import { refreshData } from "../api";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aliada Stickers",
  description: "Venta de stickers personalizados de alta calidad. ¡Haz tu pedido ahora y decora tus objetos con estilo!",
};

export default function RootLayout({
  children,
}: {
  children: React.JSX.Element;
}) {
  refreshData();

  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="w-full bg-[#fff3e6] border-b border-[#f1b27a] shadow-sm">
          <div className="mx-auto w-[95%] max-w-7xl flex items-center justify-between py-3">
            <Link href="/" className="flex items-center gap-4">
              <Image
                src="/aliada.jpeg"
                alt="Logo de Aliada"
                width={96}
                height={96}
                className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-full ring-4 ring-[#f7903d]"
              />
              <span className="text-[#8a3d00] text-xl sm:text-2xl font-bold">
                Aliada Stickers
              </span>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/contacto"
                className="rounded-full bg-[#a74700] px-4 sm:px-6 py-2 font-semibold text-[#fff3e6] transition-colors hover:bg-[#8a3d00]"
              >
                Contacto
              </Link>
              <Link
                href="/"
                className="rounded-full border border-[#a74700] bg-[#ffd6b3] px-4 sm:px-6 py-2 font-semibold text-[#8a3d00] transition-colors hover:bg-[#ffc08a]"
              >
                Tienda
              </Link>
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
