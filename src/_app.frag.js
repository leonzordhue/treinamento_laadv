  const usuario = document.getElementById('l-user').value.trim().toLowerCase();
  const senha   = document.getElementById('l-pass').value;
  const alrt    = document.getElementById('login-alert');
  alrt.innerHTML = '';
  if(!usuario || !senha){ alrt.innerHTML = `<div class="alert alert-err">Preencha usuÃ¡rio e senha.</div>`; return; }

  setBtnLoading(btn, true);
  try {
    const snap = await db.ref(`${ROOT}/usuarios`).orderByChild('usuario').equalTo(usuario).once('value');
    const val = snap.val();
    if(!val){ alrt.innerHTML = `<div class="alert alert-err">UsuÃ¡rio nÃ£o encontrado.</div>`; return; }

    const uid = Object.keys(val)[0];
    const u   = val[uid];
    if(!u.ativo){ alrt.innerHTML = `<div class="alert alert-err">Conta desativada. Fale com o administrador.</div>`; return; }

    const hash = await sha256(senha);
    if(hash !== u.senha_hash){ alrt.innerHTML = `<div class="alert alert-err">Senha incorreta.</div>`; return; }

    S.user = { uid, ...u };
    saveSession(S.user);

    if(u.primeiro_acesso){
      showScreen('sc-primeiro');
      return;
    }

    await iniciarApp();
    await audit('LOGIN', 'Acesso ao portal');
  } catch(e){
    alrt.innerHTML = `<div class="alert alert-err">Erro ao conectar. Verifique sua conexÃ£o.</div>`;
    console.error(e);
  } finally {
    setBtnLoading(btn, false);
  }
}

async function doPrimeiroAcesso(btn){
  const p1  = document.getElementById('p-pass').value;
  const p2  = document.getElementById('p-pass2').value;
  const alrt = document.getElementById('primeiro-alert');
  alrt.innerHTML = '';
  if(p1.length < 6){ alrt.innerHTML = `<div class="alert alert-err">A senha deve ter pelo menos 6 caracteres.</div>`; return; }
  if(p1 !== p2){ alrt.innerHTML = `<div class="alert alert-err">As senhas nÃ£o coincidem.</div>`; return; }
  setBtnLoading(btn, true);
  try {
    const hash = await sha256(p1);
    await dbUpdate(`usuarios/${S.user.uid}`, { senha_hash: hash, primeiro_acesso: false });
    S.user.senha_hash   = hash;
    S.user.primeiro_acesso = false;
    saveSession(S.user);
    await iniciarApp();
    await audit('ALTERAR_SENHA', 'Senha definida no primeiro acesso');
    toast('Senha definida! Bem-vindo ao portal.', 'ok');
  } catch(e){
    alrt.innerHTML = `<div class="alert alert-err">Erro: ${e.message}</div>`;
  } finally {
    setBtnLoading(btn, false);
  }
}

async function doSetup(btn){
  const org   = document.getElementById('s-org').value.trim();
  const user  = document.getElementById('s-user').value.trim().toLowerCase();
  const p1    = document.getElementById('s-pass').value;
  const p2    = document.getElementById('s-pass2').value;
  const alrt  = document.getElementById('setup-alert');
  alrt.innerHTML = '';

  if(!org || !user || !p1){ alrt.innerHTML = `<div class="alert alert-err">Preencha todos os campos.</div>`; return; }
  if(!/^[a-z0-9._]+$/.test(user)){ alrt.innerHTML = `<div class="alert alert-err">O login sÃ³ pode ter letras minÃºsculas, nÃºmeros, pontos e underlines.</div>`; return; }
  if(p1.length < 6){ alrt.innerHTML = `<div class="alert alert-err">A senha deve ter pelo menos 6 caracteres.</div>`; return; }
  if(p1 !== p2){ alrt.innerHTML = `<div class="alert alert-err">As senhas nÃ£o coincidem.</div>`; return; }

  setBtnLoading(btn, true);
  try {
    const hash = await sha256(p1);
    const uid = await dbPush('usuarios', {
      nome: 'Administrador Master', usuario: user, senha_hash: hash,
      role: 'master', setor: 'Diretoria', cargo: 'Administrador',
      ativo: true, primeiro_acesso: false,
      criado_em: new Date().toISOString(), criado_por_nome: 'Sistema'
    });
    await dbSet('config', { setup_done: true, org_name: org, criado_em: new Date().toISOString() });
    await dbPush('logs', {
      ts: new Date().toISOString(), ator_id: uid, ator_nome: 'Sistema',
      ator_role: 'master', acao: 'SETUP_INICIAL',
      detalhes: `Portal configurado. Admin: ${user}`
    });
    S.user = { uid, nome:'Administrador Master', usuario: user, senha_hash: hash,
      role:'master', setor:'Diretoria', cargo:'Administrador', ativo:true, primeiro_acesso:false };
    saveSession(S.user);
    await iniciarApp();
    toast('Portal configurado com sucesso!', 'ok');
  } catch(e){
    alrt.innerHTML = `<div class="alert alert-err">Erro: ${e.message}</div>`;
  } finally {
    setBtnLoading(btn, false);
  }
}

async function doLogout(){
  await audit('LOGOUT', 'Saiu do portal');
  clearSession();
  S.user = null;
  showScreen('sc-login');
  document.getElementById('l-user').value = '';
  document.getElementById('l-pass').value = '';
  document.getElementById('login-alert').innerHTML = '';
}

function toggleSenha(cb){
  document.getElementById('l-pass').type = cb.checked ? 'text' : 'password';
}

/* â”€â”€ INICIAR APP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function iniciarApp(){
  const u = S.user;
  showScreen('sc-app');
  // topbar
  document.getElementById('top-nome').textContent  = u.nome;
  document.getElementById('top-role-label').textContent = ROLE_LABEL[u.role]||u.role;
  document.getElementById('top-avatar').textContent = iniciais(u.nome);
  document.getElementById('ake-info').textContent   = `TC-LAADV-20250524 Â· ${u.role.toUpperCase()}`;
  document.getElementById('ake-ts').textContent     = new Date().toLocaleString('pt-BR');
  buildNav();
  await navTo('inicio');
}

/* â”€â”€ RENDER PANEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function renderPanel(panel){
  document.getElementById('content').innerHTML = `<div class="loading-panel"><div class="spinner" style="width:32px;height:32px"></div> Carregandoâ€¦</div>`;
  try {
    const map = {
      inicio:     renderInicio,
      treinos:    renderTreinos,
      perfil:     renderPerfil,
      usuarios:   renderUsuarios,
      conteudo:   renderConteudo,
      relatorios: renderRelatorios,
      config:     renderConfig,
    };
    await (map[panel]||renderInicio)();
  } catch(e){
    document.getElementById('content').innerHTML = `<div class="page-body"><div class="alert alert-err">Erro ao carregar: ${e.message}</div></div>`;
    console.error(e);
  }
}

// AKE/UFT-1.0 | BUILD: LAADV-20260524 | IC: 1.0 | MÓDULO: auth functions + iniciarApp + renderPanel
