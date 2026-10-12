"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function StoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-ink transition-colors hover:text-clay"
      >
        Elegir la Tienda ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 min-w-48 border border-ink/15 bg-paper shadow-lg">
          <Link href="/#catalogo" onClick={close} className="block px-4 py-3 text-ink hover:bg-ink/5 hover:text-clay">
            Aliada Print Studio
          </Link>
          <Link href="/beauty" onClick={close} className="block px-4 py-3 text-ink hover:bg-ink/5 hover:text-clay">
            Aliada Beauty
          </Link>
        </div>
      )}
    </div>
  );
}
