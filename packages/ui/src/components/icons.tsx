import type { ReactNode } from "react";

/** Thin line icons drawn on a 24px grid; they inherit the text colour. Always decorative: pair them with a text label. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="gn-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export const IconHome = () => <Icon><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M5.5 9v11h13V9" /><path d="M10 20v-5.5h4V20" /></Icon>;
export const IconHeart = () => <Icon><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" /></Icon>;
export const IconHand = () => (
  <Icon><path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11" /><path d="M10 10.5V5a1.5 1.5 0 0 1 3 0v5.5" /><path d="M13 10.5V6.5a1.5 1.5 0 0 1 3 0V13" /><path d="M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.6a6.4 6.4 0 0 1-5-2.4L3.6 15a1.6 1.6 0 0 1 2.4-2.1L7 14" /></Icon>
);
/** A heart held in an open hand: giving. */
export const IconGift = () => (
  <Icon><path d="M12 11.5s-3.6-2.2-3.6-4.9a2 2 0 0 1 3.6-1.2 2 2 0 0 1 3.6 1.2c0 2.7-3.6 4.9-3.6 4.9Z" /><path d="M3.5 14.5h2.8l3.2 1.6h3.3a1.4 1.4 0 0 1 0 2.8H9.5" /><path d="M12.8 18.9l4.6-2.6a1.5 1.5 0 0 1 1.9 2.2L15 21H7.5L3.5 19" /></Icon>
);
export const IconNews = () => <Icon><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M7.5 9h9M7.5 12.5h9M7.5 16h5" /></Icon>;
export const IconPaw = () => (
  <Icon><ellipse cx="12" cy="16" rx="4.2" ry="3.5" /><circle cx="6" cy="11" r="1.7" /><circle cx="9.3" cy="6.8" r="1.7" /><circle cx="14.7" cy="6.8" r="1.7" /><circle cx="18" cy="11" r="1.7" /></Icon>
);
/** Three lines: the menu with every page. */
export const IconGlobe = () => <Icon><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5Z" /></Icon>;
export const IconMenu = () => <Icon><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
/** A small arrow: down for a menu that opens, right for a link to another page. */
export const IconChevronDown = () => <Icon><path d="m6.5 9.5 5.5 5.5 5.5-5.5" /></Icon>;
export const IconChevronRight = () => <Icon><path d="m9.5 6.5 5.5 5.5-5.5 5.5" /></Icon>;
