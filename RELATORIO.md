# Relatório — PWA JJ Performance

## Contexto

A sessão anterior caiu no meio da transformação de `original.html` em PWA
(`claude_log.txt` registrava "Response stalled mid-stream"). Esta sessão
retomou o trabalho: auditou o que já existia, encontrou uma lacuna real na
funcionalidade de IA e validou tudo com testes automatizados (DOM headless e
navegador real).

## O que já estava correto (verificado, nada a corrigir)

- **`index.html` está completo** — comparado função a função com
  `original.html`: mesmas 5 abas (Hoje, Treino, Evolução, Competição, IA),
  mesmas 13 funções `render*`, mesmas chaves de `localStorage`
  (`jj:p`, `jj:ss`, `jj:av`, `jj:sem`, `jj:msg`). O `diff` entre os dois
  arquivos mostra só as mudanças esperadas de "PWA-ficação" (meta tags, textos
  sobre IA local, registro do service worker).
- **Meta tags iOS/PWA no `<head>`**: `apple-mobile-web-app-capable`,
  `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`,
  `apple-touch-icon` (192 e 512), `link rel="manifest"`, `theme-color`.
- **`manifest.webmanifest`**: JSON válido, ícones 192/512 (`any` + `maskable`),
  `start_url`, `scope`, `display: standalone`.
- **`sw.js`**: cacheia o app shell (`index.html`, `manifest.webmanifest`,
  ícones) e os recursos externos (fonte do Google Fonts, Chart.js) com
  estratégia cache-first + stale-while-revalidate; registrado no final do
  `index.html` via `navigator.serviceWorker.register('sw.js')`.
- Ícones (`icon-192.png`, `icon-512.png`) são PNGs válidos.

## Bug real encontrado e corrigido

A UI inteira (modal de perfil, aba de Configurações, mensagem inicial do
chat, nota da análise de vídeo) já dizia "o coach IA funciona grátis e
offline, sem chave de API" — mas a função `callAI()` não implementava isso:
sem chave configurada, ela simplesmente retornava
*"Configure sua chave de API nas Configurações para usar a IA."* Ou seja, a
promessa de "IA grátis sem depender de serviço pago" não existia de fato.
Essa era a lacuna deixada pela sessão anterior.

**Correção aplicada** (`index.html`, função `callAI` e `analyzeVideo`):

- `callAI(messages)`: se não houver `apiKey`, chama `localCoachReply(texto)`
  — um motor de respostas por regras que lê os dados reais do app (`S.sessions`,
  `calcACWR()`, `calcFitScore()`, `S.week`, fase do período de 16 semanas em
  `PERIODOS`) e responde sobre carga/ACWR, sono/recuperação, nutrição, foco
  técnico da semana, prontidão para competição ou motivação. Chave de API
  continua 100% opcional — só é usada se o usuário preencher.
- `analyzeVideo()`: sem chave, gera `localVideoPlan()` — um plano de estudo
  de 3 dias baseado na semana/fase atual do programa, já que sem API não é
  possível "ver" o conteúdo do vídeo (isso já era avisado no texto da UI,
  agora o comportamento bate com o aviso).

Nenhuma chamada de rede paga é feita a menos que o usuário cole sua própria
chave Anthropic nas Configurações.

## Testes realizados

1. **Sintaxe**: os 3 blocos `<script>` do `index.html` foram parseados com
   `new Function(...)` em Node — sem erros.
2. **DOM headless (jsdom)**: simulação completa do fluxo do app —
   preencher e salvar perfil, navegar pelas 5 abas (todas renderizam
   conteúdo), registrar uma sessão de treino, calcular ACWR, perguntar ao
   coach local sobre carga ("Seu ACWR atual é 4 — Alto risco...") e sobre
   nutrição ("Nutrição recomendada para a semana 1 (Base Aeróbia): ..."), e
   testar a análise de vídeo local. Persistência em `localStorage`
   confirmada (`jj:p`, `jj:ss`, `jj:msg`).
3. **Navegador real headless (Chromium via Playwright, servido por
   `python3 -m http.server`)**:
   - Service worker registra e ativa (`state: activating`/`activated`).
   - Cache `jjp-v1` contém o app shell completo + fonte do Google Fonts +
     Chart.js (recursos externos também cacheados).
   - Com a rede **desligada** (`context.setOffline(true)`) e a página
     **recarregada do zero**, o app carrega normalmente (title e HTML
     completos) e a navegação entre abas continua funcionando — confirma
     que o PWA funciona offline de fato, não só na teoria.
4. Validação de `manifest.webmanifest` (JSON parseável) e dos dois PNGs de
   ícone (assinatura de arquivo válida).

## Limpeza

Removidos `claude_log.txt` e `claude_log2.txt` (logs de erro da sessão
anterior que travou), que não fazem parte do app.

## Conclusão

O PWA estava estruturalmente completo (telas, dados, PWA shell, service
worker) — a sessão anterior parou exatamente no ponto em que a função de IA
local ainda não tinha sido implementada, apesar da UI já anunciá-la. Essa
lacuna foi corrigida e testada; o app funciona 100% sem qualquer chave ou
serviço de IA pago, com a chave Anthropic permanecendo como melhoria
opcional.
