"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  priceInCents: number;
  stock: number;
  active: boolean;
};

const emptyForm = { title: "", category: "", imageUrl: "", price: "", stock: "0" };

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = () =>
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then(setItems);

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setError("");
    const price = Math.round(Number(form.price) * 100);
    const stock = Number(form.stock);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        category: form.category,
        imageUrl: form.imageUrl,
        priceInCents: price,
        stock,
      }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Error al crear el producto.");
      return;
    }
    setForm(emptyForm);
    load();
  };

  const toggleActive = async (product: Product) => {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !product.active }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminar este producto?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <main className="min-h-screen px-4 py-10 text-[#2f241f]">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold">Productos</h1>

        <div className="mt-6 grid gap-2 rounded-lg border border-[#dfc7ad] bg-white p-4 sm:grid-cols-2">
          <input placeholder="Titulo" className="rounded border p-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Categoria" className="rounded border p-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input placeholder="URL de imagen" className="rounded border p-2 sm:col-span-2" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <input placeholder="Precio (ARS)" type="number" className="rounded border p-2" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input placeholder="Stock" type="number" className="rounded border p-2" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <button onClick={create} className="sm:col-span-2 rounded bg-[#a74700] py-2 font-bold text-white">Agregar producto</button>
          {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="mt-6 space-y-2">
          {items.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#dfc7ad] bg-white p-3">
              <div>
                <p className="font-bold">{p.title} <span className="font-normal text-sm text-[#6e625b]">({p.category})</span></p>
                <p className="text-sm">${(p.priceInCents / 100).toFixed(2)} · stock {p.stock} · {p.active ? "activo" : "inactivo"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(p)} className="rounded border px-3 py-1 text-sm">{p.active ? "Desactivar" : "Activar"}</button>
                <button onClick={() => remove(p.id)} className="rounded border border-red-400 px-3 py-1 text-sm text-red-600">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
