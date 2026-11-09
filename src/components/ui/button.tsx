// RUAN MARCELO RAMACIOTI LUZ
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean };

const variants: Record<ButtonVariant, string> = {
  primary: "bg-wine text-white hover:bg-wine-dark focus-visible:ring-wine",
  secondary: "border border-wine bg-transparent text-wine hover:bg-white focus-visible:ring-wine",
  quiet: "bg-transparent text-wine hover:bg-nude/60 focus-visible:ring-wine",
  danger: "border border-danger/40 bg-transparent text-danger hover:bg-danger/10 focus-visible:ring-danger",
};

export function buttonClassName(variant: ButtonVariant = "primary", className = "") {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`;
}

export function Button({ variant = "primary", loading = false, className = "", children, disabled, ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} aria-busy={loading || undefined} disabled={disabled || loading} {...props}>{loading ? "Aguarde…" : children}</button>;
}
