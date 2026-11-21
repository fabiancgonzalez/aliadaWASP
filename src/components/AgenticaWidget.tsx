"use client";

import { useEffect, useRef, useState } from "react";

const AGENTICA_URL = (
  process.env.NEXT_PUBLIC_AGENTICA_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

interface ApprovalData {
  producto?: string;
  precio_actual?: string;
  nuevo_precio?: string;
  stock_actual?: string;
  nuevo_stock?: string;
}

interface ChatMessage {
  id: number;
  role: "user" | "bot";
  text: string;
  agent?: string;
  approval?: ApprovalData | null;
  approvalResolved?: boolean;
}

const GREETING: ChatMessage = {
  id: 0,
  role: "bot",
  agent: "Orquestador",
  text: "¡Hola! Habla o escribe para consultar stickers, armar un pedido, pagar por transferencia o Mercado Pago, o revisar métricas de negocio.",
};

export default function AgenticaWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [upName, setUpName] = useState("");
  const [upEmail, setUpEmail] = useState("");
  const [upMsg, setUpMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const nextId = useRef(1);
  const chatRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  function pushMessage(msg: Omit<ChatMessage, "id">) {
    setMessages((prev) => [...prev, { ...msg, id: nextId.current++ }]);
  }

  function speak(texto: string) {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto.replace(/[*#_`-]/g, ""));
    utterance.lang = "es-AR";
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(texto: string) {
    const clean = texto.trim();
    if (!clean || sending) return;
    pushMessage({ role: "user", text: clean });
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${AGENTICA_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, thread_id: threadId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setThreadId(data.thread_id);
      pushMessage({ role: "bot", text: data.reply, agent: data.agent, approval: data.approval_data });
      speak(data.reply);
    } catch {
      pushMessage({ role: "bot", agent: "Sistema", text: "Error de conexión con el asistente. Intentá de nuevo." });
    } finally {
      setSending(false);
    }
  }

  async function sendApproval(decision: "si" | "no", msgId: number) {
    if (!threadId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, approvalResolved: true } : m))
    );
    try {
      const res = await fetch(`${AGENTICA_URL}/chat/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, decision }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      pushMessage({ role: "bot", text: data.reply, agent: data.agent });
      speak(data.reply);
    } catch {
      pushMessage({ role: "bot", agent: "Sistema", text: "Error al enviar la decisión." });
    }
  }

  async function uploadSticker() {
    if (!file) return;
    const nombre = upName.trim();
    const email = upEmail.trim();
    if (!nombre || !email) {
      alert("Completá tu nombre y email para enviar el sticker.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", nombre);
    fd.append("email", email);
    fd.append("message", upMsg.trim());

    setUploading(true);
    try {
      const res = await fetch(`${AGENTICA_URL}/upload-sticker`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al subir el archivo.");
      setFile(null);
      setUpMsg("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await sendMessage(
        `Acabo de subir mi sticker personalizado "${data.file_name}" (envío #${data.submission_id}) ` +
          `a nombre de ${nombre} (${email}). ¿Podés revisar si el archivo es apto para impresión?`
      );
    } catch (err) {
      pushMessage({
        role: "bot",
        agent: "Sistema",
        text: `Error al subir el sticker: ${err instanceof Error ? err.message : "error desconocido"}`,
      });
    } finally {
      setUploading(false);
    }
  }

  function toggleMic() {
    const w = window as unknown as Record<string, unknown>;
    const SpeechRecognition = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
      | (new () => {
          lang: string;
          interimResults: boolean;
          onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
          onend: (() => void) | null;
          onerror: (() => void) | null;
          start: () => void;
          stop: () => void;
        })
      | undefined;

    if (!SpeechRecognition) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    window.speechSynthesis?.cancel();
    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.interimResults = false;
    recognition.onresult = (e) => sendMessage(e.results[0][0].transcript);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  const micSupported =
    typeof window !== "undefined" &&
    (("SpeechRecognition" in window) || ("webkitSpeechRecognition" in window));

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Asistente virtual Aliada IA"
          className="fixed bottom-20 right-3 z-50 flex h-[72svh] max-h-[640px] w-[calc(100vw-1.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-ink/15 bg-slate-900 text-slate-50 shadow-2xl sm:bottom-24 sm:right-6"
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-3">
            <span className="font-display text-lg font-semibold">🎨 Aliada IA · Agentes</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setVoiceEnabled((v) => !v);
                  if (voiceEnabled) window.speechSynthesis?.cancel();
                }}
                className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/30"
              >
                {voiceEnabled ? "🔊 Voz: ON" : "🔇 Voz: OFF"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar asistente virtual"
                className="rounded-full px-2 py-1 text-sm font-bold text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div ref={chatRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "max-w-[82%] self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-blue-500 px-4 py-3 text-sm leading-relaxed"
                    : "max-w-[82%] self-start whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-slate-700 px-4 py-3 text-sm leading-relaxed"
                }
              >
                {m.role === "bot" && (
                  <span className="mb-1 block rounded bg-slate-900 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-sky-400">
                    {m.agent ?? "Agente"}
                  </span>
                )}
                {m.text}
                {m.approval && !m.approvalResolved && (
                  <div className="mt-2 rounded-xl border border-amber-500 bg-amber-950/80 p-3">
                    <strong>⚠️ Aprobación Super_Admin requerida:</strong>
                    <br />
                    Producto: {m.approval.producto}
                    <br />
                    Precio: {m.approval.precio_actual} ➔ {m.approval.nuevo_precio}
                    <br />
                    Stock: {m.approval.stock_actual} ➔ {m.approval.nuevo_stock}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => sendApproval("si", m.id)}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"
                      >
                        ✅ Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => sendApproval("no", m.id)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600"
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                )}
                {m.approval && m.approvalResolved && (
                  <em className="mt-1 block text-xs text-slate-300">Decisión enviada.</em>
                )}
              </div>
            ))}
            {sending && (
              <div className="self-start rounded-2xl rounded-bl-sm bg-slate-700 px-4 py-3 text-sm text-slate-300">
                Escribiendo…
              </div>
            )}
          </div>

          {file && (
            <div className="flex flex-col gap-2 border-t border-slate-700 bg-slate-800 p-3">
              <span className="text-xs font-semibold text-sky-400">
                📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </span>
              <input
                type="text"
                placeholder="Tu nombre *"
                value={upName}
                onChange={(e) => setUpName(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-400"
              />
              <input
                type="email"
                placeholder="Tu email *"
                value={upEmail}
                onChange={(e) => setUpEmail(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-400"
              />
              <input
                type="text"
                placeholder="Mensaje o indicaciones (opcional)"
                value={upMsg}
                onChange={(e) => setUpMsg(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs outline-none focus:border-sky-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={uploadSticker}
                  disabled={uploading}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {uploading ? "Subiendo…" : "Enviar sticker"}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-950 p-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.svg,.webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Enviar tu sticker (foto o archivo)"
              title="Enviar tu sticker (foto o archivo)"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-700 text-lg transition-colors hover:bg-slate-600"
            >
              📎
            </button>
            {micSupported && (
              <button
                type="button"
                onClick={toggleMic}
                aria-label="Hablar por micrófono"
                title="Hablar por micrófono"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg transition-colors ${
                  listening ? "animate-pulse bg-red-500" : "bg-pink-500 hover:bg-pink-600"
                }`}
              >
                🎤
              </button>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage(input);
              }}
              placeholder="Escribe o toca el micrófono..."
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={sending}
              className="shrink-0 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
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
