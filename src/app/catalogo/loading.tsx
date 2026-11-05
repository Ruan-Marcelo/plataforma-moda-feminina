// RUAN MARCELO RAMACIOTI LUZ
export default function CatalogLoading() {
  return (
    <main className="min-h-screen bg-cream px-5 py-10 md:px-8 md:py-16" aria-busy="true" aria-label="Carregando catálogo">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-32 rounded bg-nude" />
        <div className="mt-12 h-14 w-72 rounded bg-nude" />
        <div className="mt-8 h-40 rounded-belin-lg border border-nude bg-white" />
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4"><div className="aspect-[4/5] rounded-belin-lg bg-nude" /><div className="aspect-[4/5] rounded-belin-lg bg-nude" /><div className="hidden aspect-[4/5] rounded-belin-lg bg-nude md:block" /><div className="hidden aspect-[4/5] rounded-belin-lg bg-nude md:block" /></div>
      </div>
    </main>
  );
}
