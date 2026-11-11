// RUAN MARCELO RAMACIOTI LUZ
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Privacidade", description: "Informações sobre privacidade e tratamento de dados na BÉLIN." };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream">
      <SiteHeader />
      <div id="page-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        <p className="text-xs uppercase tracking-[0.3em] text-wine">Privacidade</p>
        <h1 className="mt-4 font-display text-5xl text-wine md:text-7xl">Sua privacidade importa.</h1>
        <p className="mt-6 leading-7 text-stone-700">Esta página apresenta a estrutura de tratamento de dados prevista para a vitrine BÉLIN. Ela ainda precisa ser revisada e aprovada pelo responsável jurídico antes da publicação.</p>
        <div className="mt-10 space-y-8 rounded-2xl border border-nude bg-white p-6 md:p-8">
          <section><h2 className="font-display text-3xl text-wine">Dados de navegação</h2><p className="mt-3 text-sm leading-6 text-stone-600">A aplicação pode registrar eventos técnicos e analíticos somente conforme a preferência de cookies escolhida. O catálogo não exige cadastro para ser consultado.</p></section>
          <section id="provador" className="scroll-mt-6"><h2 className="font-display text-3xl text-wine">Provador virtual</h2><p className="mt-3 text-sm leading-6 text-stone-600">Na geração real, as cópias das imagens são validadas e enviadas sem metadados incorporados, em base64. O resultado volta de forma privada na própria resposta, sem URL pública de CDN. A sessão é vinculada por cookie HttpOnly, e os metadados de operação e autorização têm prazo local de 30 dias, com rotina de limpeza.</p><p className="mt-3 text-sm leading-6 text-stone-600">Conforme a documentação do FASHN, a cópia temporária de entrada tem limpeza de segurança em até um dia e a saída base64 fica disponível por 60 minutos. Registros técnicos no fornecedor não expiram automaticamente e sua exclusão depende do procedimento jurídico do serviço. Não prometemos exclusão remota instantânea.</p><p className="mt-3 text-sm leading-6 text-stone-600">A fotografia escolhida é pré-visualizada nesta sessão, sem ser salva no catálogo ou no armazenamento local do navegador. Selecionar uma imagem não inicia seu envio.</p><p className="mt-3 text-sm leading-6 text-stone-600">Quando o serviço estiver habilitado, a fotografia e a imagem da peça serão compartilhadas com o FASHN para gerar uma simulação visual, mediante autorização explícita no fluxo. A aplicação não registra o conteúdo da fotografia nos logs nem o inclui nas mensagens de WhatsApp.</p><p className="mt-3 text-sm leading-6 text-stone-600">A loja ainda precisa definir e aprovar informações sobre retenção, exclusão, transferência internacional, responsabilidades e contato para solicitações. A autorização na interface não substitui essa revisão. O processamento deve permanecer desabilitado até que a configuração e as condições exigidas estejam concluídas.</p><p className="mt-3 text-sm leading-6 text-stone-600">Cancelar remove a pré-visualização da sessão e interrompe a espera no navegador. Se o envio já ocorreu, isso não garante a interrupção ou exclusão no fornecedor. O resultado não garante tamanho, caimento ou aparência física exata.</p></section>
          <section><h2 className="font-display text-3xl text-wine">Favoritos</h2><p className="mt-3 text-sm leading-6 text-stone-600">Ao salvar uma peça, somente sua identificação é guardada neste navegador, sem cadastro e sem uso para publicidade ou análise. A lista não contém fotografias pessoais. Você pode remover peças ou limpar a lista em Favoritos; ela também será removida ao limpar os dados do navegador. As identificações são consultadas no catálogo para atualizar disponibilidade e preços.</p><Link href="/favoritos" className="mt-3 inline-flex min-h-12 items-center text-sm text-wine underline">Gerenciar favoritos</Link></section>
          <section><h2 className="font-display text-3xl text-wine">Contato</h2><p className="mt-3 text-sm leading-6 text-stone-600">Para dúvidas ou solicitações relacionadas a dados pessoais, o canal oficial deverá ser informado pela loja antes da publicação.</p><Link href="/contato" className="mt-3 inline-flex min-h-12 items-center text-sm text-wine underline">Canais da loja</Link></section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
