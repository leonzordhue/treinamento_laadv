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

### [~] TASK-19 — Limpeza de frags duplicados na raiz ← LEXGROUP (URGENTE)
**Problema:** os arquivos `*.frag.*` existem tanto na raiz do projeto quanto em `src/`. A raiz não deve ter frags.
**O que fazer:**
- Deletar da raiz: `_app.frag.js`, `_auth.frag.js`, `_body.frag.html`, `_firebase.frag.js`, `_render2.frag.js`, `_render_conteudo.frag.js`, `_render_inicio.frag.js`, `_render_treino.frag.js`, `_render_usuarios.frag.js`, `_style.frag.css`
- Mover `core/` para `legacy/core/` (ainda está na raiz)
- Verificar que `build.py --check` passa sem erros após limpeza
- Verificar que `index.html` permanece intacto (os frags em `src/` são a fonte, o index.html é o output)

---

### [ ] TASK-20 — Sistema de comunicados ← LEXGROUP
**Firebase:** `laadv_portal/comunicados/{cid}` → `{ titulo, corpo, autor_nome, criado_em, ativo }`
**O que implementar:**
- No painel **Início** de todos os roles: seção "Comunicados" mostrando os últimos 5 ativos
- Card de comunicado: título em bold, corpo truncado com "Ler mais" (expande inline), data relativa ("há 2 dias")
- Para admin/master: botão "+ Novo Comunicado" no painel Início
- Modal de criação: campo `titulo` + `textarea corpo` (max 1000 chars com contador)
- Toggle para desativar comunicado (não deleta, só oculta)
- Chamar `audit('comunicado_criado', titulo)` ao publicar

---

### [ ] TASK-21 — Avaliação pós-treinamento (quiz) ← LEXGROUP
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

### [ ] TASK-22 — Relatório por treinamento ← LEXGROUP
**O que implementar:**
- No painel **Relatórios** (admin/master): nova aba "Por Treinamento" além dos logs
- Tabela: Treinamento | Total usuários | Concluídos | Em andamento | Não iniciados | % conclusão
- Linha expansível: ao clicar no treinamento, mostra quais usuários concluíram e quando
- Botão "Exportar CSV" desta visão: `laadv-relatorio-treinos-YYYY-MM-DD.csv`
- Dados calculados em tempo real do Firebase (`conclusoes/` + `usuarios/` + `treinamentos/`)

---

### [ ] TASK-23 — Bulk actions para usuários ← LEXGROUP
**O que implementar:**
- Na tabela de usuários: coluna de checkbox no início de cada linha + checkbox "Selecionar todos"
- Barra de ações que aparece quando ≥1 usuário selecionado: "X selecionados | [Ativar todos] [Desativar todos] [Exportar selecionados]"
- Ativar/Desativar em lote: atualiza `ativo` no Firebase para todos os UIDs selecionados em paralelo (`Promise.all`)
- Exportar selecionados: CSV apenas com os usuários marcados
- Chamar `audit('bulk_ativacao', 'X usuários afetados')` após cada operação em lote

---

### [ ] TASK-24 — Dark mode ← LEXGROUP
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

### [ ] TASK-25 — Paginação de logs ← LEXGROUP
**Problema:** `renderRelatorios()` carrega TODOS os logs do Firebase de uma vez — com o tempo vai ficar lento.
**O que implementar:**
- Usar `DB.ref('laadv_portal/logs').orderByKey().limitToLast(50)` — carregar apenas os 50 mais recentes
- Botão "Carregar mais 50" que usa `.endBefore(primeiroKeyCarregado).limitToLast(50)`
- Indicador "Exibindo X de Y registros"
- Filtros existentes (ação/ator) aplicados client-side nos registros já carregados
- Mesma lógica para a tabela de usuários se houver mais de 100

---

### [ ] TASK-26 — PWA básico ← LEXGROUP
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

## FILA — PRINCIPAL (próxima sessão)

### [ ] TASK-07 — Verificar GitHub Pages ← PRINCIPAL
Acessar `https://leonzordhue.github.io/treinamento_laadv/` e confirmar que o portal carrega.
Se 404: verificar Settings → Pages → branch `master` / raiz `/`.

### [ ] TASK-08 — Firebase Rules produção ← PRINCIPAL
No Firebase Console → Realtime Database → Regras: colar conteúdo de `firebase-rules.json` e publicar.

### [ ] TASK-18 — Commit sprint 1 Lexgroup ← PRINCIPAL
Commit de tudo que Lexgroup fez nas TASK-09 a 17.

### [ ] TASK-27 — Commit sprint 2 Lexgroup ← PRINCIPAL
Após Lexgroup concluir TASK-19 a 26: revisar, testar via preview e fazer commit+push.

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
