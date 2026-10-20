import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { db } from "@/db";
import { stickerSubmissions } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function notifyAdmins(submission: {
  name: string;
  email: string;
  phone: string;
  message: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
}) {
  const recipients = [process.env.ADMIN_EMAIL, process.env.ADMIN_EMAIL_DOS]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  const host = process.env.SMTP_HOST;

  if (!host || recipients.length === 0) {
    console.error("Sticker guardado pero sin correo: falta SMTP_HOST o ADMIN_EMAIL.");
    return;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: recipients,
    replyTo: submission.email,
    subject: `Nuevo sticker de ${submission.name}`,
    html: `<p><b>Nombre:</b> ${escapeHtml(submission.name)}</p>
<p><b>Email:</b> ${escapeHtml(submission.email)}</p>
<p><b>Teléfono:</b> ${escapeHtml(submission.phone)}</p>
<p><b>Mensaje:</b> ${escapeHtml(submission.message) || "-"}</p>`,
    attachments: [
      {
        filename: submission.fileName,
        content: submission.buffer,
        contentType: submission.contentType,
      },
    ],
  });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  const name = String(form.get("name") ?? "").trim().slice(0, 120);
  const email = String(form.get("email") ?? "").trim().slice(0, 160);
  const message = String(form.get("message") ?? "").trim().slice(0, 1000);
  const phone = String(form.get("phone") ?? "").trim().slice(0, 20);

  if (!name || !EMAIL_PATTERN.test(email) || !phone) {
    console.error("Sticker 400 datos", { name: !!name, email, phone: !!phone });
    return NextResponse.json({ error: "INGRESA UN NOMBRE, UN EMAIL Y UN TELÉFONO VALIDOS." }, { status: 400 });
  }
  if (!(file instanceof File) || !ALLOWED_TYPES.includes(file.type)) {
    console.error("Sticker 400 archivo", file instanceof File ? { type: file.type, name: file.name } : typeof file);
    return NextResponse.json({ error: "Subí una imagen (PNG, JPG, WEBP, GIF) o un PDF." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo debe pesar hasta 8 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = (file.name || "sticker").replace(/[^\w.\- ]/g, "_").slice(0, 255);

  try {
    await db.insert(stickerSubmissions).values({
      name,
      email,
      phone,
      message,      
      fileName,
      contentType: file.type,
      data: buffer.toString("base64"),
    });
  } catch (error) {
    console.error("No se pudo guardar el sticker", error);
    return NextResponse.json({ error: "No se pudo guardar el sticker." }, { status: 500 });
  }

  try {
    await notifyAdmins({ name, email, message, phone, fileName, contentType: file.type, buffer });
  } catch (error) {
    console.error("No se pudo enviar el correo del sticker", error);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

