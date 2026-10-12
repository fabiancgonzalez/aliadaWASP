import { asc, eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { db } from "@/db";
import { productImages, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

async function loadImageBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    if (imageUrl.startsWith("/api/uploads/")) {
      const id = imageUrl.match(UUID_RE)?.[0];
      if (!id) return null;
      const [row] = await db.select().from(productImages).where(eq(productImages.id, id)).limit(1);
      return row ? Buffer.from(row.data, "base64") : null;
    }
    if (imageUrl.startsWith("/")) {
      return await readFile(path.join(process.cwd(), "public", imageUrl));
    }
    const driveId =
      imageUrl.includes("drive.google.com")
        ? imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? imageUrl.match(/[?&]id=([^&]+)/)?.[1]
        : null;
    const remote = driveId
      ? `https://lh3.googleusercontent.com/d/${driveId}=s600`
      : imageUrl.startsWith("www.")
        ? `https://${imageUrl}`
        : imageUrl;
    if (!/^https?:\/\//.test(remote)) return null;
    const res = await fetch(remote, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  await requireAdmin();
  const category = request.nextUrl.searchParams.get("category")?.trim();
  const withImages = request.nextUrl.searchParams.get("images") !== "0";

  const all = await db.select().from(products).orderBy(asc(products.category), asc(products.title));
  const rows = category
    ? all.filter((p) => p.category.toLowerCase() === category.toLowerCase())
    : all;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Productos", {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.columns = [
    { header: "Imagen", key: "image", width: 18 },
    { header: "Producto", key: "title", width: 34 },
    { header: "Categoria", key: "category", width: 20 },
    { header: "Descripcion", key: "description", width: 50 },
    { header: "Precio (ARS)", key: "price", width: 16, style: { numFmt: '"$"#,##0.00' } },
    { header: "Stock", key: "stock", width: 8 },
  ];
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA74700" } };

  for (let i = 0; i < rows.length; i++) {
    const p = rows[i];
    const row = sheet.addRow({
      title: p.title,
      category: p.category,
      description: p.description,
      price: p.priceInCents / 100,
      stock: p.stock,
    });
    row.height = withImages ? 90 : 20;
    row.alignment = { vertical: "middle", wrapText: true };

    if (!withImages) continue;
    const raw = await loadImageBuffer(p.imageUrl);
    if (!raw) continue;
    try {
      const png = await sharp(raw)
        .resize(160, 160, { fit: "contain", background: "#ffffff" })
        .png()
        .toBuffer();
      const imageId = workbook.addImage({ buffer: png as unknown as ExcelJS.Buffer, extension: "png" });
      sheet.addImage(imageId, {
        tl: { col: 0.1, row: i + 1.1 },
        ext: { width: 110, height: 110 },
      });
    } catch {
      // Sin imagen legible: la fila queda solo con texto.
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const name = category ? `productos-${category.replace(/[^\w-]+/g, "_")}` : "productos";
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}.xlsx"`,
    },
  });
}
