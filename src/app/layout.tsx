import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
