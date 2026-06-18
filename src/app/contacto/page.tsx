import Link from "next/link";
import { FaEnvelope, FaInstagram, FaWhatsapp } from "react-icons/fa6";

const email = "ali_vallej13@hotmail.com";
const instagramHandle = "ali_vallej13";
const whatsappNumber = "54935133707249";
const whatsappMessage = encodeURIComponent(
  "Hola! Quiero consultar por stickers de Aliada."
);

const ContactPage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#ffb066] via-[#f7903d] to-[#d66a1f] py-8 px-4">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-[#f1b27a] bg-[#fff3e6] p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#8a3d00]">Contacto</h1>
          <p className="mt-3 text-[#6e2e00]">
            Escribinos por el canal que prefieras y te respondemos a la brevedad.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
          <a
            href={`mailto:${email}`}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[#f1b27a] bg-[#ffd6b3] p-6 text-center transition-colors hover:bg-[#ffc08a]"
          >
            <FaEnvelope className="h-7 w-7 text-[#8a3d00]" />
            <h2 className="text-lg font-semibold text-[#8a3d00]">Email</h2>
            <p className="break-all text-sm text-[#6e2e00]">{email}</p>
          </a>

          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[#f1b27a] bg-[#ffd6b3] p-6 text-center transition-colors hover:bg-[#ffc08a]"
          >
            <FaWhatsapp className="h-7 w-7 text-[#8a3d00]" />
            <h2 className="text-lg font-semibold text-[#8a3d00]">WhatsApp</h2>
            <p className="text-sm text-[#6e2e00]">{whatsappNumber}</p>
          </a>

          <a
            href={`https://instagram.com/${instagramHandle}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[#f1b27a] bg-[#ffd6b3] p-6 text-center transition-colors hover:bg-[#ffc08a]"
          >
            <FaInstagram className="h-7 w-7 text-[#8a3d00]" />
            <h2 className="text-lg font-semibold text-[#8a3d00]">Instagram</h2>
            <p className="text-sm text-[#6e2e00]">@{instagramHandle}</p>
          </a>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <Link
            href="/"
            className="rounded-full bg-[#a74700] px-6 py-2 font-semibold text-[#fff3e6] transition-colors hover:bg-[#8a3d00]"
          >
            Volver a la tienda
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
