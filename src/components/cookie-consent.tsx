// RUAN MARCELO RAMACIOTI LUZ
"use client";

import { useEffect, useRef, useState } from "react";
import { cookieConsentStorageKey, parseStoredConsent, type CookieConsent } from "@/features/cookie-consent/consent";

const defaultConsent: CookieConsent = { necessary: true, analytics: false, marketing: false };

export function CookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [ready, setReady] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const preferenceButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    try {
      const stored = parseStoredConsent(window.localStorage.getItem(cookieConsentStorageKey));
      setConsent(stored);
      if (stored) { setAnalytics(stored.analytics); setMarketing(stored.marketing); }
    } catch { setStorageUnavailable(true); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && (!consent || customizing) && !dialog.current?.open) dialog.current?.showModal();
    else if (ready && consent && !customizing && returnFocus.current) {
      preferenceButton.current?.focus({ preventScroll: true });
      returnFocus.current = false;
    }
  }, [ready, consent, customizing]);

  function save(next: CookieConsent) {
    try { window.localStorage.setItem(cookieConsentStorageKey, JSON.stringify(next)); }
    catch { setStorageUnavailable(true); }
    dialog.current?.close();
    setConsent(next);
    setCustomizing(false);
  }

  if (!ready) return null;
  if (consent && !customizing) return <aside aria-label="Preferências de privacidade" className="border-t border-nude bg-cream px-5 py-3"><button ref={preferenceButton} className="inline-flex min-h-11 max-w-full items-center rounded border border-stone-300 bg-white px-3 text-xs shadow" type="button" onClick={() => { returnFocus.current = true; setCustomizing(true); }}>Preferências de cookies{storageUnavailable ? " · somente nesta página" : ""}</button></aside>;

  return (
    <dialog ref={dialog} className="fixed inset-x-4 bottom-4 top-auto m-0 max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto rounded border border-stone-300 bg-white p-5 shadow-lg backdrop:bg-black/30" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description" onCancel={event => { event.preventDefault(); if (consent) { dialog.current?.close(); setCustomizing(false); } else save(defaultConsent); }}>
      <h2 id="cookie-consent-title" className="font-display text-2xl">Privacidade e cookies</h2>
      <p id="cookie-consent-description" className="mt-2 text-sm leading-6 text-stone-600">Usamos apenas o necessário por padrão. Cookies analíticos e de marketing dependem da sua escolha.</p>
      {storageUnavailable ? <p className="mt-2 text-sm text-wine" role="status">O navegador bloqueou o armazenamento. Sua escolha valerá somente nesta página.</p> : null}
      {customizing ? <div className="mt-4 grid gap-3 text-sm"><label className="flex gap-2"><input type="checkbox" checked disabled /> Necessários</label><label className="flex gap-2"><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /> Analíticos</label><label className="flex gap-2"><input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} /> Marketing</label></div> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="min-h-11 border border-stone-300 px-4 text-sm" type="button" onClick={() => save(defaultConsent)}>Recusar opcionais</button>
        <button className="min-h-11 border border-stone-300 px-4 text-sm" type="button" onClick={() => setCustomizing((value) => !value)}>{customizing ? "Voltar" : "Personalizar"}</button>
        <button className="min-h-11 bg-lilac px-4 text-sm text-white" type="button" onClick={() => save({ necessary: true, analytics: customizing ? analytics : true, marketing: customizing ? marketing : true })}>{customizing ? "Salvar escolhas" : "Aceitar opcionais"}</button>
      </div>
    </dialog>
  );
}
