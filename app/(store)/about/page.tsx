import { redirect } from "next/navigation";

/** Our Story is hidden for now — keep route but send visitors home. */
export default function AboutPage() {
  redirect("/home");
}
