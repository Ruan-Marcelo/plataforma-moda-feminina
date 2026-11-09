"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { favoriteIdsSchema, favoritesStorageKey, parseFavorites, serializeFavorites } from "@/features/favorites/contracts";
type Favorites = { ids: string[]; ready: boolean; notice: string; toggle: (id: string) => void; clear: () => void };
const FavoritesContext = createContext<Favorites | null>(null);
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try { setIds(parseFavorites(localStorage.getItem(favoritesStorageKey))); } catch { setNotice("O navegador bloqueou o armazenamento. Os favoritos durarão somente nesta página."); }
    setReady(true);
    const sync = (event: StorageEvent) => { if (event.key === favoritesStorageKey || event.key === null) setIds(parseFavorites(event.newValue)); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function save(next: string[]) {
    setIds(next);
    try { if (next.length) localStorage.setItem(favoritesStorageKey, serializeFavorites(next)); else localStorage.removeItem(favoritesStorageKey); setNotice(""); } catch { setNotice("Não foi possível salvar neste navegador. Os favoritos durarão somente nesta página."); }
  }
  function toggle(id: string) {
    if (!favoriteIdsSchema.safeParse([id]).success) return;
    if (!ids.includes(id) && ids.length >= 100) { setNotice("Você pode guardar até 100 peças. Remova uma para adicionar outra."); return; }
    save(ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }
  return <FavoritesContext.Provider value={{ ids, ready, notice, toggle, clear: () => save([]) }}>{children}{notice ? <p role="status" className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg rounded-belin-md border border-wine bg-white p-4 text-sm text-wine shadow-belin-soft">{notice}</p> : null}</FavoritesContext.Provider>;
}
export function useFavorites() { const context = useContext(FavoritesContext); if (!context) throw new Error("FavoritesProvider missing"); return context; }
