/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PAINEL: CONTEÃšDO / TREINAMENTOS ADMIN
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
window._expandidos = window._expandidos || new Set();

async function renderConteudo(){
  const data = await dbRead('treinamentos');
  const lista = data ? Object.entries(data).sort((a,b)=>(a[1].ordem||0)-(b[1].ordem||0)) : [];

  const cards = lista.map(([tid,t])=>{
    const videos = t.videos ? Object.entries(t.videos) : [];
    const nvids = videos.length;
    const expandido = window._expandidos.has(tid);

    const vidsHtml = videos.map(([vid,v],i)=>`
      <div class="ci-vid-row">
        <div class="ci-vid-num">${i+1}</div>
        <div class="ci-vid-info">
          <div class="ci-vid-title">${esc(v.titulo)}</div>
          ${v.duracao?`<div class="ci-vid-dur">â± ${esc(v.duracao)}</div>`:''}
        </div>
        <button class="btn btn-danger btn-sm" onclick="excluirVideoInline('${tid}','${vid}','${esc(t.titulo)}')">âœ•</button>
      </div>`).join('') || `<p class="text-sm text-muted" style="padding:8px 0">Nenhum vÃ­deo ainda.</p>`;

    const addForm = `
      <div class="ci-add-form">
        <p class="section-label">Adicionar vÃ­deo</p>
        <div id="vf-alert-${tid}"></div>
        <div class="field"><label>TÃ­tulo</label><input type="text" id="vf-titulo-${tid}" placeholder="Ex: Aula 1 â€” IntroduÃ§Ã£o"></div>
        <div class="field"><label>Link do YouTube</label><input type="text" id="vf-url-${tid}" placeholder="https://youtube.com/watch?v=â€¦"></div>
        <div class="field"><label>DuraÃ§Ã£o (opcional)</label><input type="text" id="vf-dur-${tid}" placeholder="Ex: 15 min"></div>
        <button class="btn btn-primary btn-sm mt-1" onclick="adicionarVideoConteudo('${tid}',this)">+ Salvar VÃ­deo</button>
      </div>`;

    return `
      <div class="ci-card" id="ci-${tid}">
        <div class="ci-header">
          <div class="ci-info">
            <div class="ci-title">${esc(t.titulo)}</div>
            ${t.descricao?`<div class="ci-desc">${esc(t.descricao)}</div>`:''}
          </div>
          <div class="ci-side">
            <div class="ci-badges">
              <span class="badge ${t.ativo?'badge-green':'badge-red'}">${t.ativo?'Ativo':'Inativo'}</span>
              <span class="badge badge-teal">${nvids} vÃ­deo${nvids!==1?'s':''}</span>
            </div>
            <div class="ci-actions">
              <button class="btn btn-ghost btn-sm" onclick="expandirTrein('${tid}')">${expandido?'â–² Recolher':'â–¼ Expandir'}</button>
              <button class="btn btn-ghost btn-sm" onclick="abrirFormTrein('${tid}')">âœ Editar</button>
              ${S.user.role==='master'?`<button class="btn btn-danger btn-sm" onclick="deletarTreinComCheck('${tid}','${esc(t.titulo)}')">Excluir</button>`:''}
            </div>
          </div>
        </div>
        ${expandido ? `<div class="ci-videos" id="ci-vids-${tid}">${vidsHtml}${addForm}</div>` : ''}
      </div>`;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="flex justify-between items-center">
        <div><h1>ðŸ“š ConteÃºdo</h1><p>Gerencie os treinamentos e vÃ­deos da plataforma.</p></div>
        <button class="btn btn-gold" onclick="abrirFormTrein()">+ Novo Treinamento</button>
      </div>
    </div>
    <div class="page-body">
      ${!lista.length
        ? `<div class="empty-state"><div class="empty-icon">ðŸ“š</div><h3>Nenhum treinamento cadastrado</h3><p>Clique em "+ Novo Treinamento" para comeÃ§ar.</p></div>`
        : cards}
    </div>`;
}

window.expandirTrein = function(tid){
  if(window._expandidos.has(tid)) window._expandidos.delete(tid);
  else window._expandidos.add(tid);
  renderConteudo();
};

window.excluirVideoInline = function(tid, vid, tituloTrein){
  confirmar(`Remover este vÃ­deo do treinamento <strong>${tituloTrein}</strong>?`,
    async function(){
      await dbRemove(`treinamentos/${tid}/videos/${vid}`);
      await audit('REMOVER_VIDEO', `Removeu vÃ­deo ${vid} do treinamento ${tid}`);
      toast('VÃ­deo removido.','ok');
      await renderConteudo();
    }
  );
};

window.adicionarVideoConteudo = async function(tid, btn){
  const titulo = document.getElementById(`vf-titulo-${tid}`).value.trim();
  const url    = document.getElementById(`vf-url-${tid}`).value.trim();
  const dur    = document.getElementById(`vf-dur-${tid}`).value.trim();
  const alrt   = document.getElementById(`vf-alert-${tid}`);
  if(!titulo||!url){ alrt.innerHTML=`<div class="alert alert-err">Preencha tÃ­tulo e link do vÃ­deo.</div>`; return; }
  if(!extrairYtId(url) && !url.startsWith('http')){ alrt.innerHTML=`<div class="alert alert-err">Link invÃ¡lido. Use um link do YouTube ou URL de vÃ­deo.</div>`; return; }
  setBtnLoading(btn, true);
  try {
    await dbPush(`treinamentos/${tid}/videos`, { titulo, url, duracao:dur, criado_em:new Date().toISOString() });
    await audit('ADICIONAR_VIDEO', `Adicionou vÃ­deo "${titulo}" ao treinamento ${tid}`);
    toast('VÃ­deo adicionado!','ok');
    await renderConteudo();
  } catch(e){
    if(alrt) alrt.innerHTML=`<div class="alert alert-err">Erro: ${e.message}</div>`;
  } finally {
    setBtnLoading(btn, false);
  }
};

window.deletarTreinComCheck = function(tid, titulo){
  confirmar(`Excluir o treinamento <strong>${titulo}</strong>? Esta aÃ§Ã£o Ã© irreversÃ­vel.`,
    async function(){
      const conclusoes = await dbRead('conclusoes');
      if(conclusoes){
        const temConclusao = Object.values(conclusoes).some(u => u[tid]);
        if(temConclusao){
          toast('NÃ£o Ã© possÃ­vel excluir: existem registros de conclusÃ£o vinculados a este treinamento.','err');
          return;
        }
      }
      await dbRemove(`treinamentos/${tid}`);
      window._expandidos.delete(tid);
      await audit('DELETAR_TREINAMENTO', `Excluiu: "${titulo}"`);
      toast('Treinamento excluÃ­do.','ok');
      await renderConteudo();
    }
  );
};

function abrirFormTrein(tid=null){
  dbRead(tid?`treinamentos/${tid}`:null).then(t=>{
    const ativoCheck = tid
      ? `<div class="field"><label style="display:flex;align-items:center;gap:8px;cursor:pointer">
           <input type="checkbox" id="tf-ativo" ${t?.ativo!==false?'checked':''} style="width:16px;height:16px;accent-color:var(--teal)">
           <span>Treinamento ativo (visÃ­vel para usuÃ¡rios)</span>
         </label></div>`
      : '';
    abrirModal(tid?'Editar Treinamento':'Novo Treinamento',
      `<div id="tf-alert"></div>
       <div class="field"><label>TÃ­tulo do treinamento</label>
         <input type="text" id="tf-titulo" value="${esc(t?.titulo||'')}" placeholder="Ex: IntegraÃ§Ã£o e Onboarding"></div>
       <div class="field"><label>DescriÃ§Ã£o</label>
         <textarea id="tf-desc" rows="3" maxlength="300" placeholder="Descreva o objetivo deste treinamentoâ€¦" oninput="contarChars(this,'tf-desc-count')">${esc(t?.descricao||'')}</textarea>
         <div class="char-count" id="tf-desc-count">${(t?.descricao||'').length}/300 caracteres</div></div>
       <div class="field"><label>Ordem de exibiÃ§Ã£o</label>
         <input type="number" id="tf-ordem" value="${t?.ordem||1}" min="1" style="width:80px"></div>
       ${ativoCheck}`,
      `<button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
       <button class="btn btn-primary" onclick="salvarTrein(${tid?`'${tid}'`:'null'},this)">${tid?'Salvar':'Criar'}</button>`
    );
  });
}

async function salvarTrein(tid=null, btn=null){
  const titulo = document.getElementById('tf-titulo').value.trim();
  const desc   = document.getElementById('tf-desc').value.trim();
  const ordem  = parseInt(document.getElementById('tf-ordem').value)||1;
  const alrt   = document.getElementById('tf-alert');
  if(!titulo){ alrt.innerHTML=`<div class="alert alert-err">O tÃ­tulo Ã© obrigatÃ³rio.</div>`; return; }
  setBtnLoading(btn, true);
  try {
    if(tid){
      const ativoEl = document.getElementById('tf-ativo');
      const ativo = ativoEl ? ativoEl.checked : true;
      await dbUpdate(`treinamentos/${tid}`, { titulo, descricao:desc, ordem, ativo });
      await audit('EDITAR_TREINAMENTO', `Editou: "${titulo}" (ativo: ${ativo})`);
      toast('Treinamento atualizado.','ok');
    } else {
      await dbPush('treinamentos', { titulo, descricao:desc, ordem, ativo:true, criado_em:new Date().toISOString(), criado_por:S.user.uid });
      await audit('CRIAR_TREINAMENTO', `Criou: "${titulo}"`);
      toast(`Treinamento "${titulo}" criado!`,'ok');
    }
    fecharModal();
    await renderConteudo();
  } catch(e){
    alrt.innerHTML=`<div class="alert alert-err">Erro: ${e.message}</div>`;
  } finally {
    setBtnLoading(btn, false);
  }
}

async function toggleAtivoTrein(tid, ativo){
  await dbUpdate(`treinamentos/${tid}`, { ativo });
  await audit(ativo?'ATIVAR_TREINAMENTO':'DESATIVAR_TREINAMENTO', `TID: ${tid}`);
  toast(ativo?'Treinamento ativado.':'Treinamento desativado.','ok');
  await renderConteudo();
}

function deletarTrein(tid, titulo){
  confirmar(`Excluir o treinamento <strong>${titulo}</strong>? Todos os vÃ­deos e registros de conclusÃ£o serÃ£o removidos.`,
    async function(){
      await dbRemove(`treinamentos/${tid}`);
      await audit('DELETAR_TREINAMENTO', `Excluiu: "${titulo}"`);
      toast(`Treinamento excluÃ­do.`,'ok');
      await renderConteudo();
    }
  );
}

async function abrirGerenciarVideos(tid){
  const t = await dbRead(`treinamentos/${tid}`);
  if(!t) return;
  const videos = t.videos ? Object.entries(t.videos) : [];

  const listaHtml = videos.map(([vid,v],i)=>`
    <div class="flex items-center gap-sm" style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:26px;height:26px;border-radius:50%;background:var(--teal);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">${i+1}</div>
      <div style="flex:1">
        <div style="font-weight:500;font-size:14px">${esc(v.titulo)}</div>
        ${v.duracao?`<div class="text-sm text-muted">â± ${v.duracao}</div>`:''}
      </div>
      <button class="btn btn-danger btn-sm" onclick="deletarVideo('${tid}','${vid}','${esc(t.titulo)}')">âœ•</button>
    </div>`).join('') || `<p class="text-sm text-muted" style="padding:12px 0">Nenhum vÃ­deo cadastrado ainda.</p>`;

  abrirModal(`VÃ­deos: ${t.titulo}`,
    `<p class="text-sm text-muted mb-2">Cole URLs do YouTube. O sistema cria o player automaticamente.</p>
     ${listaHtml}
     <div class="divider"></div>
     <p class="section-label">Adicionar vÃ­deo</p>
     <div id="vf-alert"></div>
     <div class="field"><label>TÃ­tulo do vÃ­deo</label>
       <input type="text" id="vf-titulo" placeholder="Ex: Aula 1 â€” IntroduÃ§Ã£o"></div>
     <div class="field"><label>Link do YouTube</label>
       <input type="text" id="vf-url" placeholder="https://youtube.com/watch?v=..."></div>
     <div class="field"><label>DuraÃ§Ã£o (opcional)</label>
       <input type="text" id="vf-dur" placeholder="Ex: 15 min"></div>`,
    `<button class="btn btn-ghost" onclick="fecharModal()">Fechar</button>
     <button class="btn btn-primary" onclick="adicionarVideo('${tid}',this)">+ Adicionar VÃ­deo</button>`
  );
}

async function adicionarVideo(tid, btn=null){
  const titulo = document.getElementById('vf-titulo').value.trim();
  const url    = document.getElementById('vf-url').value.trim();
  const dur    = document.getElementById('vf-dur').value.trim();
  const alrt   = document.getElementById('vf-alert');
  if(!titulo||!url){ alrt.innerHTML=`<div class="alert alert-err">Preencha tÃ­tulo e link do vÃ­deo.</div>`; return; }
  if(!extrairYtId(url) && !url.startsWith('http')){ alrt.innerHTML=`<div class="alert alert-err">Link invÃ¡lido. Use um link do YouTube ou URL de vÃ­deo.</div>`; return; }
  setBtnLoading(btn, true);
  try {
    await dbPush(`treinamentos/${tid}/videos`, { titulo, url, duracao:dur, criado_em:new Date().toISOString() });
    await audit('ADICIONAR_VIDEO', `Adicionou vÃ­deo "${titulo}" ao treinamento ${tid}`);
    toast('VÃ­deo adicionado!','ok');
    fecharModal();
    await abrirGerenciarVideos(tid);
  } catch(e){
    alrt.innerHTML=`<div class="alert alert-err">Erro: ${e.message}</div>`;
  } finally {
    setBtnLoading(btn, false);
  }
}

function deletarVideo(tid, vid, tituloTrein){
  confirmar(`Remover este vÃ­deo do treinamento <strong>${tituloTrein}</strong>?`,
    async function(){
      await dbRemove(`treinamentos/${tid}/videos/${vid}`);
      await audit('REMOVER_VIDEO', `Removeu vÃ­deo ${vid} do treinamento ${tid}`);
      toast('VÃ­deo removido.','ok');
      fecharModal();
      await abrirGerenciarVideos(tid);
    }
  );
}


// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: renderConteudo + adicionarVideo helpers
