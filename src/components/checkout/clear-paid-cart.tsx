"use client";

import { useEffect } from "react";

export default function ClearPaidCart() {
  useEffect(() => {
    localStorage.removeItem("aliada-cart:v1");
  }, []);

  return null;
}