// RUAN MARCELO RAMACIOTI LUZ
import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-belin-lg border border-nude bg-white shadow-belin-soft ${className}`} {...props} />;
}
