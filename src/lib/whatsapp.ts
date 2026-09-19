export const ADMIN_WHATSAPP_NUMBER = "5493512095271";
export const MP_ALIAS = "ada.sofia.agustin";
export const MP_ALIAS_NAME = "Alicia Monica Vallejo";
export const TRANSFER_CONFIRMATION_MESSAGE =
  "Una vez realizada la transferencia a Alicia, se procedera a preparar el pedido solicitado. Muchas Gracias";

export function buildWhatsAppLink(number: string, text: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
