"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";

function Product({
  title,
  category,
  image,
  price,
  children,
}: {
  title: string;
  category: string;
  image: string;
  price: number;
  children?: JSX.Element
}) {
  const [imageSrc, setImageSrc] = useState(image || "/aliada.jpeg");

  useEffect(() => {
    setImageSrc(image || "/aliada.jpeg");
  }, [image]);

  const formattedPrice = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <article className="product-card group overflow-hidden border border-ink/15 bg-paper">
      <div className="relative aspect-square overflow-hidden bg-clay/10">
        <img
          src={imageSrc}
          alt={title}
          width={520}
          height={520}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          onError={() => setImageSrc("/aliada.jpeg")}
        />
        <span className="absolute left-3 top-3 bg-paper/95 px-3 py-1 text-xs font-bold uppercase text-ink">
          {category}
        </span>
      </div>
      <div className="flex min-h-40 flex-col justify-between gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
          <span className="whitespace-nowrap font-bold text-clay">{formattedPrice}</span>
        </div>
        {children}
      </div>
    </article>
  );
}
export default Product;
