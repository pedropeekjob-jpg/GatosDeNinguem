import type { ChangeEvent, ReactNode } from "react";
import { cx } from "../cx";

type FieldBase = {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  /** Shows a live character counter against a recommended range. */
  recommended?: { min: number; max: number };
};

function describedBy(id: string, hint: unknown, error: unknown, counter: boolean) {
  return [hint && `${id}-hint`, error && `${id}-error`, counter && `${id}-count`].filter(Boolean).join(" ") || undefined;
}

function Counter({ id, length, recommended }: { id: string; length: number; recommended: { min: number; max: number } }) {
  const state = length === 0 ? "empty" : length < recommended.min ? "short" : length > recommended.max ? "long" : "ok";
  return (
    <p id={`${id}-count`} className={`gn-field__count gn-field__count--${state}`}>
      {length} de {recommended.max} caracteres
    </p>
  );
}

export function TextField({
  id, label, hint, error, recommended, value, onChange, type = "text", ...rest
}: FieldBase & { value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean; placeholder?: string; autoComplete?: string; inputMode?: "text" | "numeric" | "tel" | "email" | "url" }) {
  return (
    <div className={cx("gn-field", !!error && "gn-field--error")}>
      <label htmlFor={id} className="gn-field__label">{label}</label>
      {hint ? <p id={`${id}-hint`} className="gn-field__hint">{hint}</p> : null}
      <input id={id} type={type} className="gn-input" value={value} onChange={onChange}
        aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error, !!recommended)} {...rest} />
      {recommended ? <Counter id={id} length={value.length} recommended={recommended} /> : null}
      {error ? <p id={`${id}-error`} className="gn-field__error">{error}</p> : null}
    </div>
  );
}

export function TextArea({
  id, label, hint, error, recommended, value, onChange, rows = 4, ...rest
}: FieldBase & { value: string; onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void; rows?: number; required?: boolean }) {
  return (
    <div className={cx("gn-field", !!error && "gn-field--error")}>
      <label htmlFor={id} className="gn-field__label">{label}</label>
      {hint ? <p id={`${id}-hint`} className="gn-field__hint">{hint}</p> : null}
      <textarea id={id} className="gn-input" rows={rows} value={value} onChange={onChange}
        aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error, !!recommended)} {...rest} />
      {recommended ? <Counter id={id} length={value.length} recommended={recommended} /> : null}
      {error ? <p id={`${id}-error`} className="gn-field__error">{error}</p> : null}
    </div>
  );
}

export function Checkbox({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: ReactNode; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="gn-check">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-describedby={hint ? `${id}-hint` : undefined} />
      <label htmlFor={id}>
        {label}
        {hint ? <span id={`${id}-hint`} className="gn-field__hint">{hint}</span> : null}
      </label>
    </div>
  );
}

export type Choice<V extends string> = { value: V; label: string; hint?: string; icon?: ReactNode };

/** Large tappable options for one question. Native radios, so keyboard and screen readers just work. */
export function ChoiceList<V extends string>({ name, legend, options, value, onChange }: {
  name: string; legend: ReactNode; options: Choice<V>[]; value: V | undefined; onChange: (value: V) => void;
}) {
  return (
    <fieldset className="gn-choices">
      <legend className="gn-choices__legend">{legend}</legend>
      {options.map((o) => {
        const id = `${name}-${o.value}`;
        return (
          <div key={o.value} className="gn-choice">
            <input type="radio" id={id} name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            <label htmlFor={id}>
              {o.icon ? <span className="gn-choice__icon" aria-hidden="true">{o.icon}</span> : null}
              <span className="gn-choice__text">
                <span className="gn-choice__label">{o.label}</span>
                {o.hint ? <span className="gn-choice__hint">{o.hint}</span> : null}
              </span>
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}
