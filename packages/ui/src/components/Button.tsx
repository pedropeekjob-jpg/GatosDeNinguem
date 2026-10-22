import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";

type Common = {
  variant?: "primary" | "secondary" | "quiet" | "urgent";
  /** Optional decorative icon shown before the text. Text is always required. */
  icon?: ReactNode;
  block?: boolean;
  children: ReactNode;
};
type AsButton = Common & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsLink = Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
export type ButtonProps = AsButton | AsLink;

export function Button(props: ButtonProps) {
  const { variant = "primary", icon, block, children, className, ...rest } = props;
  const classes = cx("gn-btn", `gn-btn--${variant}`, block && "gn-btn--block", className);
  const content = (
    <>
      {icon ? <span className="gn-btn__icon" aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </>
  );
  if (typeof rest.href === "string") {
    return <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>{content}</a>;
  }
  const { type = "button", ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return <button type={type} className={classes} {...buttonRest}>{content}</button>;
}
