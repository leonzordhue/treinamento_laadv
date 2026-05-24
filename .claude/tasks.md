# LAADV Portal — Quadro de Tarefas Compartilhado
> Protocolo de coordenação entre instâncias Claude Code (Principal + Lexgroup)
> Atualize o status ao iniciar e concluir cada tarefa.

---

## Como usar
- **Instância Principal** (tokens limitados): tarefas curtas, integração, git
- **Instância Lexgroup** (tokens amplos): tarefas de escrita/edição pesada
- Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluído

---

## Contexto do Projeto

**Arquivo principal:** `index.html` (1313 linhas, single-file app)
**Stack:** HTML5 + Vanilla JS + Firebase Realtime Database (CDN compat v10)
**Design:** teal `#0B4A44`, gold `#C9A93E`, DM Sans + Cormorant Garamond
**Roles:** master > admin > user
**Repo:** `https://github.com/leonzordhue/treinamento_laadv` (GitHub Pages)

**Firebase config** está em `index.html` linhas 406–413 com `"COLE_AQUI"` — aguardando credenciais do usuário.

---

## Fila de Tarefas

### [~] TASK-01 — Firebase Setup ← PRINCIPAL
Aguardando usuário criar projeto Firebase e fornecer credenciais.
Quando receber: editar linhas 406–413 do `index.html`, substituir `"COLE_AQUI"`.
Depois: testar via preview, commit, push.

---

### [x] TASK-02 — Mobile Responsivo ← LEXGROUP
**Arquivo:** `index.html`
**O que fazer:**
- Sidebar (`--sidebar:240px`) vira drawer em telas < 768px
- Botão hambúrguer `☰` no topbar (lado esquerdo, mobile only)
- Sidebar como overlay com backdrop semitransparente
- Botão `✕` para fechar sidebar
- Tabelas com scroll horizontal em mobile
- Não alterar nenhuma lógica JS de negócio

---

### [x] TASK-03 — Melhorias UX ← LEXGROUP
**Arquivo:** `index.html`
**O que fazer:**
- Botões de salvar: disable + spinner inline durante operação async
- `renderUsuarios`: adicionar campo `<input>` de busca por nome/setor acima da tabela
- `renderRelatorios`: adicionar filtro por ação/ator acima da tabela de logs
- Confirmação antes de desativar usuário (além do já existente para deletar)
- Campo descrição do treinamento: contador de caracteres (max 300)

---

### [x] TASK-04 — Firebase Rules ← LEXGROUP
**Arquivo a criar:** `firebase-rules.json` (na raiz do projeto)
**Estrutura do banco:**
```
laadv_portal/
  config/         → setup_done, org_name, criado_em
  usuarios/{uid}/ → nome, usuario, senha_hash, role, setor, cargo, ativo, primeiro_acesso
  treinamentos/{tid}/ → titulo, descricao, ativo, ordem, videos/{vid}
  logs/{lid}/     → ts, ator_id, ator_nome, acao, detalhes
  conclusoes/{uid}/{tid} → ISO timestamp
```
**Regras:** app usa auth própria (não Firebase Auth), então usar regras abertas com validação de estrutura. Documentar cada bloco.

---

### [x] TASK-05 — README.md ← LEXGROUP
**Arquivo a criar:** `README.md` (na raiz do projeto)
**Conteúdo:**
- Badge GitHub Pages + Firebase
- Descrição do portal (PT-BR, tom profissional)
- Seção "Como configurar" (4 passos Firebase)
- Seção "Estrutura do banco de dados"
- Seção "Papéis e permissões" (master/admin/user)
- Seção "Tecnologias utilizadas"

---

### [ ] TASK-06 — Commit & Push ← PRINCIPAL
Após TASK-01, 02, 03, 04, 05 concluídas:
- `git add index.html firebase-rules.json README.md`
- Commit com mensagem padrão
- Push para `origin master`
- Verificar GitHub Pages ativo

---

## Log de Coordenação
| Data       | Instância  | Ação                        |
|------------|------------|-----------------------------|
| 2026-05-24 | Principal  | Quadro criado, TASK-01 iniciada |
| 2026-05-24 | Lexgroup   | TASK-02 concluída — sidebar mobile drawer + backdrop + botão ✕ + hambúrguer mobile-only |
| 2026-05-24 | Lexgroup   | TASK-03 concluída — spinner em todos os botões de salvar, busca em usuários, filtros em relatórios, confirmação de desativar, contador de chars na descrição |
| 2026-05-24 | Lexgroup   | TASK-04 concluída — firebase-rules.json criado com validação de estrutura para todos os nós |
| 2026-05-24 | Lexgroup   | TASK-05 concluída — README.md criado com badges, configuração, estrutura do banco, papéis e tecnologias |
