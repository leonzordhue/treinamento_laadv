# CLAUDE.md — Protocolo Operacional AKE/UFT-1.0
> Este arquivo é carregado automaticamente por qualquer instância Claude Code neste projeto.
> Define como TODA instância deve trabalhar — Principal e Lexgroup incluídas.

---

## 1. Identidade do Projeto

**Cliente:** Luís Albert Advocacia (LAADV)
**Produto:** Portal Corporativo de Treinamentos
**Stack:** HTML5 + Vanilla JS + Firebase Realtime Database (CDN, sem build)
**Hospedagem:** GitHub Pages → `https://leonzordhue.github.io/treinamento_laadv/`
**Repo:** `https://github.com/leonzordhue/treinamento_laadv`
**Arquivo principal:** `index.html` (single-file, fonte única de verdade)

---

## 2. Protocolo AKE/UFT-1.0

Todo trabalho segue o pipeline de 4 estágios inspirado em arquitetura de CPU:

```
FETCH → DECODE → EXECUTE → WRITEBACK
```

| Estágio    | O que acontece                                         | Quem executa     |
|------------|--------------------------------------------------------|------------------|
| FETCH      | Lê requisitos, contexto, arquivos relevantes           | Qualquer         |
| DECODE     | Planeja a abordagem, identifica dependências           | Qualquer         |
| EXECUTE    | Escreve/edita código, cria arquivos                    | Preferencialmente Lexgroup |
| WRITEBACK  | Testa, integra, faz commit e push                      | Somente Principal |

**IC (Instruction Completeness) ≥ 0.9** — nunca entregue uma task com menos de 90% concluída. Se não puder completar, documente o bloqueio em `tasks.md` antes de parar.

**Build ID:** Todo arquivo modificado deve ter no rodapé (em comentário):
```
<!-- AKE/UFT-1.0 | BUILD: LAADV-YYYYMMDD | IC: 1.0 | MÓDULO: nome -->
```

---

## 3. Divisão de Responsabilidades por Instância

### Instância Principal
- Coordena via `.claude/tasks.md`
- Faz FETCH de requisitos do usuário
- Integra e testa mudanças via preview
- **Único autorizado a fazer commit e push**
- Opera com tokens limitados → prioriza tarefas curtas

### Instância Lexgroup
- Executa tasks marcadas `← LEXGROUP` no `tasks.md`
- Faz DECODE + EXECUTE (escrita pesada de código)
- Reporta conclusão atualizando `tasks.md`
- **Nunca faz commit nem push**
- Opera com tokens amplos → assume tasks grandes

### Regra de ouro
> Ao terminar qualquer task: mude o status em `tasks.md` de `[~]` para `[x]` e adicione linha no Log de Coordenação.

---

## 4. Design System LAADV

### Tokens de cor (use sempre variáveis CSS, nunca hex direto)
```css
--teal:        #0B4A44   /* cor primária — topbar, botões, destaques */
--teal-mid:    #145E58   /* hover do teal */
--teal-dark:   #083830   /* variante escura */
--teal-light:  #EBF5F4   /* background suave teal */
--gold:        #C9A93E   /* acento — bordas douradas, badges */
--gold-hover:  #B8951E
--gold-light:  #FAF3E0   /* background suave gold */
--bg:          #F5F7F9   /* fundo da página */
--surface:     #ffffff   /* cards, modais */
--border:      #DDE3EC
--text:        #162030   /* texto principal */
--muted:       #5A6A7A   /* texto secundário */
```

### Tipografia
- **Títulos/Serif:** `Cormorant Garamond` (400, 600, 700)
- **Corpo/Sans:** `DM Sans` (300, 400, 500, 600, 700)
- Fontes carregadas via Google Fonts no `<head>`

### Topbar padrão
```css
background: var(--teal);
border-bottom: 3px solid var(--gold);
```

### Logo
```html
<div class="brand-logo">LA</div> <!-- fundo gold, texto teal, serif -->
```

---

## 5. Estrutura do Firebase

**Root:** `laadv_portal/`

```
config/
  setup_done      boolean
  org_name        string
  criado_em       ISO timestamp

usuarios/{uid}/
  nome            string
  usuario         string (login único)
  senha_hash      string (SHA-256 hex)
  role            "master" | "admin" | "user"
  setor           string
  cargo           string
  ativo           boolean
  primeiro_acesso boolean
  criado_em       ISO timestamp
  criado_por_nome string

treinamentos/{tid}/
  titulo          string
  descricao       string
  ativo           boolean
  ordem           number
  videos/{vid}/
    titulo        string
    url           string (YouTube)
    duracao       string

logs/{lid}/
  ts              ISO timestamp
  ator_id         string
  ator_nome       string
  ator_role       string
  acao            string
  detalhes        string

conclusoes/{uid}/{tid}  → ISO timestamp
```

---

## 6. Padrões de Código

### JavaScript — Estado global
```js
// Variáveis globais permitidas (declaradas no topo do script)
let S   = {};    // state: { user, role, ... }
let DB  = null;  // firebase database ref
let FB  = null;  // firebase app
```

### Funções expostas ao HTML (onclick)
```js
// SEMPRE declarar no window para funcionar com innerHTML dinâmico
window.minhaFuncao = function(param) { ... };
```

### Funções de render
```js
// Padrão: renderNomeDaPagina() — sempre limpa antes de escrever
function renderUsuarios() {
  document.getElementById('conteudo').innerHTML = `...`;
  // lógica JS após o innerHTML
}
```

### Auditoria
```js
// Toda ação relevante deve chamar audit()
async function audit(acao, detalhes) {
  await DB.ref('laadv_portal/logs').push({
    ts: new Date().toISOString(),
    ator_id: S.user.id,
    ator_nome: S.user.nome,
    ator_role: S.user.role,
    acao, detalhes
  });
}
```

### Toast (feedback ao usuário)
```js
toast('Mensagem de sucesso', 'success');  // verde
toast('Aviso importante', 'warn');        // amarelo
toast('Erro ocorrido', 'error');          // vermelho
toast('Informação', 'info');              // teal
```

---

## 7. Fragmentação de Arquivos

Quando uma task for grande o suficiente para dividir em módulos:

```
src/
  _style.frag.css      → design system completo
  _firebase.frag.js    → config + init Firebase
  _auth.frag.js        → login, setup, primeiro acesso, SHA-256
  _data.frag.js        → CRUD usuarios, treinamentos, logs
  _render.frag.js      → funções renderXxx()
  _ui.frag.js          → toast, modal, ake-bar, topbar
  _body.frag.html      → estrutura HTML do body
```

**Regras dos frags:**
- Máximo 300 linhas por frag
- Cada frag é independente (sem dependências circulares)
- Variáveis globais `S`, `DB`, `FB` disponíveis em todos
- Rodar `python build.py` para gerar o `index.html` final

---

## 8. Tom e Comunicação

- **Idioma:** Português do Brasil em tudo (UI, comentários, commits, docs)
- **Sem emojis** a menos que o usuário peça explicitamente
- **Respostas curtas** — uma frase de atualização, não parágrafos
- **Sem recap** de o que foi feito — o diff já mostra
- **Comentários no código:** só quando o PORQUÊ é não-óbvio. Nunca descreva o QUE o código faz
- **Sem features extras** além do que a task pede

---

## 9. Git — Regras

```bash
# Mensagem de commit padrão
feat: [descrição curta em português]

[corpo opcional]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Apenas a instância Principal faz commit e push.**
Lexgroup edita arquivos — Principal valida e commita.

---

## 10. Checklist antes de entregar uma task

- [ ] IC ≥ 0.9 (task >= 90% completa)
- [ ] Código testado mentalmente (sem erros de sintaxe óbvios)
- [ ] Design system LAADV respeitado (cores, fontes, tokens)
- [ ] Sem features além do escopo
- [ ] `tasks.md` atualizado com status `[x]`
- [ ] Build ID adicionado se arquivo novo foi criado
- [ ] Nenhum `console.log` de debug deixado no código
- [ ] Nenhum commit feito (se for Lexgroup)

---

## 11. Referência Rápida de Arquivos

| Arquivo | Descrição |
|---|---|
| `index.html` | App completo — fonte única de verdade |
| `firebase-rules.json` | Regras de segurança do Realtime Database |
| `build.py` | Script de build (concatena frags → index.html) |
| `README.md` | Documentação pública do projeto |
| `.claude/tasks.md` | Quadro de tarefas compartilhado entre instâncias |
| `.claude/LEXGROUP_BRIEFING.md` | Briefing detalhado para instância Lexgroup |
| `.claude/launch.json` | Config do servidor de preview local (porta 7402) |
| `src/*.frag.*` | Módulos fonte (criados quando necessário) |

---

*AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: CLAUDE_MD*
