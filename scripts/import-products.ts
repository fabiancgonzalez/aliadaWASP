import { config } from "dotenv";
import Papa from "papaparse";

import { products } from "../src/db/schema";

config({ path: ".env.local" });

type RawProduct = {
  title?: string;
  category?: string;
  image?: string;
  price?: string | number;
  quantity?: string | number;
};

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1Qxh_1sP-d_oX54ZX0APPNtLBYkUXYly7/export?format=csv&gid=88185419";

const toNumber = (value: string | number | undefined, fallback: number) => {
  const converted = Number(String(value ?? "").replace(",", ".").trim());
  return Number.isFinite(converted) ? converted : fallback;
};

async function importProducts() {
  const { db } = await import("../src/db");
  const response = await fetch(SHEET_CSV_URL);
  if (!response.ok) throw new Error("No se pudo descargar el catalogo actual.");

  const parsed = Papa.parse<RawProduct>(await response.text(), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) throw new Error("El catalogo CSV contiene errores.");

  const rows = parsed.data
    .filter((product) => product.title && product.price)
    .map((product) => ({
      title: String(product.title).trim(),
      category: String(product.category ?? "Sin categoria").trim(),
      imageUrl: String(product.image ?? "/aliada.jpeg").trim(),
      priceInCents: Math.round(toNumber(product.price, 0) * 100),
      stock: Math.max(0, Math.trunc(toNumber(product.quantity, 0))),
    }));

  if (!rows.length) throw new Error("No se encontraron productos para importar.");

  for (const row of rows) {
    await db
      .insert(products)
      .values(row)
      .onConflictDoUpdate({
        target: products.title,
        set: { ...row, updatedAt: new Date() },
      });
  }

  console.log(`${rows.length} productos importados en Neon.`);
}

importProducts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});