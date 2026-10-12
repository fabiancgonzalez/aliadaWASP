 "use client";
import Link from "next/link";

export default function AdminNav() {
  return (
 
 <nav className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
          <Link href="/admin/products" className="rounded border border-[#dfc7ad] bg-white px-4 py-2 hover:bg-[#f0e2cf]">Productos</Link>
          <Link href="/admin/orders" className="rounded border border-[#dfc7ad] bg-white px-4 py-2 hover:bg-[#f0e2cf]">Pedidos</Link>
          <Link href="/admin/pos" className="rounded border border-[#dfc7ad] bg-white px-4 py-2 hover:bg-[#f0e2cf]">POS</Link>
          <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="rounded border border-[#dfc7ad] bg-white px-4 py-2 hover:bg-[#f0e2cf]">Usuarios (Clerk)</a>
        </nav>
  );
}