"use client";

import { useState } from "react";

const AGENTICA_URL =
  process.env.NEXT_PUBLIC_AGENTICA_URL ?? "http://localhost:8000";

export default function AgenticaWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Asistente virtual Aliada IA"
          className="fixed bottom-20 right-3 z-50 flex h-[72svh] max-h-[640px] w-[calc(100vw-1.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-ink/15 bg-paper shadow-2xl sm:bottom-24 sm:right-6"
        >
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-paper">
            <span className="font-display text-lg font-semibold">
              🎨 Aliada IA · Agentes
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente virtual"
              className="rounded-full px-2 py-1 text-sm font-bold text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper"
            >
              ✕
            </button>
          </div>
          <iframe
            src={AGENTICA_URL}
            title="Asistente virtual Aliada IA"
            allow="microphone"
            className="w-full flex-1 border-0"
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar asistente virtual" : "Abrir asistente virtual"}
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-clay text-2xl text-paper shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
