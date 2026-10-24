import { permanentRedirect } from "next/navigation";

/** Donations have one page, /doar; links to the old address keep working. */
export default function OldDonatePage() {
  permanentRedirect("/doar");
}
