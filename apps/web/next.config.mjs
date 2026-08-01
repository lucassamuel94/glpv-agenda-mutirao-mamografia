import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// `**` (qualquer host HTTPS) faz `/_next/image` funcionar como proxy de
// imagem aberto: qualquer request pode mandar o servidor buscar e
// reprocessar uma URL arbitrária (custo de banda/CPU, SSRF contra serviço
// interno que responda em HTTPS). Fora de dev, exige lista explícita via
// IMAGE_ALLOWED_HOSTS (hosts separados por vírgula — CDN/S3 da instalação,
// domínio de onde vêm logo/avatar). Não é NEXT_PUBLIC: só o config do
// servidor Next precisa dela.
const allowedImageHosts = (process.env.IMAGE_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ponytail: desligado desde a origem do template por instabilidade do
  // KanbanBoard (@dnd-kit) sob double-invoke de efeitos do Strict Mode.
  // @dnd-kit/core está em ^6.3.1 (versões recentes resolveram boa parte dos
  // problemas de StrictMode que existiam em v5), então é PROVÁVEL que já dê
  // pra religar — mas verificar exige testar o drag-and-drop do Kanban de
  // deals num browser real, o que esta sessão não tinha como fazer com
  // segurança sem reiniciar o `next dev` que já estava rodando (risco de
  // atrapalhar uma sessão de trabalho em andamento). Ceiling: efeitos que só
  // duplicam em StrictMode (não em produção) ficam mascarados. Upgrade:
  // reativar (`reactStrictMode: true`) numa sessão dedicada, testar o
  // Kanban arrastando cards entre colunas, e só then remover este comentário.
  reactStrictMode: false,
  images: {
    remotePatterns:
      allowedImageHosts.length > 0
        ? allowedImageHosts.map((hostname) => ({ protocol: "https", hostname }))
        : process.env.NODE_ENV === "production"
          ? [] // fail-safe: sem IMAGE_ALLOWED_HOSTS em produção, nenhum host externo otimizado
          : [{ protocol: "https", hostname: "**" }], // dev: conveniência
  },
  output: "standalone",
  // Permite rodar uma segunda instância (modo demo) a partir da MESMA pasta,
  // sem duplicar a árvore de código: cada processo `next dev`/`next start`
  // usa seu próprio diretório de build via NEXT_DIST_DIR, evitando o
  // conflito de cache que dois processos escrevendo em `.next/` causariam.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Fixa a raiz do Turbopack neste diretório — sem isso, o Next sobe na árvore
  // procurando lockfiles e pode selecionar um package-lock.json fora do projeto.
  turbopack: {
    root: dirname(dirname(__dirname)),
  },
};

export default nextConfig;
