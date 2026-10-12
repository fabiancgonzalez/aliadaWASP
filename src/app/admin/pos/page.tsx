import { requireAdmin } from "@/lib/auth";

import POS from "../../pos/POS";

export const dynamic = "force-dynamic";

export default async function AdminPosPage() {
  await requireAdmin();
  return <POS />;
}
