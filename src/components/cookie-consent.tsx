// RUAN MARCELO RAMACIOTI LUZ
"use client";

import { useEffect, useState } from "react";
import { cookieConsentStorageKey, parseStoredConsent, type CookieConsent } from "@/features/cookie-consent/consent";

const defaultConsent: CookieConsent = { necessary: true, analytics: false, marketing: false };

export function CookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = parseStoredConsent(window.localStorage.getItem(cookieConsentStorageKey));
    setConsent(stored);
    if (stored) { setAnalytics(stored.analytics); setMarketing(stored.marketing); }
  }, []);

  function save(next: CookieConsent) {
    window.localStorage.setItem(cookieConsentStorageKey, JSON.stringify(next));
    setConsent(next);
    setCustomizing(false);
  }

  if (consent && !customizing) return <button className="fixed bottom-4 left-4 z-50 min-h-10 rounded border border-stone-300 bg-white px-3 text-xs shadow" type="button" onClick={() => setCustomizing(true)}>Preferencias de cookies</button>;

  return (
    <aside className="fixed inset-x-4 bottom-4 z-50 max-w-xl rounded border border-stone-300 bg-white p-5 shadow-lg" role="dialog" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description">
      <h2 id="cookie-consent-title" className="font-display text-2xl">Privacidade e cookies</h2>
      <p id="cookie-consent-description" className="mt-2 text-sm leading-6 text-stone-600">Usamos apenas o necessário por padrão. Cookies analíticos e de marketing dependem da sua escolha.</p>
      {customizing ? <div className="mt-4 grid gap-3 text-sm"><label className="flex gap-2"><input type="checkbox" checked disabled /> Necessários</label><label className="flex gap-2"><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /> Analíticos</label><label className="flex gap-2"><input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} /> Marketing</label></div> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="min-h-11 border border-stone-300 px-4 text-sm" type="button" onClick={() => save(defaultConsent)}>Recusar opcionais</button>
        <button className="min-h-11 border border-stone-300 px-4 text-sm" type="button" onClick={() => setCustomizing((value) => !value)}>{customizing ? "Voltar" : "Personalizar"}</button>
        <button className="min-h-11 bg-lilac px-4 text-sm text-white" type="button" onClick={() => save({ necessary: true, analytics: customizing ? analytics : true, marketing: customizing ? marketing : true })}>{customizing ? "Salvar escolhas" : "Aceitar opcionais"}</button>
      </div>
    </aside>
  );
}
