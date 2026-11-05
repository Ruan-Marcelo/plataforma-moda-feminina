// RUAN MARCELO RAMACIOTI LUZ
import { z } from "zod";

export const consentSchema = z.object({
  necessary: z.literal(true),
  analytics: z.boolean(),
  marketing: z.boolean(),
});

export type CookieConsent = z.infer<typeof consentSchema>;

export const cookieConsentStorageKey = "moda-cookie-consent:v1";

export function parseStoredConsent(value: string | null): CookieConsent | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    const result = consentSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
