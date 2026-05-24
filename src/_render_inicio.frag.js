/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PAINEL: INÃCIO
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function renderInicio(){
  const u = S.user;
  let html = `<div class="page-header"><h1>OlÃ¡, ${primeiroNome(u.nome)}! ðŸ‘‹</h1>
    <p>${u.role==='user'?'Bem-vindo de volta ao seu portal de treinamentos.':'VisÃ£o geral da plataforma.'}</p></div>
    <div class="page-body">`;

  if(u.role !== 'user'){
    const [usuarios, treinamentos, logs, conclusoes] = await Promise.all([
      dbRead('usuarios'), dbRead('treinamentos'), dbRead('logs'), dbRead('conclusoes')
    ]);
    const nu = usuarios ? Object.values(usuarios).filter(x=>x.ativo).length : 0;
    const nt = treinamentos ? Object.values(treinamentos).filter(x=>x.ativo).length : 0;
    const nl = logs ? Object.keys(logs).length : 0;
    const na = usuarios ? Object.values(usuarios).filter(x=>x.role==='admin'||x.role==='master').length : 0;

    // Dados para grÃ¡ficos
    const treinList   = treinamentos ? Object.entries(treinamentos) : [];
    const concFlat    = conclusoes ? Object.values(conclusoes).flatMap(uid=>Object.keys(uid)) : [];
    const concPorTrein = treinList.map(([tid,t])=>({
      label: t.titulo.length>22?t.titulo.slice(0,20)+'â€¦':t.titulo,
      count: concFlat.filter(x=>x===tid).length
    }));

    const setores = {};
    if(usuarios) Object.values(usuarios).forEach(u=>{ if(u.setor&&u.ativo){ setores[u.setor]=(setores[u.setor]||0)+1; } });

    // ConclusÃµes por dia (Ãºltimos 7 dias)
    const dias7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().slice(0,10); });
    const concLogs = logs ? Object.values(logs).filter(l=>l.acao==='CONCLUIR_TREINAMENTO') : [];
    const concPorDia = dias7.map(d=>concLogs.filter(l=>l.ts&&l.ts.startsWith(d)).length);

    html += `<div class="grid-4 mb-3">
      <div class="stat-card"><div class="stat-icon" style="background:var(--teal-light)">ðŸ‘¥</div>
        <div><div class="stat-val">${nu}</div><div class="stat-lbl">Participantes ativos</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--gold-light)">ðŸŽ“</div>
        <div><div class="stat-val">${nt}</div><div class="stat-lbl">Treinamentos ativos</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--success-bg)">ðŸ‘¤</div>
        <div><div class="stat-val">${na}</div><div class="stat-lbl">Administradores</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--teal-light)">ðŸ“‹</div>
        <div><div class="stat-val">${nl}</div><div class="stat-lbl">Registros de log</div></div></div>
    </div>
    <div class="grid-3 mb-3">
      <div class="card card-pad" style="grid-column:span 2">
        <p class="section-label" style="margin-bottom:12px">ConclusÃµes por treinamento</p>
        <canvas id="chart-bar" height="120"></canvas>
      </div>
      <div class="card card-pad">
        <p class="section-label" style="margin-bottom:12px">UsuÃ¡rios por setor</p>
        <canvas id="chart-doughnut" height="120"></canvas>
      </div>
    </div>
    <div class="card card-pad mb-3">
      <p class="section-label" style="margin-bottom:12px">ConclusÃµes nos Ãºltimos 7 dias</p>
      <canvas id="chart-line" height="60"></canvas>
    </div>`;

    // Ãšltimos logs
    if(logs){
      const ultimos = Object.values(logs).sort((a,b)=>b.ts.localeCompare(a.ts)).slice(0,5);
      html += `<p class="section-label">Atividade recente</p>
        <div class="card"><div class="tbl-wrap"><table>
          <thead><tr><th>Quando</th><th>UsuÃ¡rio</th><th>AÃ§Ã£o</th><th>Detalhes</th></tr></thead><tbody>
          ${ultimos.map(l=>`<tr>
            <td class="text-sm text-muted">${fmtTs(l.ts)}</td>
            <td>${esc(l.ator_nome)} <span class="badge ${ROLE_BADGE[l.ator_role]||'badge-gray'} text-sm">${ROLE_LABEL[l.ator_role]||l.ator_role}</span></td>
            <td>${fmtAcao(l.acao)}</td>
            <td class="text-sm text-muted">${esc(l.detalhes||'â€“')}</td>
          </tr>`).join('')}
          </tbody></table></div></div>`;
    } else {
      html += `<div class="empty-state"><div class="empty-icon">ðŸ“‹</div><h3>Nenhum registro ainda</h3><p>As atividades aparecerÃ£o aqui.</p></div>`;
    }

    html += `</div>`;
    document.getElementById('content').innerHTML = html;

    // Renderiza grÃ¡ficos apÃ³s o DOM estar pronto
    requestAnimationFrame(()=>{
      const tealColor = '#0B4A44';
      const goldColor = '#C9A93E';
      const bgTeal    = '#EBF5F4';

      const elBar = document.getElementById('chart-bar');
      if(elBar && concPorTrein.length){
        new Chart(elBar,{ type:'bar', data:{
          labels: concPorTrein.map(x=>x.label),
          datasets:[{ label:'ConclusÃµes', data:concPorTrein.map(x=>x.count), backgroundColor:tealColor, borderRadius:4 }]
        }, options:{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}, responsive:true, maintainAspectRatio:true }});
      }

      const elDonut = document.getElementById('chart-doughnut');
      const setorLabels = Object.keys(setores);
      if(elDonut && setorLabels.length){
        const palette = [tealColor,'#145E58','#1F7A72',goldColor,'#B8951E','#D4B84E','#8A9BAB'];
        new Chart(elDonut,{ type:'doughnut', data:{
          labels: setorLabels,
          datasets:[{ data:setorLabels.map(s=>setores[s]), backgroundColor:palette, borderWidth:2, borderColor:'#fff' }]
        }, options:{ plugins:{legend:{position:'bottom',labels:{font:{size:11}}}}, responsive:true, maintainAspectRatio:true }});
      } else if(elDonut){
        elDonut.parentElement.innerHTML += `<p class="text-sm text-muted" style="text-align:center;margin-top:8px">Nenhum usuÃ¡rio com setor cadastrado.</p>`;
      }

      const elLine = document.getElementById('chart-line');
      if(elLine){
        new Chart(elLine,{ type:'line', data:{
          labels: dias7.map(d=>new Date(d+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})),
          datasets:[{ label:'ConclusÃµes', data:concPorDia, borderColor:goldColor, backgroundColor:bgTeal, fill:true, tension:.35, pointBackgroundColor:goldColor, pointRadius:4 }]
        }, options:{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}, responsive:true, maintainAspectRatio:true }});
      }
    });
    return;
  } else {
    // User dashboard â€” progresso
    const [treins, concs, prog] = await Promise.all([
      dbRead('treinamentos'),
      dbRead(`conclusoes/${u.uid}`),
      dbRead(`progresso/${u.uid}`)
    ]);
    const todos   = treins  ? Object.entries(treins).filter(([,t])=>t.ativo).sort((a,b)=>(a[1].ordem||0)-(b[1].ordem||0)) : [];
    const concMap = concs || {};
    const progAll = prog  || {};
    const done    = todos.filter(([id])=>concMap[id]).length;
    const pct     = todos.length ? Math.round((done/todos.length)*100) : 0;

    html += `<div class="progress-big">
      <div class="flex justify-between items-center mb-2">
        <div><h2 style="font-size:20px">Seu progresso</h2><p class="text-sm text-muted">${done} de ${todos.length} treinamentos concluÃ­dos</p></div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:700;color:var(--teal)">${pct}%</div>
      </div>
      <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
    </div>
    <p class="section-label">Treinamentos disponÃ­veis</p>
    <div class="grid-3">
      ${todos.map(([tid,t])=>{
        const feito  = !!concMap[tid];
        const nvids  = t.videos ? Object.keys(t.videos).length : 0;
        const assist = progAll[tid] ? Object.keys(progAll[tid]).length : 0;
        const vpct   = feito ? 100 : (nvids ? Math.round((assist/nvids)*100) : 0);
        const label  = feito ? `<span class="badge badge-green">âœ“ ConcluÃ­do</span>`
                      : vpct ? `<span class="badge badge-teal">${vpct}%</span>`
                             : `<span class="badge badge-gray">NÃ£o iniciado</span>`;
        return `<div class="training-card" onclick="navTo('treinos');setTimeout(()=>verTreinamento('${tid}'),200)">
          <div class="tc-header"><h3>${esc(t.titulo)}</h3><p>${esc(t.descricao||'')}</p></div>
          <div class="tc-body">
            <div class="tc-meta"><span>ðŸ“¹ ${nvids} vÃ­deo${nvids!==1?'s':''}</span>${label}</div>
            <div class="tc-progress"><div class="tc-fill" style="width:${vpct}%"></div></div>
          </div>
        </div>`;
      }).join('')||`<div class="empty-state"><div class="empty-icon">ðŸŽ“</div><h3>Nenhum treinamento disponÃ­vel</h3><p>Fique atento a novos conteÃºdos.</p></div>`}
    </div>`;
  }

  html += `</div>`;
  document.getElementById('content').innerHTML = html;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PAINEL: TREINAMENTOS (user view)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function renderTreinos(){
  if(S.subView){ await renderTreinamentoDetalhe(S.subView); return; }
  const uid = S.user.uid;
  const [treins, concs, prog] = await Promise.all([
    dbRead('treinamentos'),
    dbRead(`conclusoes/${uid}`),
    dbRead(`progresso/${uid}`)
  ]);
  const todos   = treins ? Object.entries(treins).filter(([,t])=>t.ativo).sort((a,b)=>(a[1].ordem||0)-(b[1].ordem||0)) : [];
  const concMap = concs || {};
  const progAll = prog  || {};

  let html = `<div class="page-header"><h1>ðŸŽ“ Treinamentos</h1><p>Acesse os conteÃºdos disponÃ­veis para vocÃª.</p></div>
    <div class="page-body">`;

  if(!todos.length){
    html += `<div class="empty-state"><div class="empty-icon">ðŸŽ“</div><h3>Nenhum treinamento disponÃ­vel</h3><p>O administrador adicionarÃ¡ conteÃºdos em breve.</p></div>`;
  } else {
    html += `<div class="grid-2">` + todos.map(([tid,t])=>{
      const feito  = !!concMap[tid];
      const nvids  = t.videos ? Object.keys(t.videos).length : 0;
      const assist = progAll[tid] ? Object.keys(progAll[tid]).length : 0;
      const pct    = feito ? 100 : (nvids ? Math.round((assist/nvids)*100) : 0);
      const label  = feito ? `<span class="badge badge-green">âœ“ ConcluÃ­do</span>`
                    : pct  ? `<span class="badge badge-teal">${pct}% assistido</span>`
                           : `<span class="badge badge-gray">NÃ£o iniciado</span>`;
      return `<div class="training-card" onclick="verTreinamento('${tid}')">
        <div class="tc-header"><h3>${esc(t.titulo)}</h3><p>${esc(t.descricao||'')}</p></div>
        <div class="tc-body">
          <div class="tc-meta"><span>ðŸ“¹ ${nvids} vÃ­deo${nvids!==1?'s':''}</span>${label}</div>
          <div class="tc-progress"><div class="tc-fill" style="width:${pct}%"></div></div>
        </div>
      </div>`;
    }).join('') + `</div>`;
  }

  html += `</div>`;
  document.getElementById('content').innerHTML = html;
}

async function verTreinamento(tid){
  S.subView = tid;
  await renderTreinamentoDetalhe(tid);
}


// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: renderInicio + renderTreinos
