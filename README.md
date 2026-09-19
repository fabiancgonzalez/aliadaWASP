## Ecommerce con Next.js con checkout a whatsapp.

- Carrito con total de compra
- Checkout con un mensaje de whatsapp
- Papaparse para convertir el archivo .CSV

## Utiliza Google spreadsheets para renderizar los productos

Podes ver los productos que utilicé en la hoja de calculos [TOCANDO ACÁ](https://docs.google.com/spreadsheets/d/1wTePJ97hPGT5slTkJte_flnADQD9CMYI69tDBTaQUEo/edit?usp=sharing).
La idea es poder brindarle al cliente un interfaz un poco mas amigable, al poder editar los productos directamente desde una hoja de calculo.

## Deployed

Aplicación desplegada [TOCANDO ACÁ](https://ecommerce-nextjs-victorioo.vercel.app/).

## Mercado Pago

- Solucion: Checkout Pro (Preferences API)
- Aplicacion: Aliada Studio Print (`8628001568491154`)
- Webhook: `https://aliadaa.vercel.app/api/webhooks/mercado-pago`
- Evento: `payment`

La tienda recalcula precios en servidor y confirma pedidos solo mediante webhooks firmados. Para pasar a cobros reales, activar las credenciales productivas en Mercado Pago, reemplazar `MERCADOPAGO_ACCESS_TOKEN` en Vercel y establecer `MERCADOPAGO_USE_SANDBOX=false`.




