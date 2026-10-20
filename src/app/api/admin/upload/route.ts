import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { productImages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 16 * 1024 * 1024;

export async function POST(request: NextRequest) {
  await requireAdmin();
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Selecciona un archivo de imagen." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 16 MB." }, { status: 400 });
  }

  try {
    const original = Buffer.from(await file.arrayBuffer());
    let buffer: Buffer = original;
    let contentType = file.type;
    try {
      const sharp = (await import("sharp")).default;
      buffer = await sharp(original)
        .rotate()
        .resize(1000, 1000, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      contentType = "image/webp";
    } catch {
      // Sin sharp se guarda la imagen original.
    }

    const [created] = await db
      .insert(productImages)
      .values({ contentType, data: buffer.toString("base64") })
      .returning({ id: productImages.id });

    return NextResponse.json({ url: `/api/uploads/${created.id}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la imagen." }, { status: 400 });
  }
}
