import { NextRequest, NextResponse } from "next/server";

const DEFAULT_IMAGE_PATH = "/aliada.jpeg";

const isImageContentType = (contentType: string | null) => {
  return Boolean(contentType && contentType.toLowerCase().startsWith("image/"));
};

const fetchImage = async (url: string) => {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
    
  });

  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type");
  if (!isImageContentType(contentType)) {
    return null;
  }

  const body = await response.arrayBuffer();
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType || "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const src = searchParams.get("src");

  const candidates: string[] = [];

  if (id) {
    candidates.push(`https://lh3.googleusercontent.com/d/${id}=s1200`);
    candidates.push(`https://drive.google.com/thumbnail?id=${id}&sz=w1200`);
    candidates.push(`https://drive.google.com/uc?export=view&id=${id}`);
  }

  if (src) {
    candidates.push(src);
  }

  for (const candidate of candidates) {
    try {
      const proxied = await fetchImage(candidate);
      if (proxied) {
        return proxied;
      }
    } catch {
      // Try next candidate URL.
    }
  }

  return NextResponse.redirect(new URL(DEFAULT_IMAGE_PATH, request.url));
}
