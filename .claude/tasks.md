# LAADV Portal — Quadro de Tarefas Compartilhado
> Protocolo AKE/UFT-1.0 — coordenação Principal (Sonnet) + Lexgroup (Opus 4.7)
> Leia CLAUDE.md antes de executar qualquer task.

---

## Status rápido
- Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluído · `[!]` bloqueado

---

## Contexto do Projeto

**Arquivo principal:** `index.html` (~1439 linhas, single-file app)
**Stack:** HTML5 + Vanilla JS + Firebase Realtime Database (CDN compat v10)
**Design:** teal `#0B4A44`, gold `#C9A93E`, DM Sans + Cormorant Garamond
**Roles:** master > admin > user
**Repo:** `https://github.com/leonzordhue/treinamento_laadv` (GitHub Pages)
**Firebase:** projeto `laadv-portal` — credenciais JÁ inseridas no index.html
**Portal testado localmente:** login master funcionando, Firebase conectado.

---

## FILA ATIVA — LEXGROUP (Opus 4.7)

> Leia `CLAUDE.md` primeiro. Execute as tasks abaixo em sequência.
> A cada conclusão: marque `[x]` e adicione linha no Log de Coordenação.

---

### [x] TASK-09 — Painel Conteúdo completo ← LEXGROUP (ALTA PRIORIDADE)
**Arquivo:** `index.html` — função `renderConteudo()`
**Problema atual:** o painel existe mas está incompleto — não permite adicionar vídeos dentro de um treinamento já criado, não tem edição de treinamento, não tem reordenação.
**O que implementar:**
- Listar treinamentos com botão "Expandir" que mostra os vídeos cadastrados
- Botão "+ Adicionar Vídeo" dentro de cada treinamento expandido
- Modal para adicionar vídeo: campos `titulo`, `url` (YouTube), `duracao` (ex: "14min")
- Botão "Editar" no treinamento: abre modal com campos `titulo`, `descricao`, toggle `ativo`
- Botão "Excluir vídeo" em cada vídeo (com confirmação)
- Botão "Excluir treinamento" (com confirmação — só se não tiver conclusões)
- Salvar no Firebase: `laadv_portal/treinamentos/{tid}/videos/{push()}`
- Chamar `audit()` para todas as ações (criar vídeo, editar, excluir)
- IC ≥ 0.9 — painel deve ser 100% funcional ao final

---

### [x] TASK-10 — Progresso por vídeo ← LEXGROUP
**Arquivo:** `index.html` — função `renderTreinamentoDetalhe()`
**Problema atual:** a conclusão marca o treinamento inteiro de uma vez. Não há rastreamento por vídeo.
**O que implementar:**
- No Firebase: `laadv_portal/progresso/{uid}/{tid}/{vid}` → ISO timestamp (vídeo assistido)
- Na tela de detalhe do treinamento: cada vídeo tem botão "Marcar como assistido" (ou auto-marcar quando iframe termina — via `postMessage` do YouTube player API)
- Barra de progresso do treinamento calculada com base em vídeos assistidos / total de vídeos
- Treinamento marcado como "concluído" automaticamente quando todos os vídeos forem assistidos
- No painel "Início" do usuário: mostrar progresso de cada treinamento em andamento
- Chamar `audit()` ao marcar vídeo assistido

---

### [x] TASK-11 — Certificado de conclusão ← LEXGROUP
**Arquivo:** `index.html` — nova função `gerarCertificado(uid, tid)`
**O que implementar:**
- Quando treinamento concluído: botão "Baixar Certificado" aparece na tela de detalhe
- Certificado é uma página HTML impressível gerada via `window.open()` + `document.write()`
- Layout do certificado:
  - Fundo branco, bordas douradas (`#C9A93E`)
  - Logo "LA" em destaque (teal `#0B4A44`)
  - Texto: "Certificamos que **[nome do colaborador]** concluiu com êxito o treinamento **[título do curso]**"
  - Data de conclusão formatada em português
  - Assinatura: "Luís Albert Advocacia — Portal de Treinamentos"
  - Rodapé: "Documento gerado em [data] · AKE/UFT-1.0"
- Usar `window.print()` para acionar impressão/PDF

---

### [x] TASK-12 — Reset de senha pelo admin ← LEXGROUP
**Arquivo:** `index.html` — função `renderUsuarios()`
**O que implementar:**
- Na tabela de usuários, coluna "Ações": adicionar botão "Resetar Senha"
- Ao clicar: modal com campo "Nova senha temporária" + confirmação
- Salvar `senha_hash` (SHA-256) + setar `primeiro_acesso: true` no Firebase
- Usuário será forçado a trocar senha no próximo login (fluxo `sc-primeiro` já existe)
- Apenas master pode resetar senha de admin. Admin só pode resetar senha de user.
- Chamar `audit('reset_senha', 'Senha resetada para: ' + alvo.nome)`

---

### [x] TASK-13 — Dashboard com gráficos ← LEXGROUP
**Arquivo:** `index.html` — função `renderInicio()`
**O que implementar:**
- Adicionar `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>` no `<head>` (se não existir)
- No painel Início (para admin/master): substituir os KPI cards estáticos por dados reais do Firebase
- Gráfico 1 (bar): conclusões por treinamento (buscar `conclusoes/` no Firebase, agrupar por `tid`)
- Gráfico 2 (doughnut): distribuição de usuários por setor
- Gráfico 3 (line): conclusões acumuladas nos últimos 7 dias (baseado em timestamps)
- Cores: barras teal `#0B4A44`, linha gold `#C9A93E`, fundo `#EBF5F4`
- Para role `user`: manter o painel pessoal (treinamentos em andamento + concluídos)

---

### [x] TASK-14 — Exportação de relatórios CSV ← LEXGROUP
**Arquivo:** `index.html` — função `renderRelatorios()`
**O que implementar:**
- Botão "Exportar Logs CSV" — já existe mas faz `toast.info('em desenvolvimento')`. Implementar de verdade.
- Gerar Blob CSV com colunas: Data, Usuário, Role, Ação, Detalhes
- Botão "Exportar Usuários CSV" (novo): nome, setor, cargo, role, status, data admissão
- Botão "Exportar Progresso CSV" (novo): usuário, treinamento, vídeos assistidos, % conclusão, data conclusão
- Todos via `URL.createObjectURL(blob)` + `<a download>` programático
- Nomes de arquivo: `laadv-logs-YYYY-MM-DD.csv`, `laadv-usuarios-YYYY-MM-DD.csv`

---

### [x] TASK-15 — Fragmentação em src/*.frag.* ← LEXGROUP
**O que fazer:**
- Criar pasta `src/` na raiz do projeto
- Extrair do `index.html` atual para arquivos separados:
  - `src/_style.frag.css` — todo o bloco `<style>` (CSS)
  - `src/_body.frag.html` — todo o HTML do `<body>` (telas, modais, footer)
  - `src/_firebase.frag.js` — FIREBASE_CONFIG + inicialização
  - `src/_auth.frag.js` — funções: `doLogin`, `doSetup`, `doPrimeiroAcesso`, `hashSenha`, `audit`, `toast`
  - `src/_data.frag.js` — funções: getUsuarios, getTreinamentos, getLogs, getConclusoes (wrappers Firebase)
  - `src/_render.frag.js` — todas as funções `renderXxx()`
  - `src/_ui.frag.js` — `iniciarApp`, `navTo`, sidebar, topbar, modal, AKE bar
- `index.html` continua existindo e funcional (não modificar)
- `build.py` já existe e monta o `index.html` a partir dos frags — validar se o output bate com o original
- Cada frag deve ter no rodapé: `// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: nome`
- Máximo 300 linhas por frag — se ultrapassar, dividir

---

### [x] TASK-16 — .gitignore + limpeza ← LEXGROUP
**O que fazer:**
- Criar `.gitignore` na raiz:
  ```
  # Sistema
  *.TMP
  ~$*
  desktop.ini
  Thumbs.db
  # Python
  __pycache__/
  *.pyc
  # Editor
  .vscode/
  .idea/
  # OS
  .DS_Store
  ```
- Verificar se há arquivos sensíveis acidentalmente rastreados pelo git
- As pastas `academia/`, `compras/`, `core/`, `dashboard/`, `rh/` são o protótipo antigo — mover para `legacy/` e adicionar `legacy/README.md` explicando que são arquivos do protótipo multi-página supersedido pelo single-file

---

### [x] TASK-17 — Aviso de sessão expirando ← LEXGROUP
**Arquivo:** `index.html`
**O que implementar:**
- Sessão atual usa `sessionStorage` sem timeout
- Adicionar timeout de inatividade: 30 minutos sem interação → mostrar modal de aviso
- Modal: "Sua sessão expirará em 2 minutos por inatividade. Deseja continuar?"
- Botões: "Continuar sessão" (reinicia timer) | "Sair agora"
- Se sem resposta em 2 min → logout automático (`doLogout()`)
- Monitorar eventos: `mousemove`, `keydown`, `click` para resetar timer
- Timer implementado com `setTimeout` / `clearTimeout`

---

## FILA — LEXGROUP SPRINT 2 (Opus 4.7)

---

### [x] TASK-19 — Limpeza de frags duplicados na raiz ← LEXGROUP (URGENTE)
**Problema:** os arquivos `*.frag.*` existem tanto na raiz do projeto quanto em `src/`. A raiz não deve ter frags.
**O que fazer:**
- Deletar da raiz: `_app.frag.js`, `_auth.frag.js`, `_body.frag.html`, `_firebase.frag.js`, `_render2.frag.js`, `_render_conteudo.frag.js`, `_render_inicio.frag.js`, `_render_treino.frag.js`, `_render_usuarios.frag.js`, `_style.frag.css`
- Mover `core/` para `legacy/core/` (ainda está na raiz)
- Verificar que `build.py --check` passa sem erros após limpeza
- Verificar que `index.html` permanece intacto (os frags em `src/` são a fonte, o index.html é o output)

---

### [x] TASK-20 — Sistema de comunicados ← LEXGROUP
**Firebase:** `laadv_portal/comunicados/{cid}` → `{ titulo, corpo, autor_nome, criado_em, ativo }`
**O que implementar:**
- No painel **Início** de todos os roles: seção "Comunicados" mostrando os últimos 5 ativos
- Card de comunicado: título em bold, corpo truncado com "Ler mais" (expande inline), data relativa ("há 2 dias")
- Para admin/master: botão "+ Novo Comunicado" no painel Início
- Modal de criação: campo `titulo` + `textarea corpo` (max 1000 chars com contador)
- Toggle para desativar comunicado (não deleta, só oculta)
- Chamar `audit('comunicado_criado', titulo)` ao publicar

---

### [x] TASK-21 — Avaliação pós-treinamento (quiz) ← LEXGROUP
**Firebase:** `laadv_portal/treinamentos/{tid}/quiz/{qid}` → `{ pergunta, opcoes: [], correta: 0..3 }`
**Firebase:** `laadv_portal/respostas/{uid}/{tid}` → `{ score, total, ts }`
**O que implementar:**
- No painel Conteúdo (admin/master): aba "Quiz" dentro de cada treinamento expandido
- Adicionar/editar/remover perguntas: campo `pergunta` + 4 campos de `opcao` + radio `correta`
- Para o usuário: após completar todos os vídeos, botão "Fazer Avaliação" aparece
- Tela de quiz: perguntas em sequência, 1 por vez, sem voltar
- Resultado: "Você acertou X de Y — [Aprovado ≥70% | Reprovado]"
- Se aprovado: liberar certificado. Se reprovado: botão "Refazer" (sem limite de tentativas)
- Salvar melhor score no Firebase, mostrar no perfil

---

### [x] TASK-22 — Relatório por treinamento ← LEXGROUP
**O que implementar:**
- No painel **Relatórios** (admin/master): nova aba "Por Treinamento" além dos logs
- Tabela: Treinamento | Total usuários | Concluídos | Em andamento | Não iniciados | % conclusão
- Linha expansível: ao clicar no treinamento, mostra quais usuários concluíram e quando
- Botão "Exportar CSV" desta visão: `laadv-relatorio-treinos-YYYY-MM-DD.csv`
- Dados calculados em tempo real do Firebase (`conclusoes/` + `usuarios/` + `treinamentos/`)

---

### [x] TASK-23 — Bulk actions para usuários ← LEXGROUP
**O que implementar:**
- Na tabela de usuários: coluna de checkbox no início de cada linha + checkbox "Selecionar todos"
- Barra de ações que aparece quando ≥1 usuário selecionado: "X selecionados | [Ativar todos] [Desativar todos] [Exportar selecionados]"
- Ativar/Desativar em lote: atualiza `ativo` no Firebase para todos os UIDs selecionados em paralelo (`Promise.all`)
- Exportar selecionados: CSV apenas com os usuários marcados
- Chamar `audit('bulk_ativacao', 'X usuários afetados')` após cada operação em lote

---

### [x] TASK-24 — Dark mode ← LEXGROUP
**O que implementar:**
- Botão toggle 🌙/☀️ no topbar (canto direito, ao lado do avatar)
- Salvar preferência em `localStorage` key `laadv_theme`
- CSS: adicionar classe `dark` no `<body>` e sobrescrever variáveis:
  ```css
  body.dark {
    --bg: #0F1923; --surface: #162030; --border: #243040;
    --text: #E8EDF2; --muted: #8A9BAB;
    --teal: #1A6B63; --teal-mid: #1F7A71;
    --teal-light: #0F2B28;
  }
  ```
- Topbar e sidebar permanecem teal escuro (já são escuros — apenas ajustar contraste de texto)
- Ao iniciar app: verificar `localStorage` e aplicar classe antes do render

---

### [x] TASK-25 — Paginação de logs ← LEXGROUP
**Problema:** `renderRelatorios()` carrega TODOS os logs do Firebase de uma vez — com o tempo vai ficar lento.
**O que implementar:**
- Usar `DB.ref('laadv_portal/logs').orderByKey().limitToLast(50)` — carregar apenas os 50 mais recentes
- Botão "Carregar mais 50" que usa `.endBefore(primeiroKeyCarregado).limitToLast(50)`
- Indicador "Exibindo X de Y registros"
- Filtros existentes (ação/ator) aplicados client-side nos registros já carregados
- Mesma lógica para a tabela de usuários se houver mais de 100

---

### [x] TASK-26 — PWA básico ← LEXGROUP
**Arquivos a criar:** `manifest.json` e `sw.js` na raiz
**`manifest.json`:**
```json
{
  "name": "Portal LAADV",
  "short_name": "LAADV",
  "start_url": "/treinamento_laadv/",
  "display": "standalone",
  "background_color": "#0B4A44",
  "theme_color": "#0B4A44",
  "icons": [{ "src": "icon-192.png", "sizes": "192x192", "type": "image/png" }]
}
```
**`sw.js`:** service worker mínimo — apenas cache do shell (index.html + fontes Google) para funcionar offline
- No `index.html` `<head>`: adicionar `<link rel="manifest" href="manifest.json">` e registro do SW
- Criar `icon-192.png` placeholder (SVG inline convertido para data URI no manifest)
- **Importante:** o SW NÃO deve cachear chamadas ao Firebase (dados devem vir sempre online)

---

### [x] TASK-28 — Hardening de segurança ← LEXGROUP (CONFIDENCIAL)
> Documentação completa em `.claude/SECURITY_PRIVADO.md` (git-ignored, nunca commitar).
> Não adicionar comentários explicativos no código sobre o que cada proteção faz.

**A — Sanitização XSS:** criar `function sanitize(s)` e aplicar em TODO dado do Firebase renderizado via innerHTML.
**B — Rate limiting login:** bloquear após 5 tentativas em 15 min via `laadv_portal/tentativas/{login}` no Firebase. Mensagem genérica sempre: "Usuário ou senha incorretos".
**C — CSP meta tag:** adicionar `<meta http-equiv="Content-Security-Policy">` no head permitindo apenas domínios necessários (Firebase, YouTube, jsDelivr, Google Fonts).
**D — LGPD exclusão:** botão "Solicitar exclusão dos meus dados" no Meu Perfil → grava em `laadv_portal/solicitacoes_exclusao/{uid}`. Painel no Config (master) para processar.
**E — Validação de sessão:** gravar `criada_em + ua` na sessão, validar a cada navTo(), logout automático após 8h absolutas.
**F — Sanitizar logs:** garantir que nenhuma chamada `audit()` registra senha_hash ou dados sensíveis.

---

## FILA — PRINCIPAL (próxima sessão)

### [x] TASK-07 — Verificar GitHub Pages ← PRINCIPAL
Portal online em https://leonzordhue.github.io/treinamento_laadv/ — login testado e funcionando.

### [x] TASK-08 — Firebase Rules produção ← PRINCIPAL
Regras publicadas no Firebase Console.

### [x] TASK-18 — Commit sprint 1 Lexgroup ← PRINCIPAL
Concluído — 20 arquivos, 3699 inserções. Push feito.

### [x] TASK-27 — Commit sprint 2 Lexgroup ← PRINCIPAL
Concluído — commit `0300591` feat: sprint 2 Lexgroup.

### [x] TASK-29 — Commit sprint segurança ← PRINCIPAL
Concluído — commit `ef70147` refactor: melhorias de robustez e conformidade no portal.

---

## FILA — SPRINT 3 (Lexgroup)

> Leia `CLAUDE.md` antes de executar. Execute em sequência. Marque `[x]` ao concluir cada task.

---

### [x] TASK-30 — Bug: reativar comunicados ← LEXGROUP
**Arquivo:** `index.html` — função `buildComunicadosHtml()`
**Problema:** comunicados desativados somem da interface e não há como reativá-los.
**O que implementar:**
- No painel Início, para admin/master: adicionar aba ou seção "Comunicados inativos" logo abaixo dos ativos
- Listar comunicados onde `ativo === false`, mostrando título e data
- Botão "Reativar" em cada um → chama `toggleComunicado(cid, true)` já existente
- Se não houver inativos, não exibir a seção
- Nenhuma nova estrutura no Firebase — só ajuste de UI

---

### [x] TASK-31 — Reordenar treinamentos com botões ↑↓ ← LEXGROUP
**Arquivo:** `index.html` — função `renderConteudo()`
**Problema:** o campo `ordem` existe mas o usuário precisa digitar números — sem UI visual.
**O que implementar:**
- Em cada card de treinamento no painel Conteúdo, adicionar dois botões: `↑` e `↓` (ao lado dos botões "Expandir" e "Editar")
- `↑` troca a `ordem` do treinamento atual com o anterior na lista ordenada
- `↓` troca com o próximo
- O primeiro da lista não tem `↑`. O último não tem `↓`
- Salvar a nova ordem no Firebase via `dbUpdate('treinamentos/{tid}', { ordem: novoValor })`
- Chamar `audit('REORDENAR_TREINAMENTO', 'Reordenou: título')`
- Após salvar, re-renderizar `renderConteudo()`
- Não exibir o campo "Ordem de exibição" numérico no modal de edição (remover esse campo do `abrirFormTrein()`)

---

### [x] TASK-32 — Importar usuários via CSV ← LEXGROUP
**Arquivo:** `index.html` — painel Usuários
**O que implementar:**
- Botão "Importar CSV" no cabeçalho do painel Usuários (ao lado do "+ Novo Usuário")
- Modal com: instrução de formato + `<input type="file" accept=".csv">` + botão "Processar"
- Formato esperado do CSV (primeira linha = cabeçalho):
  ```
  nome,usuario,senha,role,setor,cargo
  João Silva,joao.silva,Senha123,user,Jurídico,Advogado
  ```
- Processar linha por linha: hashear `senha` com `sha256()`, verificar se `usuario` já existe, criar via `dbPush('usuarios', {...})`
- Ao final: toast com resumo "X criados, Y com erro (login duplicado)"
- Auditoria: `audit('IMPORTAR_USUARIOS', 'X usuários importados via CSV')`
- Roles válidos: `user`, `admin`. Se inválido ou ausente → `user`
- Senha mínima 6 chars. Se inválida → pular com erro
- Incluir botão "Baixar modelo CSV" que gera um CSV de exemplo via `csvDownload()`

---

### [x] TASK-33 — Badge de comunicados não lidos na sidebar ← LEXGROUP
**Arquivo:** `index.html` — função `buildNav()`
**O que implementar:**
- No item "Início" da sidebar, adicionar um badge numérico com a contagem de comunicados ativos não vistos
- "Não visto" = comunicado criado após o timestamp salvo em `localStorage` key `laadv_comun_visto` (ISO string da última vez que o usuário abriu o painel Início)
- Ao renderizar `renderInicio()`: atualizar `localStorage.setItem('laadv_comun_visto', new Date().toISOString())`
- Badge aparece em vermelho ao lado do label "Início": `<span class="nav-badge">3</span>`
- CSS do badge: `position:absolute; right:12px; background:var(--danger); color:#fff; font-size:10px; font-weight:700; border-radius:99px; padding:1px 6px; min-width:16px; text-align:center`
- Se contagem = 0, não renderizar o badge
- Ao trocar de painel e voltar para Início, badge deve sumir

---

### [x] TASK-34 — Limpeza de dead code ← LEXGROUP
**Arquivo:** `index.html` — função `renderRelTreins()`
**O que fazer:**
- Remover a variável `emAndamento` e seu cálculo (linha dentro do `.map()` em `renderRelTreins`) — ela é calculada mas nunca usada
- Verificar se há outros `let`/`const` declarados e não referenciados no arquivo — remover se encontrar
- IC ≥ 0.9 — não alterar nenhuma lógica, apenas remover dead code confirmado

---

## FILA — PRINCIPAL (sprint 3)

### [x] TASK-35 — Commit sprint 3 ← PRINCIPAL
Concluído — sprint 3 revisado e publicado.

---

## Log de Coordenação
| Data       | Instância  | Ação                        |
|------------|------------|-----------------------------|
| 2026-05-24 | Principal  | Quadro criado, TASK-01 iniciada |
| 2026-05-24 | Lexgroup   | TASK-02 concluída — sidebar mobile drawer + backdrop + hambúrguer |
| 2026-05-24 | Lexgroup   | TASK-03 concluída — spinner, busca usuários, filtros logs, confirmações |
| 2026-05-24 | Lexgroup   | TASK-04 concluída — firebase-rules.json com validação de estrutura |
| 2026-05-24 | Lexgroup   | TASK-05 concluída — README.md com badges, configuração, estrutura, papéis |
| 2026-05-24 | Principal  | TASK-06 concluída — commit + push origin master |
| 2026-05-24 | Principal  | Firebase configurado, credenciais inseridas, master account criado |
| 2026-05-24 | Principal  | CLAUDE.md criado — protocolo de treinamento para todas as instâncias |
| 2026-05-24 | Principal  | tasks.md expandido — TASK-09 a TASK-18 enfileiradas para Lexgroup Opus 4.7 |
| 2026-05-24 | Lexgroup   | TASK-09 concluída — Painel Conteúdo: cards expand/collapse, add vídeo inline, editar com toggle ativo, excluir com check conclusões |
| 2026-05-24 | Lexgroup   | TASK-10 concluída — Progresso por vídeo: progresso/${uid}/${tid}/${vid}, barra progresso, auto-conclusão, firebase-rules.json atualizado |
| 2026-05-24 | Lexgroup   | TASK-11 concluída — Certificado de conclusão: gerarCertificado() via window.open + CSS imprimível + window.print() |
| 2026-05-24 | Lexgroup   | TASK-12 concluída — Reset senha: botão Resetar Senha na tabela de usuários, podeResetarSenha() com hierarquia de roles |
| 2026-05-24 | Lexgroup   | TASK-13 concluída — Dashboard gráficos: Chart.js 4.4.0, bar/doughnut/line com dados reais do Firebase |
| 2026-05-24 | Lexgroup   | TASK-14 concluída — CSV exports: csvDownload helper, exportarUsuarios(), exportarProgresso() |
| 2026-05-24 | Lexgroup   | TASK-15 concluída — Fragmentação src/*.frag.*: 10 frags ≤300 linhas cada, build.py atualizado |
| 2026-05-24 | Lexgroup   | TASK-16 concluída — .gitignore criado, pastas legacy/ movidas com README |
| 2026-05-24 | Lexgroup   | TASK-17 concluída — Timer inatividade 30min: aviso 2min antes, continuarSessao(), logout automático |
| 2026-05-24 | Lexgroup   | TASK-19 concluída — Limpeza frags raiz, core/ → legacy/core/ |
| 2026-05-24 | Lexgroup   | TASK-20 concluída — Sistema comunicados: CRUD, toggle ativo, cards com "Ler mais", data relativa |
| 2026-05-24 | Lexgroup   | TASK-21 concluída — Quiz: iniciarQuiz, renderQuestaoAtual, selecionarOpcaoQuiz, proximaQuestao, finalizarQuiz; resultado + certificado; histórico no perfil; firebase-rules.json com respostas/ e quiz/ |
| 2026-05-24 | Lexgroup   | TASK-22 concluída — Relatório por treinamento: tab "Por Treinamento", tabela com % conclusão, rows expansíveis, exportar CSV |
| 2026-05-24 | Lexgroup   | TASK-23 concluída — Bulk actions: checkboxes, sel-all, bulk-bar, bulkAtivar/bulkDesativar/bulkExportar, audit em lote |
| 2026-05-24 | Lexgroup   | TASK-24 concluída — Dark mode: body.dark CSS vars, toggleDarkMode(), localStorage, botão ☀️/🌙 no topbar |
| 2026-05-24 | Lexgroup   | TASK-25 concluída — Paginação logs: limitToLast(50), carregarMaisLogs() com endBefore(), indicador de total |
| 2026-05-24 | Lexgroup   | TASK-26 concluída — PWA: manifest.json, sw.js (cache-first shell, network-only Firebase), meta theme-color, SW registration |
| 2026-05-24 | Lexgroup   | TASK-28 concluída — A: sanitize()+esc(); B: rate-limit login 5x/15min; C: CSP meta tag; D: LGPD exclusão (solicitarExclusaoDados+processarExclusao); E: sessão 8h+UA; F: scrub SHA-256 em audit() |
| 2026-05-25 | Principal  | TASK-27 e TASK-29 marcadas [x] — commits já existiam no repo |
| 2026-05-25 | Principal  | Auditoria completa do portal — 3 bugs + 4 lacunas identificadas |
| 2026-05-25 | Principal  | TASK-30 a 34 enfileiradas para Lexgroup Sprint 3 |
| 2026-05-25 | Lexgroup   | TASK-30 concluída — seção "Comunicados inativos" com botão Reativar em buildComunicadosHtml |
| 2026-05-25 | Lexgroup   | TASK-31 concluída — botões ↑↓ em renderConteudo, reordenarTrein(), campo Ordem removido do modal |
| 2026-05-25 | Lexgroup   | TASK-32 concluída — botão Importar CSV, processarImportCSV(), baixarModeloCSV(), validação completa |
| 2026-05-25 | Lexgroup   | TASK-33 concluída — .nav-badge CSS, S.comBadge em buildNav, atualizarBadgeComunicados(), reset em renderInicio |
| 2026-05-25 | Lexgroup   | TASK-34 concluída — emAndamento removido de renderRelTreins |
| 2026-05-25 | Principal  | TASK-35 concluída — sprint 3 revisado e publicado |
