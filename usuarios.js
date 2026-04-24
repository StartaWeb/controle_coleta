// ============================================================
//  usuarios.js — Gestão Administrativa de Perfis e Acesso
// ============================================================

let _usuariosCache = [];
let _usuarioEditandoId = null;

// Escuta usuários em tempo real
function ouvirUsuarios() {
  const container = document.getElementById('listaUsuarios');
  
  db.collection('usuarios').orderBy('nome', 'asc').onSnapshot((snapshot) => {
    _usuariosCache = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    exibirUsuarios(_usuariosCache);
  }, (err) => {
    console.error('Erro ao listar usuários:', err);
    container.innerHTML = '<p style="color:red">Erro ao carregar usuários. Verifique as permissões.</p>';
  });
}

function exibirUsuarios(lista) {
  const container = document.getElementById('listaUsuarios');
  container.innerHTML = '';

  if (lista.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#718096; width: 100%;">Nenhum usuário cadastrado.</p>';
    return;
  }

  lista.forEach(u => {
    const div = document.createElement('div');
    div.className = 'user-card';
    
    const badgeClass = `badge-${u.perfil || 'consulta'}`;
    const perfilNome = {
      admin: 'Administrador',
      expedicao: 'Expedição',
      faturamento: 'Faturamento',
      whatsapp: 'WhatsApp',
      consulta: 'Consulta'
    }[u.perfil] || 'Consulta';

    div.innerHTML = `
      <div class="user-info">
        <h3>${u.nome || 'Sem Nome'}</h3>
        <p>${u.email || '-'}</p>
        <span class="user-badge ${badgeClass}">${perfilNome}</span>
      </div>
      <div class="user-actions">
        <button class="btn-action btn-reset" onclick="resetarSenha('${u.email}')" title="Enviar e-mail de redefinição">🔑 Senha</button>
        <button class="btn-action btn-perfil" onclick="abrirEdicao('${u._id}')">✏️ Perfil</button>
        <button class="btn-action btn-delete" onclick="removerUsuario('${u._id}', '${u.nome}')">🗑️</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// Modal Logic
function abrirModalUsuario() {
  _usuarioEditandoId = null;
  document.getElementById('modal-titulo').textContent = 'Novo Usuário';
  document.getElementById('formUsuario').reset();
  document.getElementById('user-email').disabled = false;
  document.getElementById('msg-informativa').style.display = 'block';
  document.getElementById('modal-usuario').style.display = 'flex';
}

function abrirEdicao(id) {
  const u = _usuariosCache.find(x => x._id === id);
  if (!u) return;

  _usuarioEditandoId = id;
  document.getElementById('modal-titulo').textContent = 'Editar Perfil';
  document.getElementById('user-nome').value = u.nome || '';
  document.getElementById('user-email').value = u.email || '';
  document.getElementById('user-email').disabled = true; // Não muda email de user existente aqui
  document.getElementById('user-perfil').value = u.perfil || 'consulta';
  document.getElementById('msg-informativa').style.display = 'none';
  document.getElementById('modal-usuario').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modal-usuario').style.display = 'none';
}

async function salvarUsuario(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const nome = document.getElementById('user-nome').value.trim();
  const email = document.getElementById('user-email').value.trim();
  const perfil = document.getElementById('user-perfil').value;

  try {
    if (_usuarioEditandoId) {
      // APENAS ATUALIZA PERFIL/NOME NO FIRESTORE
      await db.collection('usuarios').doc(_usuarioEditandoId).update({ nome, perfil });
      mostrarToast('Usuário atualizado com sucesso!', 'sucesso');
    } else {
      // NOVO USUÁRIO:
      // 1. Criar registro no Firestore (usamos o email como ID provisório ou deixamos o Firebase gerar)
      // Nota: O ideal é que o ID do doc seja o UID do Auth. 
      // Como não podemos criar Auth sem deslogar facilmente, pedimos que o user use o reset de senha.
      
      // Vamos usar uma estratégia de "Pré-cadastro":
      // Criamos no Firestore. No primeiro login, se o Auth não existir, o sistema de login padrão pode lidar.
      // Mas para ser 100% funcional, o Admin deve saber que o usuário precisa de uma conta no Auth.
      
      // Vou implementar o envio automático de e-mail de "Boas vindas" via reset de senha.
      // Se o usuário não existir no Auth, o Firebase não envia. 
      // Então, o passo manual é o Admin criar via Console ou usarmos a API de criação (que desloga).
      
      // Melhor: Salva no Firestore e avisa o Admin.
      await db.collection('usuarios').add({
        nome,
        email,
        perfil,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      try {
        await firebase.auth().sendPasswordResetEmail(email);
        mostrarToast('✅ Usuário pré-cadastrado! Um e-mail de definição de senha foi enviado para ' + email, 'sucesso');
      } catch (authErr) {
        mostrarToast('⚠️ Usuário salvo no banco, mas o e-mail de senha não pôde ser enviado. Isso acontece se o e-mail ainda não tem uma conta no sistema. Peça para o usuário se cadastrar ou use o Console do Firebase.', 'aviso');
      }
    }
    fecharModal();
  } catch (err) {
    if (err.code && err.code.includes('email-already-in-use')) {
      mostrarToast('Este e-mail já está em uso.', 'erro');
    } else {
      mostrarToast('Erro ao salvar: ' + err.message, 'erro');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
}

async function resetarSenha(email) {
  if (!confirm(`Deseja enviar um e-mail de redefinição de senha para ${email}?`)) return;
  try {
    await firebase.auth().sendPasswordResetEmail(email);
    mostrarToast('E-mail de recuperação enviado com sucesso!', 'sucesso');
  } catch (err) {
    mostrarToast('Erro ao enviar e-mail: ' + err.message, 'erro');
  }
}

async function removerUsuario(id, nome) {
  if (!confirm(`Deseja realmente remover o usuário "${nome}"? Ele perderá acesso ao sistema imediatamente.`)) return;
  try {
    await db.collection('usuarios').doc(id).delete();
    mostrarToast('Usuário removido com sucesso!', 'sucesso');
  } catch (err) {
    mostrarToast('Erro ao remover: ' + err.message, 'erro');
  }
}

// Inicia
window.addEventListener('authPronto', (e) => {
  if (e.detail.perfil === 'admin') {
    ouvirUsuarios();
  } else {
    window.location.href = 'consulta.html';
  }
});
