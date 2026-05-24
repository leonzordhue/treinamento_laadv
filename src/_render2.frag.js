/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PAINEL: RELATÃ“RIOS / LOGS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function renderRelatorios(){
  const data = await dbRead('logs');
  const todos = data ? Object.values(data).sort((a,b)=>b.ts.localeCompare(a.ts)) : [];

  // Filtro: admins veem sÃ³ suas aÃ§Ãµes e as dos users; master vÃª tudo
  const lista = S.user.role === 'master' ? todos :
    todos.filter(l => l.ator_id === S.user.uid || l.ator_role === 'user');

  const acoes = [...new Set(lista.map(l=>l.acao))].sort();
  const rows = lista.slice(0,200).map(l=>`<tr data-acao="${l.acao}">
    <td class="text-sm">${fmtTs(l.ts)}</td>
    <td>${esc(l.ator_nome)}</td>
    <td><span class="badge ${ROLE_BADGE[l.ator_role]||'badge-gray'} text-sm">${ROLE_LABEL[l.ator_role]||l.ator_role}</span></td>
    <td><span class="badge badge-teal text-sm">${fmtAcao(l.acao)}</span></td>
    <td class="text-sm text-muted">${esc(l.detalhes||'â€“')}</td>
  </tr>`).join('');

  document.getElementById('content').innerHTML = `
    <div class="page-header"><h1>ðŸ“‹ RelatÃ³rios e Logs</h1><p>HistÃ³rico auditÃ¡vel de todas as aÃ§Ãµes realizadas no portal.</p></div>
    <div class="page-body">
      <div class="filter-bar">
        <input type="text" id="log-search" placeholder="Buscar por usuÃ¡rioâ€¦" oninput="filtrarLogs()">
        <select id="log-acao" onchange="filtrarLogs()">
          <option value="">Todas as aÃ§Ãµes</option>
          ${acoes.map(a=>`<option value="${a}">${fmtAcao(a)}</option>`).join('')}
        </select>
      </div>
      <div class="flex justify-between items-center mb-2">
        <p class="section-label" style="margin:0">${lista.length} registros</p>
        <div class="flex gap-sm">
          <button class="btn btn-ghost btn-sm" onclick="exportarLogs()">â¬‡ Logs CSV</button>
          <button class="btn btn-ghost btn-sm" onclick="exportarUsuarios()">â¬‡ UsuÃ¡rios CSV</button>
          <button class="btn btn-ghost btn-sm" onclick="exportarProgresso()">â¬‡ Progresso CSV</button>
        </div>
      </div>
      ${!lista.length ? `<div class="empty-state"><div class="empty-icon">ðŸ“‹</div><h3>Nenhum registro encontrado</h3></div>` : `
      <div class="card"><div class="tbl-wrap"><table id="tabela-logs">
        <thead><tr><th>Data/Hora</th><th>UsuÃ¡rio</th><th>Perfil</th><th>AÃ§Ã£o</th><th>Detalhes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div></div>`}
    </div>`;

  window._logsData = lista;
}

function csvDownload(rows, filename){
  const csv = rows.map(r=>r.map(c=>`"${String(c==null?'':c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['ï»¿'+csv],{type:'text/csv;charset=utf-8'}));
  a.download = filename;
  a.click();
  toast('Exportado: '+filename,'ok');
}

function exportarLogs(){
  if(!window._logsData?.length){ toast('Nenhum dado para exportar.','warn'); return; }
  const header = [['Data/Hora','UsuÃ¡rio','Perfil','AÃ§Ã£o','Detalhes']];
  const rows = window._logsData.map(l=>[fmtTs(l.ts),l.ator_nome,ROLE_LABEL[l.ator_role]||l.ator_role,l.acao,l.detalhes||'']);
  csvDownload([...header,...rows], `laadv-logs-${new Date().toISOString().slice(0,10)}.csv`);
}

window.exportarUsuarios = async function(){
  const data = await dbRead('usuarios');
  if(!data){ toast('Nenhum dado para exportar.','warn'); return; }
  const header = [['Nome','Login','Setor','Cargo','Perfil','Status','Criado em']];
  const rows = Object.values(data).map(u=>[
    u.nome, u.usuario, u.setor||'', u.cargo||'',
    ROLE_LABEL[u.role]||u.role,
    u.ativo?'Ativo':'Inativo',
    u.criado_em?fmtTs(u.criado_em):''
  ]);
  csvDownload([...header,...rows], `laadv-usuarios-${new Date().toISOString().slice(0,10)}.csv`);
};

window.exportarProgresso = async function(){
  const [treins, users, concs, prog] = await Promise.all([
    dbRead('treinamentos'), dbRead('usuarios'), dbRead('conclusoes'), dbRead('progresso')
  ]);
  if(!treins||!users){ toast('Nenhum dado para exportar.','warn'); return; }
  const header = [['UsuÃ¡rio','Treinamento','Total VÃ­deos','VÃ­deos Assistidos','% ConclusÃ£o','Data ConclusÃ£o']];
  const rows = [];
  Object.entries(users).forEach(([uid,u])=>{
    Object.entries(treins).forEach(([tid,t])=>{
      const nvids   = t.videos ? Object.keys(t.videos).length : 0;
      const assist  = prog?.[uid]?.[tid] ? Object.keys(prog[uid][tid]).length : 0;
      const pct     = concs?.[uid]?.[tid] ? 100 : (nvids ? Math.round((assist/nvids)*100) : 0);
      const dtConc  = concs?.[uid]?.[tid] ? fmtTs(concs[uid][tid]) : '';
      if(assist>0 || pct>0){
        rows.push([u.nome, t.titulo, nvids, assist, pct+'%', dtConc]);
      }
    });
  });
  if(!rows.length){ toast('Nenhum progresso registrado ainda.','warn'); return; }
  csvDownload([...header,...rows], `laadv-progresso-${new Date().toISOString().slice(0,10)}.csv`);
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PAINEL: CONFIGURAÃ‡Ã•ES (master only)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function renderConfig(){
  if(S.user.role !== 'master'){ document.getElementById('content').innerHTML=`<div class="page-body"><div class="alert alert-err">Acesso restrito.</div></div>`; return; }
  const cfg = await dbRead('config');
  document.getElementById('content').innerHTML = `
    <div class="page-header"><h1>âš™ï¸ ConfiguraÃ§Ãµes do Sistema</h1><p>Gerenciamento avanÃ§ado da plataforma.</p></div>
    <div class="page-body">
      <div class="grid-2">
        <div class="card card-pad">
          <h3 class="text-teal" style="margin-bottom:16px">InformaÃ§Ãµes do Portal</h3>
          <p class="text-sm"><strong>OrganizaÃ§Ã£o:</strong> ${esc(cfg?.org_name||'â€“')}</p>
          <p class="text-sm mt-1"><strong>Criado em:</strong> ${cfg?.criado_em?fmtData(cfg.criado_em):'â€“'}</p>
          <p class="text-sm mt-1"><strong>VersÃ£o:</strong> LAADV Portal v2.0 Â· AKE/UFT-1.0</p>
          <div class="divider"></div>
          <div class="field" style="margin-bottom:10px"><label>Nome da organizaÃ§Ã£o</label>
            <input type="text" id="cfg-org" value="${esc(cfg?.org_name||'')}"></div>
          <button class="btn btn-primary btn-sm" onclick="salvarConfig(this)">Salvar</button>
        </div>
        <div class="card card-pad" style="border-top:3px solid var(--danger)">
          <h3 style="color:var(--danger);margin-bottom:8px">Zona de Perigo</h3>
          <p class="text-sm text-muted mb-2">AÃ§Ãµes irreversÃ­veis. Tenha certeza antes de prosseguir.</p>
          <button class="btn btn-danger btn-sm mt-2" onclick="limparLogs()">ðŸ—‘ Limpar todos os logs</button>
        </div>
      </div>
    </div>`;
}

async function salvarConfig(btn){
  const org = document.getElementById('cfg-org').value.trim();
  if(!org){ toast('Nome nÃ£o pode ser vazio.','err'); return; }
  setBtnLoading(btn, true);
  try {
    await dbUpdate('config', { org_name: org });
    await audit('EDITAR_CONFIG', `Nome da organizaÃ§Ã£o: ${org}`);
    toast('ConfiguraÃ§Ãµes salvas!','ok');
  } catch(e){
    toast(`Erro: ${e.message}`,'err');
  } finally {
    setBtnLoading(btn, false);
  }
}

function limparLogs(){
  confirmar('Isso apagarÃ¡ <strong>todos os logs</strong> permanentemente. Deseja continuar?',
    async function(){
      await dbRemove('logs');
      await audit('LIMPAR_LOGS', 'Todos os logs foram apagados pelo master');
      toast('Logs removidos.','ok');
      await renderConfig();
    }
  );
}

/* â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function iniciais(nome){ return (nome||'?').split(' ').slice(0,2).map(p=>p[0]).join('').toUpperCase(); }
function primeiroNome(nome){ return (nome||'').split(' ')[0]; }
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtTs(ts){ try{ return new Date(ts).toLocaleString('pt-BR'); }catch{ return ts; } }
function fmtData(ts){ try{ return new Date(ts).toLocaleDateString('pt-BR'); }catch{ return ts; } }
const ACAO_LABEL = {
  LOGIN:'Entrou no portal', LOGOUT:'Saiu do portal',
  CRIAR_USUARIO:'Criou usuÃ¡rio', EDITAR_USUARIO:'Editou usuÃ¡rio', DELETAR_USUARIO:'Excluiu usuÃ¡rio',
  ATIVAR_USUARIO:'Ativou usuÃ¡rio', DESATIVAR_USUARIO:'Desativou usuÃ¡rio',
  ALTERAR_SENHA:'Alterou senha', RESETAR_SENHA:'Redefiniu senha', EDITAR_PERFIL:'Editou perfil',
  CRIAR_TREINAMENTO:'Criou treinamento', EDITAR_TREINAMENTO:'Editou treinamento',
  DELETAR_TREINAMENTO:'Excluiu treinamento', ATIVAR_TREINAMENTO:'Ativou treinamento',
  DESATIVAR_TREINAMENTO:'Desativou treinamento',
  ADICIONAR_VIDEO:'Adicionou vÃ­deo', REMOVER_VIDEO:'Removeu vÃ­deo',
  MARCAR_VIDEO_ASSISTIDO:'Marcou vÃ­deo como assistido',
  CONCLUIR_TREINAMENTO:'Concluiu treinamento',
  EDITAR_CONFIG:'Editou configuraÃ§Ãµes', LIMPAR_LOGS:'Limpou logs', SETUP_INICIAL:'ConfiguraÃ§Ã£o inicial',
};
function fmtAcao(a){ return ACAO_LABEL[a]||a; }
function extrairYtId(url){
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m ? m[1] : null;
}
function ytEmbed(url, titulo){
  const id = extrairYtId(url);
  if(id) return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${id}" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`;
  return `<div class="video-embed" style="display:flex;align-items:center;justify-content:center;background:#111;border-radius:10px">
    <a href="${url}" target="_blank" class="btn btn-gold">â–¶ Abrir VÃ­deo</a></div>`;
}

/* â”€â”€â”€ INIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function init(){
  // Verifica config Firebase
  if(FIREBASE_CONFIG.apiKey === 'COLE_AQUI'){
    document.getElementById('sc-loading').innerHTML = `
      <div style="background:#fff;border-radius:12px;border-top:4px solid var(--gold);padding:36px;max-width:480px;text-align:center">
        <div style="font-size:40px;margin-bottom:12px">âš™ï¸</div>
        <h2 style="color:var(--teal);font-family:'Cormorant Garamond',serif;font-size:24px;margin-bottom:10px">Configure o Firebase</h2>
        <p style="font-size:14px;color:#5A6A7A;line-height:1.7">
          Abra este arquivo em um editor de texto e preencha o objeto <code style="background:#f0f4f8;padding:2px 6px;border-radius:4px">FIREBASE_CONFIG</code> com as credenciais do seu projeto Firebase.<br><br>
          <strong>console.firebase.google.com</strong> â†’ Realtime Database â†’ Criar banco â†’ Copiar configuraÃ§Ã£o
        </p>
      </div>`;
    return;
  }

  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();
    document.getElementById('ake-ts').textContent = new Date().toLocaleString('pt-BR');

    // Verifica setup
    const setupDone = await dbRead('config/setup_done');
    if(!setupDone){ showScreen('sc-setup'); return; }

    // Verifica sessÃ£o ativa
    const sess = getSession();
    if(sess){
      // Revalida no Firebase
      const u = await dbRead(`usuarios/${sess.uid}`);
      if(u && u.ativo){
        S.user = { uid: sess.uid, ...u };
        if(u.primeiro_acesso){ showScreen('sc-primeiro'); return; }
        await iniciarApp();
        return;
      }
    }
    showScreen('sc-login');
  } catch(e){
    document.getElementById('sc-loading').innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:32px;max-width:400px;text-align:center">
        <div style="font-size:36px;margin-bottom:10px">âŒ</div>
        <h2 style="color:var(--danger);margin-bottom:8px">Erro de ConexÃ£o</h2>
        <p style="font-size:14px;color:#5A6A7A">${e.message}</p>
        <p style="font-size:13px;color:#5A6A7A;margin-top:10px">Verifique se o Firebase estÃ¡ configurado corretamente e se a Realtime Database estÃ¡ ativa.</p>
      </div>`;
    console.error(e);
  }
}

init();
</script>
</body>
</html>

// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: renderRelatorios + renderConfig + exportar + helpers + init
