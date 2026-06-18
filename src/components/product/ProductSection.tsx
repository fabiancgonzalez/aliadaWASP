/* eslint-disable @next/next/no-img-element */
"use client";
import { ProductTypes } from "./types";
import Product from "../../components/product/Product";
import React, { useEffect, useState } from "react";
import { data } from "../../api";
import CheckoutButton from "../checkout/checkout-btn";
import { FaCartShopping } from "react-icons/fa6";

function ProductSection() {
  const [cart, setCart] = useState<ProductTypes[]>([]);
  const [productsList, setProductsList] = useState<ProductTypes[]>([]);
  const [cartState, setCartState] = useState(false);

  const addToCart = (product: ProductTypes) => {
    setCart((prev) => {
      const productIndex = prev.findIndex(
        (element) => element.title === product.title
      );

      if (productIndex === -1) {
        return [...prev, product];
      }

      const newCart = [...prev];
      newCart[productIndex] = {
        ...newCart[productIndex],
        quantity: newCart[productIndex].quantity + 1,
      };

      return newCart;
    });
  };

  const totalPrice = () => {
    if (cart.length == 0) return;
    const cartTotalPrice = cart.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    return cartTotalPrice || 0;
  };

  const deleteCartItem = (item: string) => {
    const filteredArray: ProductTypes[] = cart.filter(
      (element) => element.title !== item
    );
    setCart(filteredArray);
  };

  const increaseQuantity = (title: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.title === title ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (title: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.title === title
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  useEffect(() => {
    const ProductMap = async () => {
      const productsList = await data();
      return productsList;
    };

    ProductMap()
      .then((data) => {
        setProductsList(data);
      })
      .catch((error) => console.log(error));

  }, []);

  const CartItemComponent = ({
    title,
    image,
    price,
    quantity,
  }: {
    title: string;
    image: string;
    price: number;
    quantity: number;
  }) => {
    return (
      <li className="bg-[#ffd6b3] text-[#6e2e00] border border-[#f1b27a] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 rounded-xl">
        <img
          src={image}
          alt={`Product image on cart of ${title}`}
          className="w-14 h-14 object-cover rounded-full shrink-0"
        />
        <div className="flex flex-col items-start justify-between min-w-0 w-full">
          <h1 className="overflow-ellipsis font-semibold w-full sm:w-[20ch] whitespace-nowrap overflow-hidden">
            {title}
          </h1>
          <span>${price}</span>
          <div className="flex items-center gap-2 mt-1">
            <span>Cantidad:</span>
            <button
              type="button"
              className="h-7 w-7 rounded-full bg-[#8a3d00] text-[#fff3e6] font-bold"
              onClick={() => decreaseQuantity(title)}
            >
              -
            </button>
            <span className="w-6 text-center font-semibold">{quantity}</span>
            <button
              type="button"
              className="h-7 w-7 rounded-full bg-[#8a3d00] text-[#fff3e6] font-bold"
              onClick={() => increaseQuantity(title)}
            >
              +
            </button>
          </div>
        </div>
        <button
          className="bg-red-500 text-white px-4 py-1 rounded-full w-full sm:w-auto"
          onClick={() => deleteCartItem(title)}
        >
          Quitar
        </button>
      </li>
    );
  };

  return (
    <>
      <button
        className="fixed bottom-10 right-4 z-40 bg-[#a74700] backdrop-blur-xl px-6 sm:px-14 py-2 rounded-full text-white font-semibold flex items-center justify-center gap-4 border-2 border-[#ffd6b3]"
        onClick={() => setCartState(!cartState)}
      >
        {cart.length}<FaCartShopping className="w-6 h-6" />
      </button>
      {cartState ? (
        <section className="z-30 bg-[#6e2e00] text-[#fff3e6] flex flex-col items-center justify-between fixed top-24 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 p-4 sm:p-5 rounded-2xl w-[calc(100vw-1rem)] max-w-md md:min-w-96 gap-4 border border-[#f1b27a] max-h-[70vh]">
          <ul className="flex flex-col items-center justify-start gap-2 overflow-y-auto w-full">
            {cart.map((item, key) => {
              const { title, price, image, quantity } = item as ProductTypes;
              return (
                <CartItemComponent
                  key={key}
                  title={title}
                  price={price}
                  image={image}
                  quantity={quantity}
                ></CartItemComponent>
              );
            })}
          </ul>
          <div className="flex items-center justify-between w-full px-4 py-2 font-semibold">
            <span className="text-md">Total:</span>
            <span className="text-md">$ {totalPrice() || 0}</span>
          </div>
          {cart.length !== 0 ? (
            <CheckoutButton
              array={cart}
              totalPrice={totalPrice() || 0}
              onCartUpdate={setCart}
            />
          ) : null}
        </section>
      ) : null}

      <article className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {productsList &&
          productsList.map((product, key) => {
            const { title, category, price, image } = product as ProductTypes;

            return (
              <Product
                key={key}
                title={title}
                category={category}
                price={price}
                image={image}
              >
                <button
                  className="w-full bg-[#a74700] text-[#fff3e6] px-4 py-2 rounded-md hover:bg-[#8a3d00] transition-all buttoneitor"
                  onClick={() =>
                    addToCart({
                      title: title,
                      price: price,
                      image: image,
                      quantity: 1,
                      category: category,
                    })
                  }
                >
                  Añadir al carrito
                </button>
              </Product>
            );
          })}
      </article>
    </>
  );
}

export default ProductSection;
