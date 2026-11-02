# Relatório — Ajustes JJ Performance (nov/2026)

Todas as mudanças foram feitas só em `./work/` (index.html e sw.js). `./orig/` ficou intocado, serviu de base de comparação. Nada de git, nada foi publicado.

## 1. O que mudou

### 1.1 Dias de treino editáveis + inversão corrigida
O app original tinha a lógica invertida: jiu-jítsu caía em Ter/Qui/Sáb/Dom e força em Seg/Qua/Sex — ao contrário do que você pediu (JJ como base, força como complemento).

Troquei por uma única fonte de verdade, a função `getDayPlan(dow)`, que decide o tipo de treino de cada dia a partir de `profile.jjDays` (padrão `[Seg, Qua, Sex]`). Todo dia que não está em `jjDays` vira força automaticamente, alternando os treinos A/B/C na ordem Seg→Dom. Três funções que antes tinham a tabela de dias copiada e colada (`todayType`, `weekDayType`, `getWorkoutForDay`) agora chamam essa única função — então não existe mais risco de uma delas ficar "esquecida" numa correção futura.

**Por quê:** regra de negócio espalhada em 3 lugares foi exatamente o que causou a inversão silenciosa no app original — provavelmente alguém mudou uma tabela e esqueceu a outra. Centralizar elimina a classe inteira desse bug.

Editável em **IA → Configurações → "Dias de Jiu-Jítsu"** (toque para marcar/desmarcar qualquer dia, inclusive sábado). O texto "Força nos demais dias" mostra o resultado ao vivo antes de salvar.

### 1.2 Currículo próprio (troca o objetivo fixo) + perguntas pós-treino
O formulário de perfil tinha um `<select>` fixo com 4 objetivos genéricos ("Performance", "Competição"...). Troquei pelo seu currículo de técnicas, editável (adicionar/renomear/remover), com os itens iniciais que você passou: De La Riva, X-guard, knee cut, passagem de meia-guarda, retenção de guarda, recuperação de guarda. Fica em **IA → Configurações → "Seu Currículo de Técnicas"**.

Depois de salvar qualquer treino, uma telinha curta pergunta **qual item do currículo apareceu** (os outros campos — o que funcionou, onde travou — já ficam no formulário principal, na mesma ordem usada no diálogo por voz, ver 1.3). Com isso o app calcula uma sugestão (`generateSuggestion()`): cruza o que você mais tem reportado como travado com os itens do currículo que não aparecem nas últimas 10 sessões, e sugere foco para os próximos rolas.

**Por quê:** um objetivo único e genérico não tem como virar sugestão específica. Currículo + tags por sessão dá dado estruturado pra cruzar; a sugestão é uma regra simples (sem IA paga), olhando as últimas 10 sessões — nada de "mágica", é 100% auditável lendo `generateSuggestion()`.

### 1.3 Registrar treino por voz (Web Speech API, grátis)
Botão novo "Registrar treino por voz" na tela Hoje. Usa só APIs nativas do navegador — `speechSynthesis` para perguntar e `SpeechRecognition`/`webkitSpeechRecognition` para ouvir, ambas em pt-BR, sem nenhuma chave paga. Ordem das perguntas: duração → PSE (0-10) → técnica treinada → rolas (parceiro, faixa/peso, o que rolou, pode registrar vários) → o que funcionou → onde travou → dor/lesão → sono → energia. No final, o app fala um resumo e espera "confirmar" (salva) ou "corrigir" (deixa a tela aberta para você editar digitando, sem perder o que já foi reconhecido por voz).

Se o navegador não suporta (ex.: Safari no iPhone não tem `SpeechRecognition`), aparece um aviso e o formulário digitado abre normalmente — nunca trava o fluxo.

Também adicionei um botão de microfone (🎤) em cada campo de texto do formulário (técnica, rolas, funcionou, travou, dor) para ditado pontual, sem precisar do diálogo guiado inteiro.

**Por quê voz "guiada" e não só ditado livre:** perguntar campo por campo, na ordem do formulário, evita que você tenha que lembrar um roteiro ou formatar a fala; e ler o resumo antes de salvar é a rede de segurança contra erro de reconhecimento (comum em nomes próprios e números falados).

**Limitação conhecida:** no celular, o suporte a `SpeechRecognition` depende do navegador — funciona bem no Chrome/Edge (Android e desktop); no Safari/iOS o reconhecimento de voz contínuo não é suportado pela API, então o app cai no aviso + formulário digitado automaticamente.

### 1.4 Importar treino (botão + link) — e o treino de 28/10 pronto para importar
Dois jeitos de importar, os dois com **pré-visualização e confirmação obrigatórias antes de salvar** — nunca salva direto:

- Botão **"Importar treino"** na tela Hoje: abre uma caixa para colar o JSON.
- Link: `?import=<base64url>` ou `#import=<base64url>` na URL. O app detecta sozinho ao abrir, decodifica e mostra a mesma pré-visualização.

Cada treino importado carrega um `importId`. Antes de salvar, o app confere se esse id já existe entre as sessões (`isAlreadyImported`) — se já foi importado, mostra um aviso vermelho e troca o texto do botão para "Importar mesmo assim", exigindo um clique extra consciente em vez de duplicar sozinho.

A validação é estrita: tipo, duração (1–600min), PSE (0–10) e data são obrigatórios e checados por tipo; rolas e textos livres são limitados em tamanho; qualquer campo fora do esperado é rejeitado com uma mensagem específica (testei isso com payloads propositalmente quebrados, ver seção de segurança).

**Link pronto para o treino de 28/10/2026** (monte o app em `https://brunocremtn-sketch.github.io/jj-performance/`, cole o link no navegador do celular ou do PC — ele abre a pré-visualização sozinho):

```
https://brunocremtn-sketch.github.io/jj-performance/?import=eyJpbXBvcnRJZCI6ImpqLTIwMjYtMTAtMjgtaXZvbmUteC1ndWFyZCIsInNlc3Npb24iOnsiZGF0YSI6IjIwMjYtMTAtMjhUMTk6MDA6MDAiLCJ0aXBvIjoiSkoiLCJkdXIiOjkwLCJwc2UiOjcsInBlc29BdGxldGEiOjYzLCJ0ZWNuaWNhIjoiT3VjaGkgZ2FyaSwga291Y2hpIGdhcmksIGRlc2FybWUgZGUgWC1ndWFyZCwgZm9sZCBwYXNzIiwicm9sYXMiOlt7InBhcmNlaXJvIjoiSXZvbmUiLCJmYWl4YVBlc28iOiJSb3hhLCB-NzBrZyIsImRldGFsaGUiOiJSZXRlbsOnw6NvIGRlIGd1YXJkYSwgMSByYXNwYWdlbSJ9LHsicGFyY2Vpcm8iOiIiLCJmYWl4YVBlc28iOiJWZXJkZSwgfjY1a2ciLCJkZXRhbGhlIjoiUmFzcGFnZW0gZGUgbGHDp28sIGtuZWUgY3V0LCBtb250YWRhIGVzdGFiaWxpemFkYSJ9LHsicGFyY2Vpcm8iOiIiLCJmYWl4YVBlc28iOiJBenVsIDQgZ3JhdXMsIH43MGtnIiwiZGV0YWxoZSI6IlJhc3BhZ2VtIGRlIGxhw6dvIHBhcmEgY2VtLXF1aWxvczsgZWxlIHJlY3VwZXJvdSBhIG1laWEtZ3VhcmRhIn0seyJwYXJjZWlybyI6IiIsImZhaXhhUGVzbyI6IlJveGEgMSBncmF1LCB-NzBrZyIsImVzZm9yY28iOiJNw6F4aW1vIiwiZGV0YWxoZSI6IlPDsyB2YW50YWdlbnMgZGUgb25lIGxlZy9maWZ0eTsgZXNjYXBvdSBkYXMgY29zdGFzIn0seyJwYXJjZWlybyI6IiIsImZhaXhhUGVzbyI6IiIsImRldGFsaGUiOiJEZXRhbGhlcyBuw6NvIHJlZ2lzdHJhZG9zIn1dLCJmdW5jaW9ub3UiOiIiLCJ0cmF2b3UiOiIiLCJkb3IiOiIiLCJzb25vIjoiIiwiZW5lcmdpYSI6IiJ9fQ
```

Se preferir colar o JSON no botão "Importar treino" em vez de usar o link, o conteúdo é:

```json
{
  "importId": "jj-2026-10-28-ivone-x-guard",
  "session": {
    "data": "2026-10-28T19:00:00",
    "tipo": "JJ",
    "dur": 90,
    "pse": 7,
    "pesoAtleta": 63,
    "tecnica": "Ouchi gari, kouchi gari, desarme de X-guard, fold pass",
    "rolas": [
      { "parceiro": "Ivone", "faixaPeso": "Roxa, ~70kg", "detalhe": "Retenção de guarda, 1 raspagem" },
      { "parceiro": "", "faixaPeso": "Verde, ~65kg", "detalhe": "Raspagem de laço, knee cut, montada estabilizada" },
      { "parceiro": "", "faixaPeso": "Azul 4 graus, ~70kg", "detalhe": "Raspagem de laço para cem-quilos; ele recuperou a meia-guarda" },
      { "parceiro": "", "faixaPeso": "Roxa 1 grau, ~70kg", "esforco": "Máximo", "detalhe": "Só vantagens de one leg/fifty; escapou das costas" },
      { "parceiro": "", "faixaPeso": "", "detalhe": "Detalhes não registrados" }
    ],
    "funcionou": "", "travou": "", "dor": "", "sono": "", "energia": ""
  }
}
```

Reparos feitos na hora de montar esse treino: "carga 630" bate certinho com PSE(7) × duração(90) = 630 — o app já calcula isso sozinho a partir de `pse` e `dur`, então não existe campo separado de carga. "Funcionou", "travou", "dor", "sono" e "energia" ficaram vazios de propósito: o chat de 28/10 não trouxe essas respostas (a pergunta pós-treino é recurso novo, não existia nesse dia) — preferi deixar em branco a inventar. Testei a importação desse payload exato contra a validação real do app: ela aceita, e **infere sozinha** as tags de currículo `X-guard`, `Knee cut` e `Retenção de guarda` a partir do texto da técnica e das rolas (procura o nome de cada item do currículo dentro do texto) — isso mostra a inferência automática funcionando de verdade, não só no treino novo.

**Por quê base64url na URL em vez de mandar o JSON cru:** o GitHub Pages e a maioria dos apps de mensagens lidam melhor com um link de uma string só do que com JSON cheio de aspas e espaços (quebra em preview de link, por exemplo). Base64url evita caracteres que precisariam de escape na URL.

### 1.5 `sw.js`: `CACHE_VERSION` de `jjp-v1` para `jjp-v2`
Uma linha. O service worker descarta caches antigos cujo nome é diferente da versão atual (`keys.filter(k => k !== CACHE_VERSION)`); subir a versão é o gatilho pra isso rodar e o celular baixar os arquivos novos na próxima abertura do app, em vez de continuar servindo o `index.html` antigo do cache.

## 2. Dado existente no localStorage — o que foi preservado

Nenhuma chave existente mudou de nome ou de formato: `jj:p` (perfil), `jj:ss` (sessões), `jj:av` (avaliações físicas), `jj:sem` (semana), `jj:msg` (chat) continuam exatamente como estavam. Só acrescentei:
- Dois campos novos em `jj:p`: `jjDays` e `curriculo` — com `ensureProfileDefaults()` preenchendo o padrão só se o campo não existir, sem jamais sobrescrever o que já estava salvo.
- Campos novos em cada sessão de `jj:ss` (`tecnica`, `rolas`, `funcionou`, `travou`, `dor`, `sono`, `energia`, `curriculoTags`) — `ensureSessionDefaults()` faz o mesmo: sessões antigas, sem esses campos, continuam válidas e ganham os campos vazios só na leitura, nunca é reescrito no disco até você salvar algo novo.
- Uma chave nova, `jj:imp`, só com a lista de ids já importados (controle de duplicidade).

Ou seja: abrir o app com dados antigos não apaga nem reformata nada — ele só "aprende" os campos novos.

## 3. Revisão do diff (orig vs. work)

As skills de método (`engenharia-do-projeto`, `revisor-de-codigo`, `auditoria-de-seguranca`) em `/workspace/criabr_outros/` não estão instaladas nesta máquina (exigem rodar um instalador que mexe em `~/.claude/skills/` e peças do sistema via `apt`/`brew` — não fiz isso sem combinar com você, e o ambiente também não tem rede para instalar nada). Li o `SKILL.md` de cada uma e apliquei o **método delas manualmente**: usei `orig/` vs `work/` como a "diferença" (no lugar do `git diff` que a skill normalmente leria), revisei por lentes (comportamento, segurança/fronteiras, qualidade) e só registro abaixo o que tem cenário concreto de falha — nada de opinião de estilo.

Achados confirmados nesta revisão, já corrigidos:

1. **Perda de texto digitado ao tocar num chip.** No formulário de registro, trocar o PSE ou o tipo de treino re-renderiza o formulário inteiro; os campos de texto (técnica, funcionou, travou, dor, sono, energia, dados da rola) só sincronizavam no `onchange` (dispara ao perder o foco). Cenário: usuário digita "ouchi gari" em Técnica, sem clicar fora, toca num PSE diferente → o texto some. Troquei a sincronização para `oninput` (a cada tecla), então o re-render sempre reconstrói a partir do que já foi digitado.
2. **Mesmo problema na tela Configurações.** Marcar/desmarcar um dia de JJ ou editar o currículo re-renderizava a aba de IA inteira, o que apagaria uma edição em andamento nos campos Nome/Chave API/Peso/Altura/Idade do card de cima. Separei os cards: agora marcar um dia ou editar o currículo atualiza só o próprio card (`rerenderDiasCard`/`rerenderCurriculoCard`), sem tocar no resto da tela.
3. **XSS por atributo quebrado no currículo.** O botão de cada item do currículo pós-treino montava o `onclick` colando o nome do item dentro de aspas simples, só tratando aspas simples. Um item de currículo com aspas duplas (ex.: renomeado para algo com `"`) quebraria o atributo HTML e permitiria injetar HTML/JS — justamente o cenário que a checagem de segurança pediu pra vigiar (texto do usuário → innerHTML). Troquei para passar o **índice** do item em vez do texto cru no `onclick`; o texto só aparece via `esc()`, nunca dentro de um atributo montado à mão.

Achados descartados (sem cenário de falha, ou já cobertos): o padrão de chips com índice numérico (`onclick="fn(${i})"`) usado em rolas/currículo/dias é seguro porque `i`/`d` são sempre números gerados pelo próprio app, nunca texto do usuário.

## 4. Checagem de segurança (escopo combinado: app só local, sem backend)

Sem servidor, sem login, sem pagamento — a maior parte das 14 áreas da skill de auditoria completa (privilégio de banco, rotas sem guarda, webhook, sessão de servidor, rate limit...) **não se aplica**, exatamente como você orientou. Foquei nos três pontos que você pediu:

**a) XSS via `innerHTML` com texto do usuário/voz.** Escaneei todo lugar onde texto digitado, ditado por voz ou vindo de sessões é jogado em `innerHTML`. Adicionei uma função `esc()` (escapa `& < > " '`) e apliquei em: nome do perfil, chave de API (campo de senha, mas ainda assim escapado no `value`), mensagens do usuário no chat, tipo/técnica/rolas/funcionou/travou de cada sessão nas listas, currículo, e tudo que aparece na pré-visualização de importação. Achei e corrigi **dois pontos realmente vulneráveis** (não hipotéticos — testados): o `${s.tipo}` sem escape na lista "Últimas Sessões" (um treino importado com `tipo` malicioso executaria script ao abrir a tela Hoje) e o achado nº 3 da seção de revisão acima (atributo `onclick` quebrável no currículo). Os dois já estão corrigidos nesta entrega.
   - Decisão consciente de não escapar: as respostas do coach IA local (`localCoachReply`) usam `<strong>` de propósito para negrito — são geradas pelo próprio código, não por texto de terceiros, então não entram no escopo de XSS.
   - Risco residual aceito, de baixo impacto: se você colar uma chave Anthropic, a resposta da IA online não passa por `esc()` (pra preservar formatação). Isso só importa se a própria Anthropic devolvesse HTML malicioso a partir do seu próprio prompt — é "self-XSS" na sua própria sessão, com uma chave que só você controla. Não mexi nisso para não quebrar a formatação das respostas; fica registrado caso você queira endurecer depois.

**b) Dados de import por link.** Validação estrita (`validateImportPayload`): tipo obrigatório, duração 1–600, PSE 0–10, data precisa ser uma data válida, textos livres com limite de tamanho (nunca um payload gigante indo para o localStorage), rolas limitadas a 30 itens. Testei com três payloads propositalmente quebrados (campo faltando, JSON inválido, PSE fora de faixa) e os três foram rejeitados com mensagem específica — rodei isso de verdade (não é suposição), ver seção 6. O link nunca salva sozinho: sempre pré-visualiza e exige um clique de confirmação, e checa duplicidade por `importId` antes de deixar salvar de novo sem aviso.

**c) Não vazar dados.** Tudo continua 100% local: `localStorage` é a única persistência: nenhuma chamada de rede nova foi introduzida pelas mudanças (o único `fetch` do app é o existente, para a API da Anthropic, e só dispara se você colar sua própria chave). O reconhecimento de voz (`SpeechRecognition`) roda no navegador; em alguns navegadores (Chrome) o áudio passa pelo serviço de reconhecimento do Google para virar texto — é uma limitação da própria API do navegador, não deste app, e já era avisado na documentação do padrão; não há nada "extra" sendo enviado por este app.

## 5. Validação de sintaxe e teste leve

- **Sintaxe:** extraí os dois blocos `<script>` do `index.html` e rodei `node --check` — sem erro.
- **Lógica real (não só leitura):** montei um harness em Node (`vm.runInContext`) que carrega o JavaScript **de verdade** extraído do arquivo (não uma reimplementação) com stubs mínimos de `document`/`localStorage`/`navigator`, e chamei as funções diretamente: `getDayPlan`/`weekDayType` confirmando a inversão corrigida (Seg = JJ, Ter = Academia A, por padrão), `esc()` escapando um payload de teste `<img src=x onerror=alert(1)>`, e `validateImportPayload()` aceitando o treino de 28/10 de verdade e rejeitando os três payloads quebrados.
- **Teste visual (headless Chromium, já instalado):** abri o `index.html` via `file://` no Chrome headless em viewport de celular (390×844) e desktop (1280×900) — carrega sem erro de JavaScript no console, tela de perfil renderiza certo nas duas larguras. Não fui além disso (preencher formulário, clicar nos botões novos) porque a automação completa (Playwright/Puppeteer) não está instalada e não há rede pra instalar — segui a orientação de "se não for barato, pule": o que dava pra fazer sem dependência nova, fiz.

## 6. Evidência do que rodou (números copiados da saída, não inferidos)

```
$ node --check /tmp/combined.js
SYNTAX OK

$ node harness2.js   # exercita o JS real do app via vm.runInContext
jjDays default: [ 1, 3, 5 ]
Seg(1) plan: { tipo: 'jj' }
Ter(2) plan: { tipo: 'academia', letra: 'A' }
weekDayType Seg: JJ | Ter: Academia A | Dom: Academia A | Sab: Academia C
esc test: &lt;img src=x onerror=alert(1)&gt;&quot;&#39;
rejeita payload incompleto: { ok: false, erro: 'Campo "dur" (minutos) inválido — use 1 a 600.' }
rejeita JSON quebrado: false
rejeita pse fora do range: { ok: false, erro: 'Campo "pse" inválido — use 0 a 10.' }

$ node harness.js     # valida o treino real de 28/10 e o roundtrip do link
validateImportPayload ok: true
tipo: JJ dur: 90 pse: 7 pesoAtleta: 63
rolas: 5
curriculoTags (auto-inferidas): [ 'X-guard', 'Knee cut', 'Retenção de guarda' ]
importId: jj-2026-10-28-ivone-x-guard
link roundtrip ok: true mesmo importId: true
```

Não rodei (ficou para você conferir no celular, ver seção 7): o diálogo por voz completo (depende de microfone real), o fluxo de toque ponta a ponta (depende de interação real), e a instalação do PWA em si (depende de HTTPS/GitHub Pages publicado).

## 7. Como testar no celular

1. Publique o conteúdo de `./work/` no GitHub Pages (ou abra localmente, mas o reconhecimento de voz e a instalação como PWA exigem HTTPS — `file://` não é suficiente para isso, só para a navegação básica).
2. No celular, abra o site no Chrome (Android) ou Safari (iOS) e cole o link de importação do treino de 28/10 (seção 1.4) — a pré-visualização deve abrir sozinha; confira os dados e toque em "Confirmar e salvar".
3. Toque em **"Registrar treino por voz"** na tela Hoje — no Chrome/Android deve pedir permissão de microfone na primeira vez; responda as perguntas e veja o resumo falado antes de confirmar.
4. Em **IA → Configurações**, desmarque "Sex" e marque "Sáb" nos dias de JJ, salve, e confira na tela Treino que sábado virou JJ e sexta virou força.
5. Adicione um item novo ao currículo (ex.: "Berimbolo"), salve um treino rápido e marque esse item na pergunta pós-treino — confira se ele aparece na sugestão depois de registrar 2-3 treinos.
6. Para conferir que o cache novo pegou: no DevTools remoto (ou `chrome://inspect`) → Application → Service Workers, o nome do cache deve mostrar `jjp-v2`; force um "Atualizar" se o navegador ainda mostrar `jjp-v1`.
