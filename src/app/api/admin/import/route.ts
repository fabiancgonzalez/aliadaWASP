import { eq, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 2000;

const COLUMNS = [
  { header: "Producto", key: "title", width: 34 },
  { header: "Categoria", key: "category", width: 22 },
  { header: "Descripcion", key: "description", width: 50 },
  { header: "Codigo de barras", key: "barcode", width: 20 },
  { header: "Precio (ARS)", key: "price", width: 16 },
  { header: "Stock", key: "stock", width: 8 },
  { header: "Imagen URL", key: "imageUrl", width: 40 },
];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const HEADER_KEYS: Record<string, string> = {
  producto: "title",
  titulo: "title",
  nombre: "title",
  categoria: "category",
  descripcion: "description",
  "codigo de barras": "barcode",
  codigo: "barcode",
  barcode: "barcode",
  "precio ars": "price",
  precio: "price",
  stock: "stock",
  "imagen url": "imageUrl",
  url: "imageUrl",
};

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (value instanceof Date) return value.toISOString();
    if ("richText" in value) return value.richText.map((r) => r.text).join("").trim();
    if ("text" in value && typeof value.text === "string") return value.text.trim();
    if ("result" in value && value.result !== undefined && value.result !== null) return String(value.result).trim();
    return "";
  }
  return String(value).trim();
}

function parsePrice(raw: string): number {
  let s = raw.replace(/[^\d.,-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  return Number(s);
}

// Plantilla con una fila de ejemplo.
export async function GET() {
  await requireAdmin();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Productos", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = COLUMNS;
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA74700" } };
  sheet.addRow({
    title: "Crema de manos ejemplo",
    category: "Belleza y Cosmetica",
    description: "Descripcion del producto",
    barcode: "7790000000001",
    price: 4500,
    stock: 10,
    imageUrl: "",
  });
  sheet.getColumn("barcode").numFmt = "@";
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-productos.xlsx"',
    },
  });
}

// Alta o actualizacion masiva: coincide por codigo de barras o, si no hay, por titulo.
export async function POST(request: NextRequest) {
  await requireAdmin();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ error: "Subi un archivo Excel (.xlsx)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera los 5 MB." }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load((await file.arrayBuffer()) as ArrayBuffer);
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo Excel." }, { status: 400 });
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) return NextResponse.json({ error: "El Excel no tiene hojas." }, { status: 400 });

  const colByKey = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, col) => {
    const key = HEADER_KEYS[norm(cellText(cell.value))];
    if (key && !colByKey.has(key)) colByKey.set(key, col);
  });
  for (const required of ["title", "category", "price"]) {
    if (!colByKey.has(required)) {
      return NextResponse.json(
        { error: "Faltan columnas obligatorias: Producto, Categoria y Precio. Usa la plantilla." },
        { status: 400 }
      );
    }
  }
  if (sheet.rowCount - 1 > MAX_ROWS) {
    return NextResponse.json({ error: `Maximo ${MAX_ROWS} filas por archivo.` }, { status: 400 });
  }

  const get = (row: ExcelJS.Row, key: string) => {
    const col = colByKey.get(key);
    return col ? cellText(row.getCell(col).value) : "";
  };

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const title = get(row, "title");
    const category = get(row, "category");
    const priceRaw = get(row, "price");
    if (!title && !category && !priceRaw) continue;

    const price = parsePrice(priceRaw);
    if (!title || !category || !Number.isFinite(price) || price < 0) {
      errors.push(`Fila ${r}: faltan datos o el precio no es valido.`);
      continue;
    }
    const stockRaw = get(row, "stock");
    const stock = stockRaw ? Math.trunc(Number(stockRaw)) : 0;
    if (!Number.isFinite(stock) || stock < 0) {
      errors.push(`Fila ${r}: stock no valido.`);
      continue;
    }

    const barcode = get(row, "barcode").replace(/\.0+$/, "") || null;
    const description = get(row, "description");
    const imageUrl = get(row, "imageUrl");
    const priceInCents = Math.round(price * 100);

    try {
      const [existing] = barcode
        ? await db.select({ id: products.id }).from(products).where(eq(products.barcode, barcode)).limit(1)
        : await db
            .select({ id: products.id })
            .from(products)
            .where(sql`lower(${products.title}) = ${title.toLowerCase()}`)
            .limit(1);

      if (existing) {
        await db
          .update(products)
          .set({
            title,
            category,
            priceInCents,
            stock,
            ...(description ? { description } : {}),
            ...(imageUrl ? { imageUrl } : {}),
            ...(barcode ? { barcode } : {}),
            updatedAt: new Date(),
          })
          .where(eq(products.id, existing.id));
        updated++;
      } else {
        await db.insert(products).values({
          title,
          category,
          description,
          barcode,
          priceInCents,
          stock,
          imageUrl: imageUrl || "/aliada.jpeg",
        });
        created++;
      }
    } catch {
      errors.push(`Fila ${r}: no se pudo guardar "${title}" (titulo o codigo de barras duplicado).`);
    }
  }

  return NextResponse.json({ created, updated, errors: errors.slice(0, 50), errorCount: errors.length });
}
