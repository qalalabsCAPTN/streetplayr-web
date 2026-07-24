import { redirect } from "next/navigation";

/**
 * Legacy preloader route — retired as a standalone landing.
 * Visitors land on `/home` (intro video overlay handles first visit).
 */
export default function EnteringStreetPlayRRedirect() {
  redirect("/home");
}
