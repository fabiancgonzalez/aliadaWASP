import Image from "next/image";
import { FaEnvelope, FaInstagram, FaWhatsapp } from "react-icons/fa6";

const email = "ali_vallej13@hotmail.com";
const instagramHandle = "aliada_studio";
const whatsappNumber = "5493512095271";
const whatsappMessage = encodeURIComponent(
  "Hola! Quiero consultar por stickers de Aliada."
);

const ContactPage = () => {
  return (
    <main className="min-h-[calc(100vh-5rem)] px-4 py-16 sm:px-6">
      <section className="mx-auto w-full max-w-5xl">
        <div className="max-w-2xl border-b border-ink/20 pb-8">
          <p className="text-sm font-bold uppercase text-clay">Hablemos</p>
          <h1 className="font-display text-5xl font-semibold text-ink sm:text-6xl">Tu idea empieza aca.</h1>
          <p className="mt-4 text-lg text-ink/70">
            Contanos que queres crear y te ayudamos a encontrar el formato indicado.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <a
            href={`mailto:${email}`}
            className="flex min-h-52 flex-col justify-between border border-ink/15 bg-paper p-6  hover:border-clay font-bold"
            style={{ backgroundColor: "#e56510" }}
          >
            <FaEnvelope className="h-7 w-7 text-clay" aria-hidden="true" style={{ color: "#6f2c00" }} />
            <Image src="/qr-mailAlicia.png" alt="QR para email de Alicia" width={96} height={96} className="mx-auto h-24 w-24 border border-ink/10 bg-white p-1" />
            <div><h2 className="font-display text-2xl font-semibold">Email</h2><p className="mt-1 break-all text-sm text-ink/95">{email}</p></div>
          </a>

          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-52 flex-col justify-between border border-ink/15 bg-paper p-6 transition-colors hover:border-clay font-bold"
            style={{backgroundColor: "lightgreen" }}
          >
            <FaWhatsapp className="h-7 w-7 text-olive" aria-hidden="true" style={{ color: "#015510" }} />
            <Image src="/qrcodewhatsappAliciaBiznes.png" alt="QR para WhatsApp de Alicia" width={96} height={96} className="mx-auto h-24 w-24 border border-ink/10 bg-white p-1" />
            <div><h2 className="font-display text-2xl font-semibold">WhatsApp</h2><p className="mt-1 text-sm text-ink/95" >+54 9 351 209-5271</p></div>
          </a>

          <a
            href={`https://instagram.com/${instagramHandle}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-52 flex-col justify-between border border-ink/15 bg-paper p-6 transition-colors hover:border-clay font-bold"
            style={{backgroundColor: "pink " }}
          >
            <FaInstagram className="h-7 w-7 text-gold" aria-hidden="true" style={{ color: "#aa085f" }} />
            <Image src="/aliada_studio_qr.png" alt="QR para Instagram de Aliada" width={96} height={96} className="mx-auto h-24 w-24 border border-ink/10 bg-white p-1" />
            <div><h2 className="font-display text-2xl font-semibold">Instagram</h2><p className="mt-1 text-sm text-ink/95">@{instagramHandle}</p></div>
          </a>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
