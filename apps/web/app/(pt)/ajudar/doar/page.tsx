import { permanentRedirect } from "next/navigation";
import { langFrom, type LangProps } from "@/lib/i18n/server";

/** Donations have one page, /doar; links to the old address keep working. */
export default async function OldDonatePage({ params }: LangProps) {
  const { l } = await langFrom(params);
  permanentRedirect(l("/doar"));
}
