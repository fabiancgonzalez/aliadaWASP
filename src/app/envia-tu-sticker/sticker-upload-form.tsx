"use client";

import { FormEvent, useRef, useState } from "react";
import { FilePond, registerPlugin } from "react-filepond";
import type { FilePondServerConfigProps } from "filepond";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);


export default function StickerUploadForm() {
  const pondRef = useRef<FilePond>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [hasFile, setHasFile] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const server: FilePondServerConfigProps["server"] = {
    process: (fieldName, file, _metadata, load, fail, progress, abort) => {
      const form = new FormData(formRef.current ?? undefined);
      form.set("file", file, file.name);

      const request = new XMLHttpRequest();
      request.open("POST", "/api/stickers");
      request.upload.onprogress = (e) => progress(e.lengthComputable, e.loaded, e.total);
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          load("ok");
          return;
        }
        let message = "No se pudo enviar el sticker.";
        try {
          message = JSON.parse(request.responseText).error ?? message;
        } catch {}
        setError(message);
        fail(message);
      };
      request.onerror = () => {
        setError("No se pudo enviar el sticker.");
        fail("Error de red");
      };
      request.send(form);

      return { abort: () => { request.abort(); abort(); } };
    },
    revert: (_uniqueFileId, load) => load(),
  };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!hasFile) {
      setError("Seleccioná un archivo para enviar.");
      return;
    }
    setStatus("sending");
    pondRef.current?.processFiles().catch(() => setStatus("idle"));
  }
  if (status === "done") {
    return (
      <div role="status" className="mt-8 border border-ink/15 p-6">
        <p className="font-bold text-ink">¡Gracias! Recibimos tu sticker.</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 border border-ink px-4 py-2 font-bold text-ink hover:bg-ink/5"
        >
          Enviar otro
        </button>
      </div>
    );
  }

  const inputClass = "mt-1 w-full border border-ink/30 bg-paper px-3 py-2 text-ink";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-8 space-y-5">
      <label className="block text-sm font-bold text-ink">
        Nombre
        <input name="name" required maxLength={120} autoComplete="name" className={inputClass} />
      </label>
      <label className="block text-sm font-bold text-ink">
        Email
        <input name="email" type="email" required maxLength={160} autoComplete="email" className={inputClass} />
      </label>
      <label className="block text-sm font-bold text-ink">
        Telefono
       <input name="phone" type="tel" required maxLength={20} autoComplete="tel" className={inputClass} />
      </label>
      <label className="block text-sm font-bold text-ink">
        Mensaje (opcional)
        <textarea name="message" rows={3} maxLength={1000} className={inputClass} />
      </label>

      <div className="sticker-pond rounded-3xl bg-[#D47E30]   p-4 font-bold  text-black style={{ color: 'black' }} ">
        <FilePond
          ref={pondRef}
          server={server}
          onupdatefiles={(items) => setHasFile(items.length > 0)}
          onprocessfile={(err) => {
            if (err) setStatus("idle");
            else setTimeout(() => setStatus("done"), 1800);
          }}
          allowMultiple={false}
          maxFiles={1}
          name="file"
          credits={false}
          instantUpload={false}
          imagePreviewHeight={220}
          labelIdle='Arrastrá tu dibujo o <span class="filepond--label-action">Buscalo en tu dispositivo</span>'
        />
      </div>
      <p className="text-sm text-ink/70">
        Subí tu dibujo (imagen o PDF, hasta 15 MB) y lo recibiremos directamente en el estudio.
      </p>

      {error && (
        <p role="alert" className="text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="border border-ink bg-ink px-6 py-3 font-bold text-paper transition-colors hover:bg-clay disabled:opacity-50"
      >
        {status === "sending" ? "Enviando…" : "Enviar sticker"}
      </button>
    </form>
  );
}


