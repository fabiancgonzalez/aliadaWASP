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

  return (
    <div
      className="bg-[#ffd6b3] px-6 py-6 flex flex-col items-center justify-center gap-4 rounded-lg shadow-xl border border-[#f1b27a]"
    >
      <h1 className="text-md text-[#8a3d00] font-semibold">{title}</h1>
      <img
        src={imageSrc}
        alt="locuras"
        width={100}
        height={100}
        className="w-full h-48 object-cover rounded-3xl"
        onError={() => setImageSrc("/aliada.jpeg")}
      />
      <h2 className="text-md text-[#8a3d00]">{category}</h2>
      <span className="text-lg text-[#6e2e00] font-bold">${price}</span>
      {children}
    </div>
  );
}
export default Product;
