import { redirect } from "next/navigation";

/** Store root always lands on Home. Intro video overlays `/home` once. */
export default function StoreHome() {
  redirect("/home");
}
