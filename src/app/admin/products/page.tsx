"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminNav from "../components/nav/nav";

type Product = {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description: string;
  barcode: string | null;
  priceInCents: number;
  stock: number;
  active: boolean;
};

type FormState = {
  title: string;
  category: string;
  imageUrl: string;
  description: string;
  barcode: string;
  price: string;
  stock: string;
};

const emptyForm: FormState = {
  title: "",
  category: "",
  imageUrl: "",
  description: "",
  barcode: "",
  price: "",
  stock: "0",
};

const NEW_CATEGORY = "__new__";
const inputClass = "rounded border p-2 font-bold";

const previewSrc = (url: string) => {
  if (!url) return "/aliada.jpeg";
  if (url.startsWith("/")) return url;
  return `/api/products/image?src=${encodeURIComponent(url)}`;
};

function ProductFields({
  value,
  onChange,
  categories,
}: {
  value: FormState;
  onChange: (next: FormState) => void;
  categories: string[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [customCategory, setCustomCategory] = useState(
    () => Boolean(value.category) && !categories.includes(value.category)
  );

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo subir la imagen.");
      onChange({ ...value, imageUrl: data.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-2 sm:grid-cols-2  placeholder-black">
      <input placeholder="Titulo" className={inputClass} value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      <div className="flex gap-2 text-[#171615]">
        <select
          aria-label="Categoria"
          className={`${inputClass} min-w-0 flex-1 bg-[#F5783B]`}
          value={customCategory ? NEW_CATEGORY : value.category}
          onChange={(e) => {
            if (e.target.value === NEW_CATEGORY) {
              setCustomCategory(true);
              onChange({ ...value, category: "" });
            } else {
              setCustomCategory(false);
              onChange({ ...value, category: e.target.value });
            }
          }}
        >
          <option value="" disabled>Elegir categoria</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
          <option value={NEW_CATEGORY}>+ Nueva categoria...</option>
        </select>
        {customCategory ? (
          <input placeholder="Nueva categoria" className={`${inputClass} min-w-0 flex-1`} value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })} />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 ">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewSrc(value.imageUrl)} alt="Vista previa" className="h-20 w-20 rounded border object-cover" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="rounded border border-[#a74700] px-4 py-2 text-sm font-bold text-[#171615] disabled:opacity-50">
              {uploading ? "Subiendo..." : "Subir imagen"}
            </button>
            {value.imageUrl ? (
              <button type="button" onClick={() => onChange({ ...value, imageUrl: "" })} className="rounded border px-3 py-2 text-sm">Quitar</button>
            ) : null}
          </div>
          <input placeholder="o pegar URL de imagen" className={inputClass} value={value.imageUrl} onChange={(e) => onChange({ ...value, imageUrl: e.target.value })} />
          {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
        </div>
      </div>

      <textarea placeholder="Descripcion" rows={3} className={`${inputClass} sm:col-span-2`} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} />
      <input placeholder="Codigo de barras (opcional)" inputMode="numeric" className={`${inputClass} sm:col-span-2`} value={value.barcode} onChange={(e) => onChange({ ...value, barcode: e.target.value })} />
      <input placeholder="Precio (ARS)" type="number" className={inputClass} value={value.price} onChange={(e) => onChange({ ...value, price: e.target.value })} />
      <input placeholder="Stock" type="number" className={inputClass} value={value.stock} onChange={(e) => onChange({ ...value, stock: e.target.value })} />
    </div>
  );
}

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editError, setEditError] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [exportImages, setExportImages] = useState(true);
  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ message: string; errors: string[] } | null>(null);

  const load = () =>
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then(setItems);

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((p) => p.category))).sort((a, b) => a.localeCompare(b, "es")),
    [items]
  );

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visible = items.filter(
      (p) => (!filter || p.category === filter) && (!term || p.title.toLowerCase().includes(term))
    );
    const map = new Map<string, Product[]>();
    visible.forEach((p) => map.set(p.category, [...(map.get(p.category) ?? []), p]));
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [items, filter, search]);

  const payload = (f: FormState) => ({
    title: f.title,
    category: f.category,
    imageUrl: f.imageUrl,
    description: f.description,
    barcode: f.barcode,
    priceInCents: Math.round(Number(f.price) * 100),
    stock: Number(f.stock),
  });

  const create = async () => {
    setError("");
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(form)),
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

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditError("");
    setEditForm({
      title: product.title,
      category: product.category,
      imageUrl: product.imageUrl,
      description: product.description ?? "",
      barcode: product.barcode ?? "",
      price: (product.priceInCents / 100).toString(),
      stock: product.stock.toString(),
    });
  };

  const saveEdit = async (id: string) => {
    setEditError("");
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(editForm)),
    });
    if (!res.ok) {
      const body = await res.json();
      setEditError(body.error ?? "Error al guardar los cambios.");
      return;
    }
    setEditingId(null);
    load();
  };

  const importExcel = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/import", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setImportResult({ message: data.error ?? "No se pudo importar.", errors: [] });
      } else {
        setImportResult({
          message: `Importacion lista: ${data.created} nuevos, ${data.updated} actualizados${data.errorCount ? `, ${data.errorCount} con error` : ""}.`,
          errors: data.errors,
        });
        load();
      }
    } catch {
      setImportResult({ message: "No se pudo importar el archivo.", errors: [] });
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = "";
    }
  };

  const exportParams = new URLSearchParams();
  if (filter) exportParams.set("category", filter);
  if (!exportImages) exportParams.set("images", "0");

  return (
    <main className="min-h-screen px-4 py-10 text-[#2f241f]  ">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold">Productos</h1>
        <AdminNav />

        <div className="mt-6 space-y-2 rounded-lg border border-[#D64E0B] bg-[#D64E0B]  p-4">
          <ProductFields value={form} onChange={setForm} categories={categories} />
          <button onClick={create} className="w-full rounded bg-[#a74700] py-2 font-bold text-white">Agregar producto</button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-[#dfc7ad] bg-white p-3">
          <select aria-label="Filtrar por categoria" className="rounded border bg-white p-2" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todas las categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input placeholder="Buscar por titulo" className="min-w-0 flex-1 rounded border p-2" value={search} onChange={(e) => setSearch(e.target.value)} />
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={exportImages} onChange={(e) => setExportImages(e.target.checked)} />
            Con imagenes
          </label>
          <a href={`/api/admin/export?${exportParams.toString()}`} className="rounded bg-[#2f241f] px-4 py-2 text-sm font-bold text-white">
            Exportar Excel{filter ? ` (${filter})` : ""}
          </a>
        </div>

        <div className="mt-3 rounded-lg border border-[#dfc7ad] bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">Carga masiva:</span>
            <a href="/api/admin/import" className="rounded border border-[#2f241f] px-4 py-2 text-sm font-bold">
              Descargar plantilla
            </a>
            <input ref={importRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => importExcel(e.target.files?.[0])} />
            <button type="button" disabled={importing} onClick={() => importRef.current?.click()} className="rounded bg-[#a74700] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              {importing ? "Importando..." : "Subir Excel de productos"}
            </button>
          </div>
          {importResult ? (
            <div className="mt-2 text-sm">
              <p className="font-bold">{importResult.message}</p>
              {importResult.errors.map((m, i) => (
                <p key={i} className="text-red-600">{m}</p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          {groups.length === 0 ? <p className="text-sm text-[#6e625b]">No hay productos.</p> : null}
          {groups.map(([category, list]) => (
            <details key={category} open={Boolean(filter) || Boolean(search)} className="rounded-lg border border-[#dfc7ad] bg-white/70">
              <summary className="cursor-pointer select-none p-3 font-bold">
                {category} <span className="text-sm font-normal text-[#6e625b]">({list.length})</span>
              </summary>
              <div className="space-y-2 p-3 pt-0">
                {list.map((p) => (
                  <div key={p.id} className="rounded-lg border border-[#dfc7ad] bg-white p-3">
                    {editingId === p.id ? (
                      <div className="space-y-2">
                        <ProductFields value={editForm} onChange={setEditForm} categories={categories} />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(p.id)} className="rounded bg-[#a74700] px-4 py-1 text-sm font-bold text-white">Guardar</button>
                          <button onClick={() => { setEditingId(null); setEditError(""); }} className="rounded border px-4 py-1 text-sm">Cancelar</button>
                        </div>
                        {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={previewSrc(p.imageUrl)} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded border object-cover" />
                          <div className="min-w-0">
                            <p className="truncate font-bold">{p.title}</p>
                            <p className="text-sm">${(p.priceInCents / 100).toFixed(2)} · stock {p.stock} · {p.active ? "activo" : "inactivo"}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button onClick={() => startEdit(p)} className="rounded border px-3 py-1 text-sm">Editar</button>
                          <button onClick={() => toggleActive(p)} className="rounded border px-3 py-1 text-sm">{p.active ? "Desactivar" : "Activar"}</button>
                          <button onClick={() => remove(p.id)} className="rounded border border-red-400 px-3 py-1 text-sm text-red-600">Eliminar</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
