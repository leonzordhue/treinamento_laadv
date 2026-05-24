async function renderTreinamentoDetalhe(tid){
  const uid = S.user.uid;
  const [t, concs, prog] = await Promise.all([
    dbRead(`treinamentos/${tid}`),
    dbRead(`conclusoes/${uid}`),
    dbRead(`progresso/${uid}/${tid}`)
  ]);
  if(!t){ toast('Treinamento nÃ£o encontrado.','err'); await navTo('treinos'); return; }
  const concMap   = concs || {};
  const feito     = !!concMap[tid];
  const progMap   = prog  || {};
  const videos    = t.videos ? Object.entries(t.videos) : [];
  const total     = videos.length;
  const assistidos = Object.keys(progMap).length;
  const pct       = total ? Math.round((assistidos/total)*100) : 0;
  const vidAtual  = videos.length ? videos[0] : null;
  const vidAtualId = vidAtual ? vidAtual[0] : null;

  window._treinsVideos   = Object.fromEntries(videos);
  window._vidProgresso   = progMap;
  window._treinAtualTid  = tid;
  window._treinAtualVid  = vidAtualId;

  const buildAssistidoBtn = (vid) => progMap[vid]
    ? `<span class="badge badge-green" style="padding:8px 14px">âœ“ Assistido</span>`
    : `<button class="btn btn-primary btn-sm" id="btn-assistido" onclick="marcarVideoAssistido('${tid}','${vid}')">âœ“ Marcar como assistido</button>`;

  let html = `<div class="page-header">
    <div class="flex items-center gap-md">
      <button class="btn btn-ghost btn-sm" onclick="S.subView=null;renderTreinos()" style="background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3);color:#fff">â† Voltar</button>
      <div><h1>${esc(t.titulo)}</h1><p>${esc(t.descricao||'')}</p></div>
    </div>
  </div>
  <div class="page-body" id="detalhe-body">
    <div class="flex gap-md" style="flex-wrap:wrap;align-items:flex-start">
      <div style="flex:1;min-width:280px">
        <div id="player-box">
          ${vidAtual ? ytEmbed(vidAtual[1].url, vidAtual[1].titulo) : '<p class="text-muted">Nenhum vÃ­deo neste treinamento.</p>'}
        </div>
        <div id="video-title" style="font-size:15px;font-weight:600;margin:10px 0 4px">${vidAtual?esc(vidAtual[1].titulo):''}</div>
        <div id="video-dur" class="text-sm text-muted">${vidAtual&&vidAtual[1].duracao?'â± '+esc(vidAtual[1].duracao):''}</div>
        <div id="assistido-action" style="margin-top:12px">
          ${vidAtualId ? buildAssistidoBtn(vidAtualId) : ''}
        </div>
      </div>
      <div style="width:290px;flex-shrink:0">
        ${total ? `
        <div style="margin-bottom:14px">
          <div class="flex justify-between items-center" style="margin-bottom:4px">
            <span class="section-label" style="margin:0">Progresso</span>
            <span class="text-sm text-muted">${assistidos}/${total} vÃ­deos</span>
          </div>
          <div class="prog-bar" style="height:8px"><div class="prog-fill" style="width:${feito?100:pct}%"></div></div>
          <p class="text-sm text-muted" style="margin-top:4px">${feito?100:pct}% concluÃ­do</p>
        </div>` : ''}
        <p class="section-label">VÃ­deos do treinamento</p>
        <div class="video-list">
          ${videos.map(([vid,v],i)=>`
            <div class="video-item${i===0?' active':''}${progMap[vid]?' done':''}" id="vi-${vid}" onclick="selecionarVideo('${tid}','${vid}',${i})">
              <div class="vi-num">${progMap[vid]?'âœ“':(i+1)}</div>
              <div class="vi-info">
                <div class="vi-title">${esc(v.titulo)}</div>
                ${v.duracao?`<div class="vi-dur">â± ${esc(v.duracao)}</div>`:''}
              </div>
            </div>`).join('')||'<p class="text-sm text-muted">Nenhum vÃ­deo cadastrado.</p>'}
        </div>
        ${feito
          ? `<div class="badge badge-green" style="width:100%;justify-content:center;padding:10px;margin-top:12px">âœ“ Treinamento concluÃ­do!</div>
             <button class="btn btn-gold btn-full mt-2" onclick="gerarCertificado('${uid}','${tid}')">ðŸ† Baixar Certificado</button>`
          : ''}
      </div>
    </div>
  </div>`;

  document.getElementById('content').innerHTML = html;
}

async function selecionarVideo(tid, vid, idx){
  const v = window._treinsVideos?.[vid];
  if(!v) return;
  document.getElementById('player-box').innerHTML    = ytEmbed(v.url, v.titulo);
  document.getElementById('video-title').textContent  = v.titulo;
  document.getElementById('video-dur').textContent    = v.duracao ? 'â± ' + v.duracao : '';
  document.querySelectorAll('.video-item').forEach(el=>el.classList.remove('active'));
  document.getElementById(`vi-${vid}`)?.classList.add('active');
  window._treinAtualVid = vid;
  const progMap = window._vidProgresso || {};
  const btnArea = document.getElementById('assistido-action');
  if(btnArea){
    btnArea.innerHTML = progMap[vid]
      ? `<span class="badge badge-green" style="padding:8px 14px">âœ“ Assistido</span>`
      : `<button class="btn btn-primary btn-sm" id="btn-assistido" onclick="marcarVideoAssistido('${tid}','${vid}')">âœ“ Marcar como assistido</button>`;
  }
}

window.marcarVideoAssistido = async function(tid, vid){
  const uid = S.user.uid;
  await dbSet(`progresso/${uid}/${tid}/${vid}`, new Date().toISOString());
  await audit('MARCAR_VIDEO_ASSISTIDO', `VÃ­deo ${vid} do treinamento ${tid}`);
  if(!window._vidProgresso) window._vidProgresso = {};
  window._vidProgresso[vid] = new Date().toISOString();

  // atualiza UI do botÃ£o sem re-renderizar tudo
  const btnArea = document.getElementById('assistido-action');
  if(btnArea) btnArea.innerHTML = `<span class="badge badge-green" style="padding:8px 14px">âœ“ Assistido</span>`;
  const viEl = document.getElementById(`vi-${vid}`);
  if(viEl){ viEl.classList.add('done'); viEl.querySelector('.vi-num').textContent='âœ“'; }

  // verifica conclusÃ£o automÃ¡tica
  const total = window._treinsVideos ? Object.keys(window._treinsVideos).length : 0;
  const assistidos = Object.keys(window._vidProgresso).length;
  if(total>0 && assistidos>=total){
    const jaFeito = await dbRead(`conclusoes/${uid}/${tid}`);
    if(!jaFeito) await marcarConcluido(tid);
  } else {
    toast('VÃ­deo marcado como assistido!','ok');
  }
};

async function marcarConcluido(tid){
  await dbSet(`conclusoes/${S.user.uid}/${tid}`, new Date().toISOString());
  await audit('CONCLUIR_TREINAMENTO', `Concluiu: ${tid}`);
  toast('ParabÃ©ns! Treinamento concluÃ­do! ðŸŽ‰','ok');
  await renderTreinamentoDetalhe(tid);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CERTIFICADO DE CONCLUSÃƒO (TASK-11)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
window.gerarCertificado = async function(uid, tid){
  const [t, u, concs] = await Promise.all([
    dbRead(`treinamentos/${tid}`),
    dbRead(`usuarios/${uid}`),
    dbRead(`conclusoes/${uid}`)
  ]);
  if(!t||!u){ toast('Dados nÃ£o encontrados.','err'); return; }
  const dataConclusao = concs?.[tid] ? new Date(concs[tid]).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}) : new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
  const hoje = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});

  const w = window.open('','_blank','width=900,height=650');
  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
  <title>Certificado â€” ${u.nome}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#fff;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:30px}
    .cert{width:800px;min-height:560px;border:8px solid #C9A93E;border-radius:8px;padding:50px 60px;text-align:center;position:relative;box-shadow:0 0 0 3px #0B4A44,0 0 0 6px #C9A93E}
    .cert::before{content:'';position:absolute;inset:12px;border:1.5px dashed rgba(201,169,62,.4);border-radius:4px;pointer-events:none}
    .logo{font-family:'Cormorant Garamond',serif;font-size:52px;font-weight:700;color:#0B4A44;letter-spacing:2px;margin-bottom:4px}
    .org{font-size:12px;color:#5A6A7A;letter-spacing:3px;text-transform:uppercase;margin-bottom:32px}
    .cert-label{font-size:11px;color:#5A6A7A;text-transform:uppercase;letter-spacing:2.5px;margin-bottom:10px}
    .cert-name{font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:700;color:#0B4A44;margin-bottom:16px;border-bottom:2px solid #C9A93E;padding-bottom:12px;display:inline-block}
    .cert-text{font-size:15px;color:#162030;line-height:1.8;margin:20px 0}
    .cert-course{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;color:#0B4A44;margin:4px 0 20px}
    .cert-date{font-size:14px;color:#5A6A7A;margin-bottom:32px}
    .cert-sign{margin-top:36px;padding-top:16px;border-top:1px solid #DDE3EC}
    .cert-sign p{font-size:13px;color:#5A6A7A}
    .cert-sign strong{font-size:14px;color:#162030}
    .cert-footer{position:absolute;bottom:18px;left:0;right:0;font-size:10px;color:#8A9BAB;letter-spacing:.5px}
    @media print{body{padding:0}.cert{box-shadow:none;width:100%}button{display:none}}
  </style></head><body>
  <div class="cert">
    <div class="logo">LA</div>
    <div class="org">LuÃ­s Albert Advocacia</div>
    <div class="cert-label">Certificamos que</div>
    <div><span class="cert-name">${u.nome}</span></div>
    <p class="cert-text">concluiu com Ãªxito o treinamento</p>
    <div class="cert-course">${t.titulo}</div>
    <div class="cert-date">concluÃ­do em ${dataConclusao}</div>
    <div class="cert-sign">
      <strong>LuÃ­s Albert Advocacia â€” Portal de Treinamentos</strong>
      <p>${u.setor||''}</p>
    </div>
    <div class="cert-footer">Documento gerado em ${hoje} Â· AKE/UFT-1.0 Â· Portal de Treinamentos LAADV</div>
  </div>
  <script>window.onload=()=>window.print();<\/script>
  </body></html>`);
  w.document.close();
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PAINEL: MEU PERFIL
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function renderPerfil(){
  const u = S.user;
  document.getElementById('content').innerHTML = `
    <div class="page-header"><h1>ðŸ‘¤ Meu Perfil</h1><p>Visualize e atualize suas informaÃ§Ãµes pessoais.</p></div>
    <div class="page-body">
      <div class="grid-2">
        <div class="card card-pad">
          <div style="text-align:center;margin-bottom:20px">
            <div class="perfil-avatar-big" style="margin:0 auto">${iniciais(u.nome)}</div>
            <h2 style="font-size:22px;margin-bottom:4px">${u.nome}</h2>
            <span class="badge ${ROLE_BADGE[u.role]||'badge-gray'}">${ROLE_LABEL[u.role]||u.role}</span>
          </div>
          <div id="perfil-alert"></div>
          <div class="field"><label>Nome completo</label>
            <input type="text" id="pf-nome" value="${esc(u.nome)}"></div>
          <div class="field"><label>Setor / Departamento</label>
            <input type="text" id="pf-setor" value="${esc(u.setor||'')}" placeholder="Ex: JurÃ­dico, Financeiroâ€¦"></div>
          <div class="field"><label>Cargo</label>
            <input type="text" id="pf-cargo" value="${esc(u.cargo||'')}" placeholder="Ex: Advogado, Analistaâ€¦"></div>
          <button class="btn btn-primary btn-full" onclick="salvarPerfil(this)">Salvar informaÃ§Ãµes</button>
        </div>
        <div class="card card-pad">
          <h3 style="margin-bottom:18px;color:var(--teal)">Alterar Senha</h3>
          <div id="senha-alert"></div>
          <div class="field"><label>Senha atual</label>
            <input type="password" id="pf-atual" placeholder="Digite sua senha atual"></div>
          <div class="field"><label>Nova senha</label>
            <input type="password" id="pf-nova" placeholder="MÃ­nimo 6 caracteres"></div>
          <div class="field"><label>Confirmar nova senha</label>
            <input type="password" id="pf-nova2" placeholder="Repita a nova senha"></div>
          <button class="btn btn-ghost btn-full" onclick="alterarSenha(this)">Alterar senha</button>
          <div class="divider"></div>
          <p class="text-sm text-muted"><strong>Login:</strong> ${esc(u.usuario)}</p>
          <p class="text-sm text-muted mt-1"><strong>Membro desde:</strong> ${u.criado_em ? fmtData(u.criado_em) : 'â€“'}</p>
        </div>
      </div>
    </div>`;
}

async function salvarPerfil(btn){
  const nome  = document.getElementById('pf-nome').value.trim();
  const setor = document.getElementById('pf-setor').value.trim();
  const cargo = document.getElementById('pf-cargo').value.trim();
  const alrt  = document.getElementById('perfil-alert');
  if(!nome){ alrt.innerHTML=`<div class="alert alert-err">O nome nÃ£o pode ser vazio.</div>`; return; }
  setBtnLoading(btn, true);
  try {
    await dbUpdate(`usuarios/${S.user.uid}`, { nome, setor, cargo });
    S.user.nome = nome; S.user.setor = setor; S.user.cargo = cargo;
    saveSession(S.user);
    document.getElementById('top-nome').textContent = nome;
    document.getElementById('top-avatar').textContent = iniciais(nome);
    await audit('EDITAR_PERFIL', `Nome: ${nome}, Setor: ${setor}, Cargo: ${cargo}`);
    alrt.innerHTML = `<div class="alert alert-ok">InformaÃ§Ãµes salvas com sucesso!</div>`;
    toast('Perfil atualizado!','ok');
  } catch(e){
    alrt.innerHTML = `<div class="alert alert-err">Erro ao salvar: ${e.message}</div>`;
  } finally {
    setBtnLoading(btn, false);
  }
}

async function alterarSenha(btn){
  const atual  = document.getElementById('pf-atual').value;
  const nova   = document.getElementById('pf-nova').value;
  const nova2  = document.getElementById('pf-nova2').value;
  const alrt   = document.getElementById('senha-alert');
  alrt.innerHTML = '';
  const hashAtual = await sha256(atual);
  if(hashAtual !== S.user.senha_hash){ alrt.innerHTML=`<div class="alert alert-err">Senha atual incorreta.</div>`; return; }
  if(nova.length < 6){ alrt.innerHTML=`<div class="alert alert-err">A nova senha deve ter pelo menos 6 caracteres.</div>`; return; }
  if(nova !== nova2){ alrt.innerHTML=`<div class="alert alert-err">As senhas nÃ£o coincidem.</div>`; return; }
  setBtnLoading(btn, true);
  try {
    const novoHash = await sha256(nova);
    await dbUpdate(`usuarios/${S.user.uid}`, { senha_hash: novoHash });
    S.user.senha_hash = novoHash; saveSession(S.user);
    await audit('ALTERAR_SENHA', 'Senha alterada pelo prÃ³prio usuÃ¡rio');
    alrt.innerHTML = `<div class="alert alert-ok">Senha alterada com sucesso!</div>`;
    document.getElementById('pf-atual').value = '';
    document.getElementById('pf-nova').value  = '';
    document.getElementById('pf-nova2').value = '';
    toast('Senha alterada!','ok');
  } catch(e){
    alrt.innerHTML = `<div class="alert alert-err">Erro ao salvar: ${e.message}</div>`;
  } finally {
    setBtnLoading(btn, false);
  }
}


// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: renderTreinamentoDetalhe + gerarCertificado + renderPerfil
