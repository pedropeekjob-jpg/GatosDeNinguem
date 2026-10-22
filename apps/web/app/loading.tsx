import { AnimatedLogo } from "@gn/ui";

/**
 * Shown while a page is on its way: the logo's cat plays with its ball. It only fades in after a short wait,
 * so quick page changes never flash it.
 */
export default function Loading() {
  return (
    <div className="route-loading">
      <AnimatedLogo variant="loader" size={140} />
    </div>
  );
}
