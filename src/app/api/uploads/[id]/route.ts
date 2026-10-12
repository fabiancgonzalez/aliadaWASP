import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { productImages } from "@/db/schema";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return new NextResponse(null, { status: 404 });

  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, params.id))
    .limit(1);
  if (!image) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(image.data, "base64"), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
