// RUAN MARCELO RAMACIOTI LUZ
import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; error?: string; hint?: string };

export function Input({ id, label, error, hint, className = "", ...props }: InputProps) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return <label className="block text-sm text-ink">{label ? <span className="font-medium">{label}</span> : null}<input id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} className={`mt-1 min-h-11 w-full rounded-belin-md border border-nude bg-white px-3 text-ink shadow-sm outline-none transition-shadow placeholder:text-muted focus:border-wine focus:ring-2 focus:ring-wine/20 ${className}`} {...props} />{hint ? <span id={`${id}-hint`} className="mt-1 block text-xs text-muted">{hint}</span> : null}{error ? <span id={`${id}-error`} className="mt-1 block text-xs text-danger" role="alert">{error}</span> : null}</label>;
}
