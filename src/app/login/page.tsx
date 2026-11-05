// RUAN MARCELO RAMACIOTI LUZ
"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(false);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirect: false, callbackUrl: "/" });
    setPending(false);
    if (result?.error) setError(true); else if (result?.url) window.location.assign(result.url); else setError(true);
  }
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-16"><form className="w-full border border-stone-200 bg-white p-6" onSubmit={submit}><h1 className="font-display text-4xl">Acesso administrativo</h1><p className="mt-3 text-sm text-stone-600">Use uma conta provisionada no servidor.</p><label className="mt-6 block text-sm">E-mail<input className="mt-1 min-h-11 w-full border border-stone-300 px-3" name="email" type="email" autoComplete="email" required /></label><label className="mt-4 block text-sm">Senha<input className="mt-1 min-h-11 w-full border border-stone-300 px-3" name="password" type="password" autoComplete="current-password" minLength={8} required /></label>{error ? <p className="mt-4 text-sm text-red-700" role="alert">Não foi possível autenticar com esses dados.</p> : null}<button className="mt-6 min-h-12 w-full bg-lilac px-4 text-sm text-white disabled:opacity-60" type="submit" disabled={pending}>{pending ? "Entrando..." : "Entrar"}</button></form></main>;
}
