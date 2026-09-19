export const DEFAULT_PRODUCT_IMAGE = "/aliada.jpeg";

export const normalizeProductImage = (raw: string | undefined) => {
  const value = String(raw ?? "").trim();
  if (!value) return DEFAULT_PRODUCT_IMAGE;

  const driveFileMatch = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (value.includes("drive.google.com") && driveFileMatch?.[1]) {
    return `/api/products/image?id=${driveFileMatch[1]}`;
  }

  const driveOpenMatch = value.match(/[?&]id=([^&]+)/);
  if (value.includes("drive.google.com") && driveOpenMatch?.[1]) {
    return `/api/products/image?id=${driveOpenMatch[1]}`;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return `/api/products/image?src=${encodeURIComponent(value)}`;
  }

  if (value.startsWith("www.")) {
    return `/api/products/image?src=${encodeURIComponent(`https://${value}`)}`;
  }

  return value.startsWith("/") ? value : DEFAULT_PRODUCT_IMAGE;
};