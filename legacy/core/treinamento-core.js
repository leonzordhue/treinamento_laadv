'use strict';

window.TC = (() => {

  const VERSION  = '1.0.0';
  const BUILD_ID = 'TC-LAADV-20250524';

  // ── AKE/UFT-1.0 ──────────────────────────────────────────────────────────

  const _akeLog = JSON.parse(sessionStorage.getItem('_tc_ake_log') || '[]');

  const ake = {
    log: _akeLog,

    fetch(input, label) {
      if (input === null || input === undefined)
        return { ok: false, error: 'FETCH: input nulo', label };
      return { ok: true, data: input, label };
    },

    decode(fetched, parser) {
      if (!fetched.ok) return fetched;
      try {
        return { ok: true, data: parser ? parser(fetched.data) : fetched.data, label: fetched.label };
      } catch (e) {
        return { ok: false, error: `DECODE: ${e.message}`, label: fetched.label };
      }
    },

    execute(decoded, fn) {
      if (!decoded.ok) return decoded;
      try {
        return { ok: true, data: fn(decoded.data), label: decoded.label };
      } catch (e) {
        return { ok: false, error: `EXECUTE: ${e.message}`, label: decoded.label };
      }
    },

    writeback(result, ic = 0.95) {
      const entry = {
        ts: new Date().toISOString(),
        label: result.label,
        ok: result.ok,
        ic,
        error: result.error || null,
      };
      if (ic < 0.9 && result.ok) {
        entry.ok    = false;
        entry.error = `WRITEBACK bloqueado — IC=${ic} < 0.9`;
      }
      _akeLog.push(entry);
      sessionStorage.setItem('_tc_ake_log', JSON.stringify(_akeLog.slice(-100)));
      if (!entry.ok) console.warn('[TC/AKE]', entry.error);
      return entry.ok ? result.data : null;
    },

    run(input, { label, parser, fn, ic = 0.95 }) {
      return this.writeback(
        this.execute(this.decode(this.fetch(input, label), parser), fn),
        ic
      );
    },

    lastIC() {
      const last = _akeLog[_akeLog.length - 1];
      return last ? last.ic : 1.0;
    },
  };

  // ── AUTH ──────────────────────────────────────────────────────────────────
  //
  // Banco de acessos mock — substituir por chamada autenticada ao backend
  // quando o cliente tiver infraestrutura definida.
  //
  const _USERS_DB = {
    'ADMIN2025': { name: 'Administrador',  sector: 'Administrativo',    role: 'admin',       modules: ['academia','rh','compras','dashboard'] },
    'COLAB001':  { name: 'Colaborador',    sector: 'Operações',         role: 'colaborador', modules: ['academia'] },
    'RH2025':    { name: 'Gestor de RH',   sector: 'Recursos Humanos',  role: 'rh',          modules: ['academia','rh','dashboard'] },
    'COMP2025':  { name: 'Gestor Compras', sector: 'Compras',           role: 'compras',     modules: ['academia','compras','dashboard'] },
  };

  const auth = {
    login(code) {
      const user = _USERS_DB[code.trim().toUpperCase()];
      if (!user) return false;
      sessionStorage.setItem('_tc_user', JSON.stringify(user));
      ake.run(user, { label: 'auth.login', fn: u => u });
      return true;
    },
    logout() {
      sessionStorage.clear();
      window.location.href = '/index.html';
    },
    getUser() {
      const raw = sessionStorage.getItem('_tc_user');
      return raw ? JSON.parse(raw) : null;
    },
    isLoggedIn()  { return !!this.getUser(); },
    hasModule(m)  { const u = this.getUser(); return u ? u.modules.includes(m) : false; },
    requireAuth() {
      if (!this.isLoggedIn()) { window.location.href = '/index.html'; return null; }
      return this.getUser();
    },
    requireModule(mod) {
      const u = this.requireAuth();
      if (u && !this.hasModule(mod)) {
        toast.error('Você não tem acesso a este módulo.');
        setTimeout(() => window.location.href = '/index.html', 2200);
        return null;
      }
      return u;
    },
  };

  // ── DATA (mock) ───────────────────────────────────────────────────────────
  //
  // Camada de dados isolada — trocar _mock por querySheet() quando
  // o cliente confirmar uso de Google Workspace.
  //
  const _mock = {
    modules: [
      { id: 'academia', label: 'Academia Corporativa', desc: 'Trilhas de treinamento, vídeos e certificados', icon: '🎓', color: '#C9A93E', bg: '#FAF3E0', path: '/academia/' },
      { id: 'rh',       label: 'RH & Documentos',     desc: 'Colaboradores, admissões e contratos digitais', icon: '📋', color: '#0B4A44', bg: '#EBF5F4', path: '/rh/'       },
      { id: 'compras',  label: 'Compras',              desc: 'Requisições, aprovações e fornecedores',        icon: '🛒', color: '#C9A93E', bg: '#FAF3E0', path: '/compras/'  },
      { id: 'dashboard',label: 'Dashboard Executivo',  desc: 'KPIs, métricas e indicadores operacionais',    icon: '📊', color: '#0B4A44', bg: '#EBF5F4', path: '/dashboard/'},
    ],
    stats: {
      treinamentos: { value: 48, label: 'Treinamentos concluídos', icon: '🎓', bg: '#FAF3E0' },
      colaboradores: { value: 124, label: 'Colaboradores ativos',  icon: '👥', bg: '#EBF5F4' },
      contratos:    { value: 31, label: 'Contratos vigentes',      icon: '📄', bg: '#FAF3E0' },
      compras:      { value: 12, label: 'Compras no mês',          icon: '🛒', bg: '#EBF5F4' },
    },
    cursos: [
      { id: 1, titulo: 'Integração e Onboarding',       setor: 'Todos',            duracao: '2h',  concluidos: 98, total: 124, status: 'ativo' },
      { id: 2, titulo: 'Segurança no Trabalho (NR-35)', setor: 'Operações',        duracao: '4h',  concluidos: 42, total: 60,  status: 'ativo' },
      { id: 3, titulo: 'Comunicação Corporativa',       setor: 'Administrativo',   duracao: '1h30',concluidos: 28, total: 35,  status: 'ativo' },
      { id: 4, titulo: 'Excel Avançado para Gestores',  setor: 'Administrativo',   duracao: '3h',  concluidos: 10, total: 22,  status: 'pendente' },
    ],
    colaboradores: [
      { id: 1, nome: 'Ana Silva',     setor: 'RH',           cargo: 'Analista RH',       situacao: 'ativo',   admissao: '2022-03-15' },
      { id: 2, nome: 'Bruno Matos',   setor: 'Operações',    cargo: 'Técnico de Campo',  situacao: 'ativo',   admissao: '2021-08-01' },
      { id: 3, nome: 'Carla Rocha',   setor: 'Compras',      cargo: 'Compradora Sênior', situacao: 'ativo',   admissao: '2020-01-20' },
      { id: 4, nome: 'Diego Lima',    setor: 'Administrativo',cargo: 'Assistente Adm.',  situacao: 'ferias',  admissao: '2023-05-10' },
      { id: 5, nome: 'Eva Pereira',   setor: 'Operações',    cargo: 'Supervisora',       situacao: 'ativo',   admissao: '2019-11-30' },
    ],
    requisicoes: [
      { id: 'REQ-001', item: 'Papel A4 (Resma 500fls)', solicitante: 'Ana Silva',   setor: 'RH',        valor: 280.00,  status: 'aprovado',  data: '2025-05-20' },
      { id: 'REQ-002', item: 'EPI — Capacetes (10 un)', solicitante: 'Bruno Matos', setor: 'Operações', valor: 1500.00, status: 'pendente',   data: '2025-05-22' },
      { id: 'REQ-003', item: 'Toner Impressora',        solicitante: 'Diego Lima',  setor: 'Adm.',      valor: 340.00,  status: 'pendente',   data: '2025-05-23' },
      { id: 'REQ-004', item: 'Notebook Dell i5',        solicitante: 'Eva Pereira', setor: 'Operações', valor: 4200.00, status: 'reprovado',  data: '2025-05-18' },
    ],
  };

  const data = {
    getModules()      { return _mock.modules; },
    getStats()        { return _mock.stats; },
    getCursos()       { return _mock.cursos; },
    getColaboradores(){ return _mock.colaboradores; },
    getRequisicoes()  { return _mock.requisicoes; },
  };

  // ── TOAST ─────────────────────────────────────────────────────────────────

  let _toastEl;

  function _ensureToasts() {
    if (!_toastEl) {
      _toastEl = document.createElement('div');
      _toastEl.id = 'tc-toasts';
      document.body.appendChild(_toastEl);
    }
  }

  const _icons = { info: 'ℹ', success: '✓', warn: '⚠', error: '✕' };

  const toast = {
    show(msg, type = 'info', ms = 4000) {
      _ensureToasts();
      const el = document.createElement('div');
      el.className = `tc-toast ${type}`;
      el.innerHTML = `<span>${_icons[type]}</span><span>${msg}</span>`;
      _toastEl.appendChild(el);
      setTimeout(() => el.remove(), ms);
    },
    info:    m => toast.show(m, 'info'),
    success: m => toast.show(m, 'success'),
    warn:    m => toast.show(m, 'warn'),
    error:   m => toast.show(m, 'error'),
  };

  // ── UTILS ─────────────────────────────────────────────────────────────────

  const utils = {
    money: v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    date:  d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'),
    initials: name => name.split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase(),
    percent: (a, b) => b > 0 ? Math.round((a / b) * 100) : 0,
  };

  // ── INIT ──────────────────────────────────────────────────────────────────

  function initPlatform(pageName) {
    ake.run(pageName, { label: `init.${pageName}`, fn: n => n, ic: 1.0 });
    console.log(`%c[TC v${VERSION}] ${pageName} — AKE/UFT-1.0 online`, 'color:#3B82F6;font-weight:bold');

    // Popula AKE bar se existir na página
    const bar = document.getElementById('ake-info');
    if (bar) bar.textContent = `${BUILD_ID} · IC=${ake.lastIC().toFixed(2)} · ${pageName.toUpperCase()}`;
    const ts  = document.getElementById('ake-ts');
    if (ts)  ts.textContent = new Date().toLocaleString('pt-BR');
  }

  // Injeta topbar padrão em sub-páginas
  function renderTopbar(containerId = 'topbar-container') {
    const u   = auth.getUser();
    const el  = document.getElementById(containerId);
    if (!el || !u) return;
    el.innerHTML = `
      <nav class="topbar">
        <div class="topbar-brand">
          <div class="topbar-logo">LA</div>
          <div>
            <div class="topbar-name">Luís Albert</div>
            <div class="topbar-sub">Advocacia · Portal Corporativo</div>
          </div>
        </div>
        <div class="topbar-right">
          <div class="user-chip">
            <div class="user-avatar">${utils.initials(u.name)}</div>
            <div class="user-info">
              <strong>${u.name}</strong>
              <small>${u.sector}</small>
            </div>
          </div>
          <button class="btn-topbar" onclick="TC.auth.logout()">Sair</button>
        </div>
      </nav>`;
  }

  return { VERSION, BUILD_ID, ake, auth, data, toast, utils, initPlatform, renderTopbar };

})();
