# Auditoria e Correções — Portal LAADV

> Documento de handoff para auditoria por outra IA / revisor humano.
> Autor: NEXUS (Opus 4.7, executor GPU) · Protocolo AKE/UFT-1.0
> Data: 2026-05-26
> Escopo: auditoria lógica do portal + aplicação das correções encontradas.

---

## 0. TL;DR

- Foram encontrados **1 bug crítico, 3 altos, 3 médios e 5 baixos** por análise estática lógica.
- **Todas as correções viáveis no nível de código foram aplicadas** diretamente em `index.html` e `firebase-rules.json`.
- **2 itens NÃO foram corrigidos** por serem arquiteturais (exigem backend/Firebase Auth) — documentados na seção 4.
- Validação: JSON das regras OK, sintaxe JS OK, e **6/6 testes lógicos PASS** (incluindo a regressão do bug crítico).

---

## 1. Descoberta estrutural importante (leia antes de tudo)

**A pipeline de build está divergente. `index.html` é a fonte de verdade real — NÃO os frags.**

- O projeto tem `src/*.frag.*` + `build.py` (resultado da TASK-15, "fragmentação").
- Porém os frags estão **congelados em 24/05/2026** e **não contêm**:
  - as funções do Sprint 3 (`processarImportCSV`, `reordenarTrein`, `abrirImportarCSV`, badge `nav-badge`, "comunicados inativos");
  - a meta tag **CSP** (TASK-28C);
  - o **PWA** (`manifest`, registro de `serviceWorker` — TASK-26).
- O template de `<head>` dentro do próprio `build.py` (linhas 58-76) **também não tem** CSP/PWA.
- Logo, rodar `python build.py` **regrediria** o portal (perderia Sprint 3 + CSP + PWA).

**Consequência prática:** `build.py --check` só confere a *existência* dos arquivos, não a equivalência de conteúdo — por isso dava "verde" enganoso. As correções desta auditoria foram aplicadas **somente em `index.html`** (o arquivo servido no GitHub Pages). **Não rodei `build.py`.**

> Recomendação para o time: ou (a) re-extrair os frags a partir do `index.html` atual e corrigir o `<head>` de `build.py`, ou (b) aposentar oficialmente a pipeline de frags e tratar `index.html` como fonte única.

---

## 2. Método

1. Leitura integral de `index.html` (2895 linhas), `firebase-rules.json`, `build.py` e dos frags `src/`.
2. Análise lógica manual (fluxos de auth, CRUD, permissões, render, XSS, sessão).
3. Validações automatizadas após as correções (ver seção 5).

Ambiente: análise estática + Node.js para checagem de sintaxe e testes unitários das helpers. **Não** executei o app ao vivo contra o Firebase (sem navegador/credenciais nesta sessão); as conclusões funcionais são determinísticas pela semântica da linguagem e confirmadas por teste unitário onde aplicável.

---

## 3. Correções aplicadas

Formato: **ID · severidade · arquivo:contexto · o quê/por quê · como verificar**.

### C1 — CRÍTICO — `confirmar()` quebrava todas as ações destrutivas
- **Arquivo:** `index.html`, função `confirmar()` + novo `window._execConfirm`.
- **Causa:** o rodapé do modal era montado com `onclick="fecharModal();(${onSim.toString()})()"`. `Function.prototype.toString()` serializa o **código-fonte** da callback; ao ser reinjetado e executado no **escopo global**, as variáveis de closure (`uid`, `nome`, `tid`, `vid`, `btn`, `uids`, `titulo`…) **não existem** → `ReferenceError` → o botão "Confirmar" não fazia nada.
- **Impacto:** inoperantes — `confirmarDesativar`, `deletarUsuario`, `bulkAtivar`, `bulkDesativar`, `deletarTreinComCheck`, `excluirVideoInline`, `excluirPergunta`, `deletarVideo`, `processarExclusao`, `solicitarExclusaoDados`. (Só `limparLogs` funcionava, por referenciar apenas globais.) Passou despercebido porque, segundo `tasks.md`, só o login foi testado.
- **Correção:** guardar a callback em `_confirmCb` e executá-la **por referência** (preserva o closure):
  ```js
  let _confirmCb = null;
  function confirmar(msg, onSim){
    _confirmCb = onSim;
    abrirModal('Confirmar ação', `<p ...>${msg}</p>`,
      `<button ... onclick="fecharModal()">Cancelar</button>
       <button ... onclick="window._execConfirm()">Confirmar</button>`);
  }
  window._execConfirm = function(){ const cb=_confirmCb; _confirmCb=null; fecharModal(); if(typeof cb==='function') cb(); };
  ```
- **Verificar:** teste unitário "confirmar preserva closure" (seção 5) → PASS. Em runtime: desativar/excluir um usuário deve funcionar.

### A2 — ALTO — Escalada de privilégio (admin promovia user → admin)
- **Arquivo:** `index.html`, `abrirFormUsuario()` (opções de role) e `salvarUsuario()` (validação).
- **Causa:** o `<select>` de perfil oferecia "Administrador" para qualquer admin, e `salvarUsuario` gravava `role` sem revalidar. Violava a regra do `CLAUDE.md` ("admin só gerencia user").
- **Correção:**
  1. As opções `admin`/`master` só aparecem se `S.user.role==='master'`.
  2. Guarda de defesa em profundidade em `salvarUsuario`: `if(S.user.role!=='master' && role!=='user'){ ...erro; return; }`.
- **Verificar:** logado como admin, o form de usuário só deve oferecer "Participante"; tentar forçar `role=admin` é bloqueado. (Obs.: o RTDB continua aberto — ver A1; esta é defesa de UI/cliente.)

### A3 — ALTO — Faltava `.indexOn` em `usuarios`
- **Arquivo:** `firebase-rules.json`, nó `usuarios`.
- **Causa:** login/criação usam `orderByChild('usuario')` sem índice → Firebase baixa **todos** os usuários e filtra no cliente (warning + vazamento + lentidão).
- **Correção:** adicionado `".indexOn": ["usuario"]`.
- **Verificar:** `python` (seção 5) confirma `indexOn == ['usuario']`. Publicar as regras no console e conferir ausência do warning de índice.

### M1 — MÉDIO — Nomes com apóstrofo quebravam botões (e abriam XSS via onclick)
- **Arquivo:** `index.html`, nova helper `jsAttr()` + 6 call-sites de `onclick`.
- **Causa:** `esc()` converte `'` → `&#039;`, que o parser HTML **decodifica de volta para `'`** antes de o JS rodar; em `onclick="fn('${esc(nome)}')"`, nomes como `O'Brien`/`D'Ávila` quebravam a string e permitiam injeção.
- **Correção:** nova `jsAttr()` (escapa para string JS **e** atributo HTML) aplicada nos 6 pontos que passam nome/título dentro de `onclick`: `confirmarDesativar`, `deletarUsuario`, `excluirVideoInline`, `deletarTreinComCheck`, `deletarVideo`, `processarExclusao`. (Em contexto de exibição `innerHTML`, `esc()` permanece — está correto lá.)
- **Verificar:** testes "jsAttr apostrofo"/"jsAttr aspas+tag" → PASS.

### M2 — MÉDIO — Certificado sem escape + sem guarda de pop-up
- **Arquivo:** `index.html`, `gerarCertificado()`.
- **Causa:** `u.nome`, `t.titulo`, `u.setor` injetados via `document.write` sem `esc()` (injeção na janela do certificado); e `w.document` lançava se o pop-up fosse bloqueado.
- **Correção:** `esc()` em nome/título/setor (inclusive no `<title>`) e `if(!w){ toast(...); return; }`.
- **Verificar:** gerar certificado com pop-up bloqueado → toast de aviso, sem erro. Nome com `<>&"` aparece literal.

### M3 — MÉDIO — Badge de comunicados era inerte
- **Arquivo:** `index.html`, `navTo()`.
- **Causa:** `atualizarBadgeComunicados()` só era chamado em `iniciarApp`, e `renderInicio` zera o badge ao abrir; como o app sempre inicia em "Início", o badge nunca recalculava ao chegar comunicado novo durante a navegação.
- **Correção:** ao final de `navTo`, `if(panel!=='inicio') atualizarBadgeComunicados();` — recalcula ao sair de Início.
- **Verificar:** estando em outro painel, publicar um comunicado em outra aba; ao navegar, o badge aparece; ao abrir "Início", zera.

### B1 — BAIXO — `var(--gap)` indefinida
- **Arquivo:** `index.html`, `:root`.
- **Causa:** `margin-top:var(--gap)` em `renderPerfil`/`renderConfig`, mas `--gap` não existia → margem ignorada.
- **Correção:** adicionado `--gap:18px;` em `:root`.

### B2 — BAIXO — Timestamp duplicado em `marcarVideoAssistido`
- **Arquivo:** `index.html`.
- **Causa:** `new Date().toISOString()` chamado 2× (DB e estado local) gerando valores divergentes.
- **Correção:** uma `const ts` reutilizada.

### B3 — BAIXO — Import CSV quebrava com vírgula em campo
- **Arquivo:** `index.html`, `processarImportCSV()` + nova helper `parseCsvLinha()`.
- **Causa:** `split(',')` ingênuo não respeitava aspas.
- **Correção:** `parseCsvLinha()` que respeita aspas duplas e vírgulas internas; usada no cabeçalho e nas linhas.
- **Verificar:** testes "csv simples"/"csv virgula citada" → PASS.

### B5 — BAIXO — Rótulo de contagem enganoso na paginação de logs
- **Arquivo:** `index.html`, `renderRelLogs()`.
- **Correção:** `"${lista.length} registros"` → `"${lista.length} registro(s) carregado(s)"` (reflete que é o subconjunto carregado/filtrado, não o total).

---

## 4. NÃO corrigido (arquitetural — exige backend)

### A1 — ALTO — Banco de dados totalmente aberto (`.read/.write: true`)
`firebase-rules.json` deixa `usuarios` (e outros nós) com leitura/escrita públicas. Qualquer pessoa com a URL do RTDB pode ler **todos os `senha_hash`** (SHA-256 sem salt) e até criar uma conta `master` direto no banco.
**Por que não foi corrigido aqui:** o modelo de auth roda 100% no cliente (sem Firebase Auth); o login precisa **ler** o `senha_hash` para comparar. Fechar a leitura quebraria o login. A correção real exige mover a verificação de credenciais para uma **Cloud Function** (ou adotar Firebase Auth) — mudança de arquitetura fora do escopo de "corrigir bugs". **Recomendação forte de priorização.**

### B4 — BAIXO — Rate-limit de login contornável
`tentativas/` tem `.write` público (necessário pré-login), então um atacante pode apagar o nó e zerar o bloqueio. Mesma causa-raiz de A1; só se resolve com backend.

---

## 5. Validações executadas (reproduzível)

```bash
# 1) Regras Firebase — JSONC válido + índice presente
python -c "import re,json; s=open('firebase-rules.json',encoding='utf-8').read(); \
  s=re.sub(r'/\*.*?\*/','',s,flags=re.DOTALL); d=json.loads(s); \
  print(d['rules']['laadv_portal']['usuarios']['.indexOn'])"
# -> ['usuario']

# 2) Sintaxe do JS embutido (extrai o bloco inline e compila com new Function)
node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8'); \
  const s=h.indexOf('const FIREBASE_CONFIG'),e=h.lastIndexOf('</'+'script>'); \
  new Function(h.slice(s,e)); console.log('sintaxe OK')"
# -> sintaxe OK

# 3) Testes lógicos das helpers + regressão do bug crítico
#    (arquivo _audit_test.js extrai jsAttr/parseCsvLinha do index.html e simula confirmar/_execConfirm)
node _audit_test.js
# -> 6 PASS / 0 FAIL
```

Resultados desta sessão:
- Regras: **OK**, `indexOn = ['usuario']`.
- Sintaxe JS: **OK** (2436 linhas no bloco inline).
- Testes lógicos: **6 PASS / 0 FAIL** — `jsAttr` (apóstrofo, aspas/tag, null), `parseCsvLinha` (simples, vírgula citada), `confirmar` preserva closure.
- Pendências antigas: `grep onSim.toString` = 0; `grep "split(',')"` = 0; `jsAttr(` = 7 (1 def + 6 usos); `parseCsvLinha` = 3 (1 def + 2 usos); `_execConfirm` = 2.

> O arquivo `_audit_test.js` é temporário e foi removido ao final. Para reproduzir, recrie-o a partir do bloco de teste acima ou peça ao NEXUS.

---

## 6. Arquivos alterados

| Arquivo | Alterações |
|---|---|
| `index.html` | C1, A2, M1, M2, M3, B1, B2, B3, B5 + helpers `jsAttr`, `parseCsvLinha`, `window._execConfirm` |
| `firebase-rules.json` | A3 (`.indexOn` em `usuarios`) |

Nenhum commit foi feito (protocolo AKE: WRITEBACK/commit é da instância Principal). Os frags `src/*` **não** foram tocados (estão obsoletos — ver seção 1).

---

## 7. Checklist para o auditor

- [ ] Confirmar C1 em runtime: desativar e excluir um usuário; excluir treinamento/vídeo; processar exclusão LGPD.
- [ ] Confirmar A2: logado como admin, o seletor de perfil não oferece admin/master.
- [ ] Publicar `firebase-rules.json` e checar ausência de warning de índice (A3).
- [ ] Testar nome com apóstrofo (ex.: `Maria D'Ávila`) nos botões de ação (M1).
- [ ] Decidir o destino da pipeline de frags/`build.py` (seção 1).
- [ ] Avaliar prioridade de A1 (migração para Cloud Function/Firebase Auth).

---

*AKE/UFT-1.0 | BUILD: LAADV-AUDIT-20260526 | IC: 0.95 | MÓDULO: AUDITORIA_CORRECOES*
