/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PAINEL: USUÃRIOS (admin+)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
async function renderUsuarios(){
  const data = await dbRead('usuarios');
  const lista = data ? Object.entries(data).sort((a,b)=>a[1].nome.localeCompare(b[1].nome)) : [];

  let rows = lista.map(([uid, u])=>{
    const pode = podeGerenciarUsuario(u.role);
    const isSelf = uid === S.user.uid;
    return `<tr>
      <td>
        <div class="flex items-center gap-sm">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--teal-light);color:var(--teal);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">${iniciais(u.nome)}</div>
          <div><div style="font-weight:500">${esc(u.nome)}</div><div class="text-sm text-muted">${esc(u.usuario)}</div></div>
        </div>
      </td>
      <td>${esc(u.setor||'â€“')}</td>
      <td>${esc(u.cargo||'â€“')}</td>
      <td><span class="badge ${ROLE_BADGE[u.role]||'badge-gray'}">${ROLE_LABEL[u.role]||u.role}</span></td>
      <td><span class="badge ${u.ativo?'badge-green':'badge-red'}">${u.ativo?'Ativo':'Inativo'}</span></td>
      <td>
        <div class="td-actions">
          ${pode&&!isSelf ? `<button class="btn btn-ghost btn-sm" onclick="abrirFormUsuario('${uid}')">Editar</button>` : ''}
          ${pode&&!isSelf&&u.ativo ? `<button class="btn btn-ghost btn-sm" onclick="confirmarDesativar('${uid}','${esc(u.nome)}')">Desativar</button>` : ''}
          ${pode&&!isSelf&&!u.ativo ? `<button class="btn btn-success btn-sm" onclick="toggleAtivo('${uid}',true)">Ativar</button>` : ''}
          ${podeResetarSenha(u.role)&&!isSelf ? `<button class="btn btn-ghost btn-sm" onclick="resetarSenha('${uid}')">ðŸ”‘ Resetar Senha</button>` : ''}
          ${S.user.role==='master'&&!isSelf ? `<button class="btn btn-danger btn-sm" onclick="deletarUsuario('${uid}','${esc(u.nome)}')">Excluir</button>` : ''}
          ${isSelf ? `<span class="text-sm text-muted">VocÃª</span>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div class="page-header">
      <div class="flex justify-between items-center">
        <div><h1>ðŸ‘¥ UsuÃ¡rios</h1><p>Gerencie os participantes e administradores do portal.</p></div>
        <button class="btn btn-gold" onclick="abrirFormUsuario()">+ Novo UsuÃ¡rio</button>
      </div>
    </div>
    <div class="page-body">
      ${!lista.length ? `<div class="empty-state"><div class="empty-icon">ðŸ‘¥</div><h3>Nenhum usuÃ¡rio cadastrado</h3></div>` : `
      <div class="filter-bar">
        <input type="text" id="user-search" placeholder="Buscar por nome ou setorâ€¦" oninput="filtrarUsuarios(this.value)">
      </div>
      <div class="card"><div class="tbl-wrap"><table id="tabela-usuarios">
        <thead><tr><th>Nome / Login</th><th>Setor</th><th>Cargo</th><th>Perfil</th><th>Status</th><th>AÃ§Ãµes</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div></div>`}
    </div>`;
}

function abrirFormUsuario(uid=null){
  dbRead(uid ? `usuarios/${uid}` : null).then(u=>{
    const edit = !!uid;
    const roleOptions = [
      { v:'user',   l:'Participante' },
      { v:'admin',  l:'Administrador' },
      ...(S.user.role==='master' ? [{ v:'master', l:'Super Administrador' }] : []),
    ].map(o=>`<option value="${o.v}"${u&&u.role===o.v?' selected':''}>${o.l}</option>`).join('');

    const corpo = `
      <div id="uform-alert"></div>
      <div class="field"><label>Nome completo</label>
        <input type="text" id="uf-nome" value="${esc(u?.nome||'')}" placeholder="Ex: JoÃ£o da Silva"></div>
      <div class="input-row">
        <div class="field"><label>Login (usuÃ¡rio)</label>
          <input type="text" id="uf-user" value="${esc(u?.usuario||'')}" placeholder="Ex: joao.silva" ${edit?'readonly style="background:var(--bg)"':''}></div>
        <div class="field"><label>Perfil de acesso</label>
          <select id="uf-role">${roleOptions}</select></div>
      </div>
      <div class="input-row">
        <div class="field"><label>Setor</label>
          <input type="text" id="uf-setor" value="${esc(u?.setor||'')}" placeholder="Ex: JurÃ­dico"></div>
        <div class="field"><label>Cargo</label>
          <input type="text" id="uf-cargo" value="${esc(u?.cargo||'')}" placeholder="Ex: Advogado"></div>
      </div>
      ${!edit ? `<div class="field"><label>Senha inicial</label>
        <input type="text" id="uf-pass" placeholder="O usuÃ¡rio precisarÃ¡ trocar no 1Âº acesso">
        <div class="hint">O sistema pedirÃ¡ para trocar a senha no primeiro login.</div></div>` :
        `<div class="alert alert-warn">Para redefinir a senha do usuÃ¡rio, use o botÃ£o "Redefinir Senha" abaixo.</div>
         <input type="hidden" id="uf-uid" value="${uid}">
         <input type="hidden" id="uf-pass" value="">`}`;

    const rodape = `
      <button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
      ${edit && S.user.role==='master' ? `<button class="btn btn-ghost" onclick="resetarSenha('${uid}')">Redefinir Senha</button>` : ''}
      <button class="btn btn-primary" onclick="salvarUsuario(${edit?`'${uid}'`:'null'},this)">${edit?'Salvar alteraÃ§Ãµes':'Criar UsuÃ¡rio'}</button>`;

    abrirModal(edit?'Editar UsuÃ¡rio':'Novo UsuÃ¡rio', corpo, rodape);
  });
}

async function salvarUsuario(uid=null, btn=null){
  const nome  = document.getElementById('uf-nome').value.trim();
  const user  = document.getElementById('uf-user').value.trim().toLowerCase();
  const role  = document.getElementById('uf-role').value;
  const setor = document.getElementById('uf-setor').value.trim();
  const cargo = document.getElementById('uf-cargo').value.trim();
  const passEl= document.getElementById('uf-pass');
  const alrt  = document.getElementById('uform-alert');
  alrt.innerHTML = '';

  if(!nome){ alrt.innerHTML=`<div class="alert alert-err">O nome Ã© obrigatÃ³rio.</div>`; return; }
  if(!uid && !user){ alrt.innerHTML=`<div class="alert alert-err">O login Ã© obrigatÃ³rio.</div>`; return; }
  if(!uid && !/^[a-z0-9._]+$/.test(user)){ alrt.innerHTML=`<div class="alert alert-err">Login invÃ¡lido. Use letras minÃºsculas, nÃºmeros, pontos ou underlines.</div>`; return; }
  if(!uid && (!passEl.value || passEl.value.length < 6)){ alrt.innerHTML=`<div class="alert alert-err">Informe uma senha inicial de pelo menos 6 caracteres.</div>`; return; }

  setBtnLoading(btn, true);
  try {
    if(uid){
      await dbUpdate(`usuarios/${uid}`, { nome, role, setor, cargo });
      await audit('EDITAR_USUARIO', `Editou: ${nome} (${user}) â†’ perfil: ${role}`);
      toast(`UsuÃ¡rio "${nome}" atualizado.`,'ok');
    } else {
      const snap = await db.ref(`${ROOT}/usuarios`).orderByChild('usuario').equalTo(user).once('value');
      if(snap.val()){ alrt.innerHTML=`<div class="alert alert-err">Este login jÃ¡ estÃ¡ em uso.</div>`; return; }
      const hash = await sha256(passEl.value);
      const novo = { nome, usuario:user, senha_hash:hash, role, setor, cargo, ativo:true, primeiro_acesso:true,
        criado_em:new Date().toISOString(), criado_por_nome:S.user.nome };
      await dbPush('usuarios', novo);
      await audit('CRIAR_USUARIO', `Criou: ${nome} (${user}), perfil: ${role}`);
      toast(`UsuÃ¡rio "${nome}" criado! Login: ${user}`, 'ok');
    }
    fecharModal();
    await renderUsuarios();
  } catch(e){
    alrt.innerHTML=`<div class="alert alert-err">Erro: ${e.message}</div>`;
  } finally {
    setBtnLoading(btn, false);
  }
}

async function toggleAtivo(uid, ativo){
  await dbUpdate(`usuarios/${uid}`, { ativo });
  await audit(ativo?'ATIVAR_USUARIO':'DESATIVAR_USUARIO', `UID: ${uid}`);
  toast(ativo?'UsuÃ¡rio ativado.':'UsuÃ¡rio desativado.','ok');
  await renderUsuarios();
}

function deletarUsuario(uid, nome){
  confirmar(`Tem certeza que deseja excluir permanentemente o usuÃ¡rio <strong>${nome}</strong>? Esta aÃ§Ã£o nÃ£o pode ser desfeita.`,
    async function(){
      await dbRemove(`usuarios/${uid}`);
      await dbRemove(`conclusoes/${uid}`);
      await audit('DELETAR_USUARIO', `Excluiu: ${nome} (${uid})`);
      toast(`UsuÃ¡rio "${nome}" excluÃ­do.`,'ok');
      await renderUsuarios();
    }
  );
}

function resetarSenha(uid){
  const corpo = `
    <p class="mb-2">Defina uma nova senha temporÃ¡ria para este usuÃ¡rio. Ele serÃ¡ obrigado a trocar no prÃ³ximo login.</p>
    <div id="reset-alert"></div>
    <div class="field"><label>Nova senha temporÃ¡ria</label>
      <input type="text" id="r-pass" placeholder="MÃ­nimo 6 caracteres"></div>`;
  abrirModal('Redefinir Senha', corpo,
    `<button class="btn btn-ghost" onclick="fecharModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="confirmarResetSenha('${uid}')">Redefinir</button>`);
}

async function confirmarResetSenha(uid){
  const p = document.getElementById('r-pass').value;
  const alrt = document.getElementById('reset-alert');
  if(p.length < 6){ alrt.innerHTML=`<div class="alert alert-err">MÃ­nimo 6 caracteres.</div>`; return; }
  const hash = await sha256(p);
  await dbUpdate(`usuarios/${uid}`, { senha_hash: hash, primeiro_acesso: true });
  await audit('RESETAR_SENHA', `Redefiniu senha do UID: ${uid}`);
  fecharModal();
  toast('Senha redefinida. O usuÃ¡rio precisarÃ¡ trocar no prÃ³ximo acesso.','ok');
}


// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: renderUsuarios + podeGerenciarUsuario
