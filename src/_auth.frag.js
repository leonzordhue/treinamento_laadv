
/* â”€â”€ CRYPTO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function sha256(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

/* â”€â”€ SESSION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function saveSession(u){ sessionStorage.setItem('_laadv', JSON.stringify(u)); }
function clearSession(){ sessionStorage.removeItem('_laadv'); }
function getSession(){ try{ return JSON.parse(sessionStorage.getItem('_laadv')); }catch{ return null; } }

/* â”€â”€ AUDIT LOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function audit(acao, detalhes=''){
  if(!S.user) return;
  await dbPush('logs', {
    ts: new Date().toISOString(),
    ator_id:   S.user.uid,
    ator_nome: S.user.nome,
    ator_role: S.user.role,
    acao,
    detalhes
  });
  document.getElementById('ake-ts').textContent = new Date().toLocaleString('pt-BR');
}

/* â”€â”€ TELAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

/* â”€â”€ TOAST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function toast(msg, tipo='info'){
  const wrap = document.getElementById('toasts');
  const el = document.createElement('div');
  const cls = {ok:'toast-ok',err:'toast-err',warn:'toast-warn',info:'toast-info'};
  const ico = {ok:'âœ“',err:'âœ•',warn:'âš ',info:'â„¹'};
  el.className = `toast ${cls[tipo]||'toast-info'}`;
  el.innerHTML = `<span>${ico[tipo]||'â„¹'}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(()=>el.remove(), 4500);
}

/* â”€â”€ MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function abrirModal(titulo, corpo, rodape=''){
  document.getElementById('modal-title').textContent = titulo;
  document.getElementById('modal-body').innerHTML = corpo;
  document.getElementById('modal-foot').innerHTML = rodape;
  document.getElementById('modal-overlay').classList.add('open');
}
function fecharModal(){ document.getElementById('modal-overlay').classList.remove('open'); }

function confirmar(msg, onSim){
  abrirModal('Confirmar aÃ§Ã£o',
    `<p style="font-size:15px;line-height:1.6">${msg}</p>`,
    `<button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
     <button class="btn btn-danger" onclick="fecharModal();(${onSim.toString()})()">Confirmar</button>`
  );
}

/* â”€â”€ MOBILE SIDEBAR â”€â”€ */
function fecharSidebarMobile(){
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sb-backdrop')?.classList.remove('open');
}

/* â”€â”€ SPINNER / LOADING â”€â”€ */
function setBtnLoading(btn, loading){
  if(!btn) return;
  if(loading){
    btn.disabled = true;
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = '<span class="btn-spinner"></span> Aguardeâ€¦';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.orig || '';
  }
}

/* â”€â”€ UX HELPERS â”€â”€ */
function filtrarUsuarios(q){
  const s = q.toLowerCase();
  document.querySelectorAll('#tabela-usuarios tbody tr').forEach(tr=>{
    tr.style.display = tr.textContent.toLowerCase().includes(s) ? '' : 'none';
  });
}

function filtrarLogs(){
  const q = (document.getElementById('log-search')?.value||'').toLowerCase();
  const a = document.getElementById('log-acao')?.value||'';
  document.querySelectorAll('#tabela-logs tbody tr').forEach(tr=>{
    const matchQ = !q || tr.textContent.toLowerCase().includes(q);
    const matchA = !a || tr.dataset.acao === a;
    tr.style.display = (matchQ && matchA) ? '' : 'none';
  });
}

function confirmarDesativar(uid, nome){
  confirmar(`Desativar o usuÃ¡rio <strong>${nome}</strong>? Ele nÃ£o conseguirÃ¡ mais acessar o portal.`,
    async function(){ await toggleAtivo(uid, false); }
  );
}

function contarChars(el, countId){
  const el2 = document.getElementById(countId);
  if(el2) el2.textContent = `${el.value.length}/300 caracteres`;
}

/* â”€â”€ SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let sbCollapsed = false;

function toggleSidebar(){
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sb-backdrop');
  if(window.innerWidth <= 768){
    const opening = !sb.classList.contains('mobile-open');
    sb.classList.toggle('mobile-open', opening);
    bd.classList.toggle('open', opening);
  } else {
    sbCollapsed = !sbCollapsed;
    sb.classList.toggle('collapsed', sbCollapsed);
  }
}

const NAV_ITEMS = [
  { id:'inicio',     icon:'ðŸ ', label:'InÃ­cio',            roles:['master','admin','user'] },
  { id:'treinos',    icon:'ðŸŽ“', label:'Treinamentos',       roles:['master','admin','user'] },
  { id:'perfil',     icon:'ðŸ‘¤', label:'Meu Perfil',         roles:['master','admin','user'] },
  { divider:true,   label:'GestÃ£o',                         roles:['master','admin'] },
  { id:'usuarios',   icon:'ðŸ‘¥', label:'UsuÃ¡rios',           roles:['master','admin'] },
  { id:'conteudo',   icon:'ðŸ“š', label:'ConteÃºdo',           roles:['master','admin'] },
  { id:'relatorios', icon:'ðŸ“‹', label:'RelatÃ³rios',         roles:['master','admin'] },
  { divider:true,   label:'Sistema',                        roles:['master'] },
  { id:'config',     icon:'âš™ï¸', label:'ConfiguraÃ§Ãµes',      roles:['master'] },
];

function buildNav(){
  const role = S.user.role;
  let html = '';
  NAV_ITEMS.forEach(it=>{
    if(!it.roles.includes(role)) return;
    if(it.divider){
      html += `<div class="nav-divider"><span>${it.label}</span></div>`;
    } else {
      html += `<div class="nav-item${S.panel===it.id?' active':''}" onclick="navTo('${it.id}')">
        <span class="nav-icon">${it.icon}</span>
        <span class="nav-label">${it.label}</span>
      </div>`;
    }
  });
  document.getElementById('nav-main').innerHTML = html;
}

async function navTo(panel){
  S.panel = panel; S.subView = null;
  buildNav();
  fecharSidebarMobile();
  await renderPanel(panel);
}

/* â”€â”€ ROLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ROLE_LABEL = { master:'Super Administrador', admin:'Administrador', user:'Participante' };
const ROLE_BADGE = { master:'badge-gold', admin:'badge-teal', user:'badge-gray' };

function podeGerenciarUsuario(alvo_role){
  if(S.user.role === 'master') return true;
  if(S.user.role === 'admin' && alvo_role === 'user') return true;
  return false;
}
function podeResetarSenha(alvo_role){
  if(S.user.role === 'master') return true;
  if(S.user.role === 'admin' && alvo_role === 'user') return true;
  return false;
}

/* â”€â”€ AUTH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function doLogin(btn){

// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: helpers UI + sidebar + roles
