/**
 * dashboard.js - Lógica de monitoramento e KPIs
 * EBENEZER - Controle de Coleta
 *
 * Lógica de orçamentos:
 * - KPI "Aguardando Aprovação": total de fechamentos com status 'aguardando'
 * - KPI "Orçamentos Atrasados": desses, quantos estão aguardando há mais de 3 dias
 * - Usa ouvirFechamentosAguardando (mais eficiente — query com filtro no Firestore)
 */

let _orcUnsub    = null;
let _coletaUnsub = null;
let _etiquetaUnsub = null;

// Inicia monitoramento quando autenticação estiver pronta
// Fallback: se authPronto já disparou (sessão em cache), inicializa imediatamente
window.addEventListener('authPronto', () => {
  iniciarMonitoramento();
});

// Fallback robusto: auth pode ter sido resolvido antes deste script carregar
if (window._perfilUsuario) {
  iniciarMonitoramento();
}

function iniciarMonitoramento() {
  // Cancela listeners anteriores se existirem
  if (_orcUnsub)      _orcUnsub();
  if (_coletaUnsub)   _coletaUnsub();
  if (_etiquetaUnsub) _etiquetaUnsub();

  // 1. Monitorar Orçamentos — apenas os 'aguardando' (query eficiente)
  _orcUnsub = ouvirFechamentosAguardando(lista => {
    processarOrcamentos(lista);
  });

  // 2. Monitorar Coletas
  _coletaUnsub = ouvirColetas(lista => {
    processarColetas(lista);
  });

  // 3. Monitorar Etiquetas de hoje
  _etiquetaUnsub = ouvirEtiquetas(lista => {
    processarEtiquetas(lista);
  });
}

function processarOrcamentos(lista) {
  // lista já contém apenas os status === 'aguardando' (filtrado no Firestore)
  const agora = new Date();
  const TRES_DIAS_MS = 3 * 24 * 60 * 60 * 1000;

  const atrasados = lista.filter(f => {
    // Usa a data de criação da etiqueta (quando o orçamento foi gerado)
    // com fallback para criadoEm do fechamento
    const ref = f.etiquetaCriadaEm || f.criadoEm;
    if (!ref) return false;
    const data = ref.toDate ? ref.toDate() : new Date(ref);
    return (agora - data) > TRES_DIAS_MS;
  });

  // KPI: total aguardando aprovação
  setKpi('kpi-pendente', lista.length);

  // KPI: dos que aguardam, quantos passaram de 3 dias
  setKpi('kpi-orc-delay', atrasados.length);

  renderizarListaAtrasoOrc(atrasados);
  renderizarFilaAprovacao(lista);
}

function processarColetas(lista) {
  const agora = new Date();
  const TRES_DIAS_MS = 3 * 24 * 60 * 60 * 1000;

  // Coletas que ainda não foram realizadas
  const pendentes = lista.filter(c => c.status !== 'Realizada');

  // Das pendentes, quantas estão agendadas há mais de 3 dias
  const atrasadas = pendentes.filter(c => {
    if (!c.criadoEm) return false;
    const dataCriacao = c.criadoEm.toDate ? c.criadoEm.toDate() : new Date(c.criadoEm);
    return (agora - dataCriacao) > TRES_DIAS_MS;
  });

  // Coletas com status exatamente 'Agendada' (ativas, aguardando execução)
  const agendadas = lista.filter(c => c.status === 'Agendada');

  setKpi('kpi-coleta-delay', atrasadas.length);
  setKpi('kpi-coletas-agendadas', agendadas.length);
  renderizarListaAtrasoColeta(atrasadas);
}

function processarEtiquetas(lista) {
  const agora = new Date();
  const VINTE_QUATRO_H_MS = 24 * 60 * 60 * 1000;

  const hoje = lista.filter(et => {
    if (!et.criadoEm) return false;
    const data = et.criadoEm.toDate ? et.criadoEm.toDate() : new Date(et.criadoEm);
    return (agora - data) < VINTE_QUATRO_H_MS;
  });

  setKpi('kpi-etiquetas-hoje', hoje.length);
}


/** Atualiza o valor de um KPI no DOM com animação de contagem */
function setKpi(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  const atual = parseInt(el.textContent) || 0;
  if (atual === valor) return;

  // Pequena animação de fade-update
  el.style.transition = 'opacity 0.2s ease';
  el.style.opacity = '0.3';
  setTimeout(() => {
    el.textContent = valor;
    el.style.opacity = '1';
  }, 180);
}

function renderizarListaAtrasoOrc(lista) {
  const container = document.getElementById('lista-orc-atraso');
  if (!container) return;

  if (lista.length === 0) {
    container.innerHTML = '<p class="lista-vazia">Nenhum orçamento em atraso crítico.</p>';
    return;
  }

  // Ordena por maior atraso (mais antigo primeiro)
  const ordenada = [...lista].sort((a, b) => {
    const ta = a.criadoEm?.seconds ?? 0;
    const tb = b.criadoEm?.seconds ?? 0;
    return ta - tb;
  });

  container.innerHTML = ordenada.map(f => {
    // Data de referência: quando a etiqueta do orçamento foi gerada
    const refTimestamp = f.etiquetaCriadaEm || f.criadoEm;
    const dias = calcularDias(refTimestamp);
    const critica = dias > 5;
    const dataCriacao = refTimestamp?.toDate
      ? refTimestamp.toDate().toLocaleDateString('pt-BR')
      : '—';

    return `
      <div class="delay-item ${critica ? 'critical' : ''}">
        <div class="delay-info">
          <h4>ORC ${f.orcamento || '—'} — ${f.cliente || 'Cliente não informado'}</h4>
          <p>Operador: ${f.nomeOperador || '—'} · Criado em: ${dataCriacao}</p>
        </div>
        <div class="delay-right">
          <span class="delay-days ${critica ? '' : 'orange'}">${dias}d atrasado</span>
          <a href="aprovacao.html" class="btn-action">Aprovar</a>
        </div>
      </div>
    `;
  }).join('');
}

function renderizarFilaAprovacao(lista) {
  const container = document.getElementById('lista-pendente-total');
  if (!container) return;

  if (lista.length === 0) {
    container.innerHTML = '<p class="lista-vazia">Nenhum orçamento pendente de aprovação.</p>';
    return;
  }

  // Ordena por data (mais recente primeiro)
  const ordenada = [...lista].sort((a, b) => {
    const ta = b.criadoEm?.seconds ?? 0;
    const tb = a.criadoEm?.seconds ?? 0;
    return ta - tb;
  });

  container.innerHTML = ordenada.map(f => {
    const dataCriacao = f.criadoEm ? new Date(f.criadoEm.seconds * 1000).toLocaleDateString('pt-BR') : '—';
    return `
      <div class="delay-item">
        <div class="delay-info">
          <h4>ORC ${f.orcamento || '—'} — ${f.cliente || '—'}</h4>
          <p>Operador: ${f.nomeOperador || '—'} · Enviado em: ${dataCriacao}</p>
          ${f.obsOperador ? `<p style="color:#9c27b0; font-weight:600; font-size:11px; margin-top:4px;">📝 ${f.obsOperador}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderizarListaAtrasoColeta(lista) {
  const container = document.getElementById('lista-coleta-atraso');
  if (!container) return;

  if (lista.length === 0) {
    container.innerHTML = '<p class="lista-vazia">Nenhuma coleta pendente em atraso.</p>';
    return;
  }

  container.innerHTML = lista.map(c => {
    const dias = calcularDias(c.criadoEm);
    const critica = dias > 5;
    return `
      <div class="delay-item ${critica ? 'critical' : ''}">
        <div class="delay-info">
          <h4>${c.numeroColeta || 'COLETA'} — ${c.cliente || '—'}</h4>
          <p>Protocolo: ${c.numeroProtocolo || '—'} · Agendado: ${c.dataHoraAgendamento || '—'}</p>
        </div>
        <div class="delay-right">
          <span class="delay-days ${critica ? '' : 'orange'}">${dias}d</span>
          <a href="consulta.html" class="btn-action">Ver</a>
        </div>
      </div>
    `;
  }).join('');
}

/** Calcula a diferença em dias inteiros entre um timestamp Firestore e agora */
function calcularDias(timestamp) {
  if (!timestamp) return 0;
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24));
}
