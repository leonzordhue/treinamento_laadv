# LEXGROUP BRIEFING — Protocolo de Operação Multi-Instância
> Leia este documento inteiro antes de executar qualquer tarefa.
> Você é a instância de processamento pesado. A instância Principal é a coordenadora.

---

## 1. Quem somos e como trabalhamos

Trabalhamos com um modelo de desenvolvimento chamado **Emulação Digital Axiomática**, onde o processo de construção de software imita a arquitetura interna de uma CPU de videogame/computador:

```
┌─────────────────────────────────────────────────────────┐
│                  PIPELINE AKE/UFT-1.0                   │
│                                                         │
│  FETCH → DECODE → EXECUTE → WRITEBACK                   │
│                                                         │
│  FETCH:     Principal lê requisitos e delega            │
│  DECODE:    Lexgroup interpreta e planeja               │
│  EXECUTE:   Lexgroup escreve código / arquivos          │
│  WRITEBACK: Principal integra, testa e faz commit       │
└─────────────────────────────────────────────────────────┘
```

**IC (Instruction Completeness) ≥ 0.9** — toda tarefa deve ser >= 90% completa ao ser entregue. Não entregue parcial sem sinalizar.

---

## 2. Protocolo AKE/UFT-1.0

Todo arquivo criado ou editado deve ter no rodapé (em comentário):
```
<!-- AKE/UFT-1.0 | BUILD: LAADV-[DATA] | IC: 1.0 | MÓDULO: [nome] -->
```

Toda ação relevante deve ser registrada em `.claude/tasks.md`:
- Mude `[ ]` → `[~]` ao INICIAR
- Mude `[~]` → `[x]` ao CONCLUIR
- Adicione linha no Log de Coordenação com data, instância e ação

---

## 3. Arquitetura do Projeto LAADV

**Projeto:** Portal Corporativo de Treinamentos — Luís Albert Advocacia
**Stack:** HTML5 + Vanilla JS + Firebase Realtime Database (sem build, sem framework)
**Hospedagem:** GitHub Pages (`leonzordhue/treinamento_laadv`)
**Arquivo principal:** `index.html` (single-file, ~1313 linhas)

**Design System LAADV:**
```css
--teal: #0B4A44        /* cor primária */
--teal-mid: #145E58    /* hover/variante */
--teal-dark: #083830   /* dark variant */
--teal-light: #EBF5F4  /* background suave */
--gold: #C9A93E        /* acento / destaque */
--gold-hover: #B8951E
--gold-light: #FAF3E0
```
Fontes: `Cormorant Garamond` (títulos/serif) + `DM Sans` (corpo/sans)
Topbar: `background: var(--teal); border-bottom: 3px solid var(--gold)`

**Roles:** `master` (Super Admin) > `admin` (Administrador) > `user` (Participante)

**Firebase DB root:** `laadv_portal/`
```
config/           { setup_done, org_name }
usuarios/{uid}    { nome, usuario, senha_hash, role, setor, cargo, ativo, primeiro_acesso }
treinamentos/{tid}{ titulo, descricao, ativo, ordem, videos/{vid} }
logs/{lid}        { ts, ator_id, ator_nome, acao, detalhes }
conclusoes/{uid}/{tid} → ISO timestamp
```

---

## 4. Modelo de Fragmentação — CPU Analogy

O projeto usa **fragmentação modular de responsabilidade**, como bancos de memória de um cartucho:

```
src/
  _style.frag.css      → Design system completo (CSS puro)
  _firebase.frag.js    → Config + inicialização Firebase
  _auth.frag.js        → Login, setup, primeiro acesso, hash SHA-256
  _data.frag.js        → CRUD usuarios, treinamentos, logs, conclusões
  _render.frag.js      → Todas as funções renderXxx()
  _ui.frag.js          → Toast, modal, AKE bar, topbar
build.py               → Concatena os frags em index.html final
```

**Regras de fragmentação:**
1. Cada `.frag` é autossuficiente — não depende de variável global não declarada no próprio frag
2. Ordem de carregamento: style → firebase → auth → data → render → ui
3. Variáveis globais do app: `S` (state), `DB` (firebase ref), `FB` (app firebase)
4. Funções expostas ao `window.` devem ser declaradas explicitamente no frag que as define
5. Nenhum frag ultrapassa 300 linhas — se ultrapassar, dividir em sub-frags

**Quando trabalhar em frags vs index.html direto:**
- Tasks pontuais de CSS/UX → editar `index.html` direto (mais rápido)
- Refatorações grandes ou novas funcionalidades → criar/editar frags e rodar build

---

## 5. Regras de Conduta desta Instância

1. **Sempre leia `tasks.md` primeiro** para ver o estado atual
2. **Nunca toque em TASK-01 ou TASK-06** — são exclusivas da instância Principal
3. **Não faça commits nem push** — isso é responsabilidade do Principal
4. **Ao terminar uma task**, atualize `tasks.md` imediatamente
5. **Se encontrar um bug** fora do escopo da sua task, documente em `tasks.md` como nova task `[ ] TASK-XX — [descrição] ← PRINCIPAL` e continue
6. **Tokens são recurso escasso** — Principal tem poucos, você tem mais. Assuma as tasks pesadas proativamente
7. **Fragmentação primeiro** — se uma task parecer grande, proponha fragmentá-la antes de executar

---

## 6. Como reportar ao Principal

Ao concluir qualquer task, escreva no arquivo `.claude/tasks.md`:
```markdown
| 2026-XX-XX | Lexgroup | TASK-XX concluída: [resumo do que foi feito] |
```

O Principal lerá isso e saberá o que integrar/testar sem você precisar de relay humano.

---

## 7. Referência rápida de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | App completo (fonte única de verdade) |
| `.claude/tasks.md` | Quadro de tarefas compartilhado |
| `.claude/LEXGROUP_BRIEFING.md` | Este documento |
| `firebase-rules.json` | Regras de segurança (a criar — TASK-04) |
| `README.md` | Documentação pública (a criar — TASK-05) |
| `src/*.frag.*` | Módulos fonte (a criar quando necessário) |

---

*AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: LEXGROUP_BRIEFING*
