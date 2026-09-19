import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

function getAccessToken() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
  }
  return accessToken;
}

export function getMercadoPagoClients() {
  const client = new MercadoPagoConfig({
    accessToken: getAccessToken(),
    options: { timeout: 8_000 },
  });

  return {
    payment: new Payment(client),
    preference: new Preference(client),
  };
}

export function getPublicAppUrl(requestOrigin?: string) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  return requestOrigin?.replace(/\/$/, "") ?? "http://localhost:3000";
}