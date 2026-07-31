import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ENTRY_COOKIE } from "@/lib/social";

/**
 * Store root fallback (proxy usually redirects `/` first).
 * First visit → intro route; returning → /home.
 */
export default async function StoreHome() {
  const jar = await cookies();
  const seen = jar.get(ENTRY_COOKIE)?.value === "1";
  redirect(seen ? "/home" : "/entering-street-playR");
}
