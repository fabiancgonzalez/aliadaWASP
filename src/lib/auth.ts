import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const email = user.primaryEmailAddress?.emailAddress.toLowerCase();
  const adminEmails = [process.env.ADMIN_EMAIL, process.env.ADMIN_EMAIL_DOS]
    .map((adminEmail) => adminEmail?.trim().toLowerCase())
    .filter((adminEmail): adminEmail is string => Boolean(adminEmail));

  if (!email || !adminEmails.includes(email)) notFound();

  return user;
}