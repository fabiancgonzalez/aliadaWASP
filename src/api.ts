import { ProductTypes } from "@/components/product/types";
import { revalidatePath } from "next/cache";

export const data = (signal?: AbortSignal) => {
  return fetch("/api/products", { cache: "no-store", signal }).then((response) => {
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    return response.json() as Promise<ProductTypes[]>;
  });
};

export async function refreshData() {
  revalidatePath("/");
  return Response.json({ revalidated: true });
}
