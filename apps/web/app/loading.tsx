import { AnimatedLogo } from "@gn/ui";

/** Shown while a page is on its way: the logo's cat plays with its ball. */
export default function Loading() {
  return <AnimatedLogo variant="loader" size={140} />;
}
