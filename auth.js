// ============================================================
//  auth.js — Proteção de rotas, menu por perfil e transições
//  Sistema de Controle de Coleta - Ebenezer
//  Perfis: admin | faturamento | consulta | whatsapp
// ============================================================

(function () {
  const PAGINA_ATUAL = window.location.pathname.split('/').pop() || 'index.html';

  // ── Cortina de transição ─────────────────────────────────
  // Cria o elemento da cortina e o adiciona ao body imediatamente
  // (antes mesmo do Firebase responder)
  (function criarCortina() {
    if (document.getElementById('page-curtain')) return;
    const curtain = document.createElement('div');
    curtain.id = 'page-curtain';
    document.body.appendChild(curtain);
  })();

  // ── Configurações por Perfil ─────────────────────────────
  const PERFIS_CONFIG = {
    admin: {
      acesso: ['dashboard.html', 'index.html', 'agendamento.html', 'consulta.html', 'fechamento.html', 'aprovacao.html', 'usuarios.html', 'migrar.html'],
      menu: [
        { href: 'dashboard.html',   label: 'Dashboard' },
        { href: 'index.html',       label: 'Etiquetas' },
        { href: 'agendamento.html', label: 'Agendar Coleta' },
        { href: 'consulta.html',    label: 'Consultas' },
        { href: 'fechamento.html',  label: 'Fechamento' },
        { href: 'aprovacao.html',   label: 'Aprovar' },
        { href: 'usuarios.html',    label: 'Usuários' }
      ]
    },
    expedicao: {
      acesso: ['dashboard.html', 'index.html', 'agendamento.html', 'consulta.html', 'fechamento.html'],
      menu: [
        { href: 'dashboard.html',   label: 'Dashboard' },
        { href: 'index.html',       label: 'Etiquetas' },
        { href: 'agendamento.html', label: 'Agendar Coleta' },
        { href: 'consulta.html',    label: 'Consultas' },
        { href: 'fechamento.html',  label: 'Fechamento' }
      ]
    },
    faturamento: {
      acesso: ['dashboard.html', 'consulta.html', 'aprovacao.html'],
      menu: [
        { href: 'dashboard.html',   label: 'Dashboard' },
        { href: 'aprovacao.html',   label: 'Aprovar' },
        { href: 'consulta.html',    label: 'Consultas' }
      ]
    },
    whatsapp: {
      acesso: ['dashboard.html', 'consulta.html', 'fechamento.html'],
      menu: [
        { href: 'dashboard.html',   label: 'Dashboard' },
        { href: 'consulta.html',    label: 'Consultas' },
        { href: 'fechamento.html',  label: 'Fechamento' }
      ]
    },
    consulta: {
      acesso: ['dashboard.html', 'consulta.html'],
      menu: [
        { href: 'dashboard.html',   label: 'Dashboard' },
        { href: 'consulta.html',    label: 'Consultas' }
      ]
    }
  };

  // ── Auth listener ────────────────────────────────────────
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      navegarCom('login.html');
      return;
    }

    let perfil = 'consulta';
    let nome   = user.email;
    try {
      const snap = await db.collection('usuarios').where('email', '==', user.email).get();
      if (!snap.empty) {
        const data = snap.docs[0].data();
        perfil = data.perfil || 'consulta';
        nome   = data.nome   || user.email;
      }
    } catch (e) {
      console.warn('Erro ao buscar perfil:', e);
    }

    const config = PERFIS_CONFIG[perfil] || PERFIS_CONFIG.consulta;

    if (!config.acesso.includes(PAGINA_ATUAL)) {
      navegarCom(config.acesso[0]);
      return;
    }

    window._perfilUsuario = perfil;
    window._nomeUsuario   = nome;

    atualizarNav(perfil, nome);

    window.dispatchEvent(new CustomEvent('authPronto', { detail: { perfil, nome } }));
  });

  // ── Navegação com cortina ────────────────────────────────
  /**
   * Navega para outra página com transição suave de cortina.
   * A cortina (roxo-escuro → roxo) desliza da direita para cobrir,
   * depois navega. A nova página entra com a animação pageEnter do body.
   */
  function navegarCom(url) {
    const curtain = document.getElementById('page-curtain');
    if (curtain && !curtain.classList.contains('ativa')) {
      curtain.classList.add('ativa');
      curtain.addEventListener('transitionend', () => {
        window.location.href = url;
      }, { once: true });
    } else {
      window.location.href = url;
    }
  }

  // Expõe globalmente para outros scripts
  window.navegarCom = navegarCom;

  // ── Montar o menu ────────────────────────────────────────
  function atualizarNav(perfil, nome) {
    const ul = document.querySelector('.menu ul');
    if (!ul) return;

    const config = PERFIS_CONFIG[perfil] || PERFIS_CONFIG.consulta;

    ul.innerHTML = '';

    // Brand "ebenézer" à esquerda
    const liBrand = document.createElement('li');
    liBrand.className = 'nav-brand';
    liBrand.innerHTML = '<span>eben<em>ézer</em></span>';
    ul.appendChild(liBrand);

    // Links de navegação
    config.menu.forEach(({ href, label }) => {
      const li  = document.createElement('li');
      const a   = document.createElement('a');
      const isAtivo = PAGINA_ATUAL === href;

      a.href      = href;
      a.textContent = label;
      if (isAtivo) a.classList.add('ativo');

      // Intercepta clique para aplicar cortina antes de navegar
      if (!isAtivo) {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          navegarCom(href);
        });
      }

      li.appendChild(a);
      ul.appendChild(li);
    });

    // Badge de usuário + botão sair (alinhado à direita)
    const liBadge = document.createElement('li');
    liBadge.className = 'nav-badge-item';
    liBadge.innerHTML = `
      <div class="usuario-badge">
        <span class="usuario-nome">${nome}</span>
        <button class="btn-logout" id="btnLogout">Sair</button>
      </div>
    `;
    ul.appendChild(liBadge);

    document.getElementById('btnLogout').addEventListener('click', () => {
      firebase.auth().signOut().then(() => navegarCom('login.html'));
    });
  }
})();
