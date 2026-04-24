// ============================================================
//  firebase-config.js — Configuração e helpers do Firestore
//  Sistema de Controle de Coleta - Ebenezer
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyA7K5x9Z96Zaswff7cz4DaazFlvyDd4jNg",
  authDomain: "ebenezer-coletas.firebaseapp.com",
  projectId: "ebenezer-coletas",
  storageBucket: "ebenezer-coletas.firebasestorage.app",
  messagingSenderId: "697358210840",
  appId: "1:697358210840:web:4ad486df9294443e5db06d",
  measurementId: "G-ZGXJ44551B"
};

// Inicializa o Firebase (safe: evita inicializar duas vezes)
if (!firebase.apps || firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// ─────────────────────────────────────────────
//  NORMALIZAÇÃO DE NF — Função central
//  Garante consistência em saves e buscas
// ─────────────────────────────────────────────

/**
 * Normaliza um número de NF/Orçamento:
 * Remove pontos, vírgulas, espaços e converte para string.
 * Ex: '12.345' → '12345' | '12,345' → '12345' | ' 12 345 ' → '12345'
 *
 * @param {string|number} nf - valor bruto digitado pelo usuário
 * @returns {string} NF normalizada, pronta para salvar ou buscar
 */
function normalizarNF(nf) {
  if (nf === null || nf === undefined || nf === '') return '';
  return String(nf).trim().replace(/[.,\s]/g, '');
}

// Exporta globalmente para uso em todas as páginas
window.normalizarNF = normalizarNF;

// ─────────────────────────────────────────────
//  SISTEMA DE TOASTS — Notificações profissionais
//  Substitui alert() por mensagens visuais não-bloqueantes
// ─────────────────────────────────────────────

/**
 * Exibe uma notificação toast não-bloqueante.
 *
 * @param {string} msg    - Mensagem a exibir
 * @param {'sucesso'|'erro'|'aviso'|'info'} tipo - Tipo visual
 * @param {number}  [duracao=4000] - Milissegundos até sumir
 */
function mostrarToast(msg, tipo = 'info', duracao = 4000) {
  // Injeta CSS uma única vez
  if (!document.getElementById('_toastStyle')) {
    const s = document.createElement('style');
    s.id = '_toastStyle';
    s.textContent = `
      #_toastContainer {
        position: fixed; bottom: 80px; right: 20px;
        z-index: 99999; display: flex; flex-direction: column;
        gap: 10px; pointer-events: none;
      }
      ._toast {
        min-width: 260px; max-width: 380px;
        padding: 14px 18px; border-radius: 14px;
        font-family: 'Inter', sans-serif; font-size: 14px;
        font-weight: 600; color: #fff; line-height: 1.4;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        pointer-events: auto; cursor: default;
        animation: _toastIn 0.3s cubic-bezier(.34,1.56,.64,1) forwards;
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      ._toast.sucesso { background: linear-gradient(135deg,#2e7d32,#43a047); }
      ._toast.erro    { background: linear-gradient(135deg,#c62828,#f50057); }
      ._toast.aviso   { background: linear-gradient(135deg,#e65100,#f9a825); color:#fff; }
      ._toast.info    { background: linear-gradient(135deg,#1565c0,#7b1fa2); }
      ._toast.saindo  { opacity: 0; transform: translateX(40px); }
      @keyframes _toastIn {
        from { opacity:0; transform: translateX(40px); }
        to   { opacity:1; transform: translateX(0); }
      }
    `;
    document.head.appendChild(s);
  }

  // Container persistente
  let container = document.getElementById('_toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = '_toastContainer';
    document.body.appendChild(container);
  }

  const icones = { sucesso: '\u2705', erro: '\u274C', aviso: '\u26A0\uFE0F', info: '\u2139\uFE0F' };
  const t = document.createElement('div');
  t.className = `_toast ${tipo}`;
  t.textContent = `${icones[tipo] || ''} ${msg}`;
  t.onclick = () => remover();
  container.appendChild(t);

  function remover() {
    t.classList.add('saindo');
    setTimeout(() => t.remove(), 420);
  }

  setTimeout(remover, duracao);
  return t;
}

window.mostrarToast = mostrarToast;

// ─────────────────────────────────────────────
//  SANITIZAÇÃO XSS — Proteção de conteúdo HTML
//  Sempre usar ao inserir dados do usuário via innerHTML
// ─────────────────────────────────────────────

/**
 * Escapa caracteres HTML perigosos em uma string.
 * Previne ataques XSS ao inserir dados do usuário via innerHTML.
 *
 * @param {*} str - Valor a sanitizar
 * @returns {string} String segura para uso em innerHTML
 *
 * @example
 * div.innerHTML = `<p>${sanitizarHTML(cliente.nome)}</p>`;
 */
function sanitizarHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

window.sanitizarHTML = sanitizarHTML;

// ─────────────────────────────────────────────
//  HELPERS — ETIQUETAS (Editar / Excluir)
// ─────────────────────────────────────────────

/**
 * Exclui uma etiqueta do Firestore pelo ID.
 */
async function excluirEtiqueta(id) {
  await db.collection('etiquetas').doc(id).delete();
}

/**
 * Atualiza campos de uma etiqueta existente.
 * Normaliza 'nf' caso seja atualizado.
 */
async function atualizarEtiqueta(id, dados) {
  mostrarStatusConexao(true);
  if (dados.nf !== undefined) dados.nf = normalizarNF(dados.nf);
  await db.collection('etiquetas').doc(id).update({
    ...dados,
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Exclui uma coleta do Firestore pelo ID.
 */
async function excluirColeta(id) {
  await db.collection('coletas').doc(id).delete();
}

/**
 * Exclui um fechamento do Firestore pelo ID.
 */
async function excluirFechamento(id) {
  await db.collection('fechamentos').doc(id).delete();
}


// ─────────────────────────────────────────────
//  INDICADOR DE CONEXÃO
// ─────────────────────────────────────────────
function mostrarStatusConexao(online) {
  let badge = document.getElementById('conexao-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'conexao-badge';
    badge.style.cssText = `
      position: fixed; bottom: 18px; right: 18px; z-index: 9999;
      padding: 8px 16px; border-radius: 20px; font-size: 13px;
      font-weight: 600; font-family: 'Inter', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.4s ease; cursor: default;
    `;
    document.body.appendChild(badge);
  }
  if (online) {
    badge.textContent = '🟢 Conectado ao banco';
    badge.style.background = 'rgba(139, 195, 74, 0.95)';
    badge.style.color = '#fff';
  } else {
    badge.textContent = '🔴 Sem conexão';
    badge.style.background = 'rgba(245, 0, 87, 0.95)';
    badge.style.color = '#fff';
  }
}

// ─────────────────────────────────────────────
//  HELPERS — COLETAS
// ─────────────────────────────────────────────

/**
 * Salva uma nova coleta no Firestore.
 * Retorna o ID do documento criado.
 */
async function salvarColeta(coleta) {
  mostrarStatusConexao(true);
  const docRef = await db.collection('coletas').add({
    ...coleta,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  });
  return docRef.id;
}

/**
 * Obtém o próximo número sequencial de coleta.
 * Usa um documento contador no Firestore.
 */
async function proximoNumeroColeta() {
  const contadorRef = db.collection('_contadores').doc('coletas');
  let numero = 1;
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(contadorRef);
    if (!doc.exists) {
      transaction.set(contadorRef, { atual: 1 });
      numero = 1;
    } else {
      numero = (doc.data().atual || 0) + 1;
      transaction.update(contadorRef, { atual: numero });
    }
  });
  return `COLETA-${String(numero).padStart(4, '0')}`;
}

/**
 * Atualiza campos de uma coleta existente.
 * @param {string} id - ID Firestore do documento
 * @param {object} dados - campos a atualizar
 */
async function atualizarColeta(id, dados) {
  mostrarStatusConexao(true);
  await db.collection('coletas').doc(id).update({
    ...dados,
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Escuta coletas em tempo real.
 * @param {function} callback - chamado com array de coletas sempre que houver mudança
 * @returns função para cancelar o listener
 */
function ouvirColetas(callback) {
  return db.collection('coletas')
    .orderBy('criadoEm', 'desc')
    .onSnapshot(
      (snapshot) => {
        mostrarStatusConexao(true);
        const coletas = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        callback(coletas);
      },
      (error) => {
        console.error('Erro ao escutar coletas:', error);
        mostrarStatusConexao(false);
      }
    );
}

/**
 * Busca coletas uma única vez (sem listener).
 */
async function carregarColetasOnce() {
  mostrarStatusConexao(true);
  const snapshot = await db.collection('coletas').orderBy('criadoEm', 'desc').get();
  return snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
}

// ─────────────────────────────────────────────
//  HELPERS — ETIQUETAS
// ─────────────────────────────────────────────

/**
 * Salva um registro de etiqueta gerada no Firestore.
 * Normaliza o campo 'nf' antes de salvar (sem pontos/vírgulas/espaços).
 */
async function salvarEtiqueta(etiqueta) {
  mostrarStatusConexao(true);
  const docRef = await db.collection('etiquetas').add({
    ...etiqueta,
    nf: normalizarNF(etiqueta.nf),   // sempre salva normalizado
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  });
  return docRef.id;
}

/**
 * Escuta etiquetas em tempo real.
 */
function ouvirEtiquetas(callback) {
  return db.collection('etiquetas')
    .orderBy('criadoEm', 'desc')
    .onSnapshot(
      (snapshot) => {
        const etiquetas = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        callback(etiquetas);
      },
      (error) => {
        console.error('Erro ao escutar etiquetas:', error);
        mostrarStatusConexao(false);
      }
    );
}

// ─────────────────────────────────────────────
//  HELPERS — FECHAMENTOS
// ─────────────────────────────────────────────

/**
 * Salva um novo fechamento no Firestore.
 * @param {object} dados - campos do fechamento
 * @returns {string} ID do documento criado
 */
async function salvarFechamento(dados) {
  mostrarStatusConexao(true);
  const docRef = await db.collection('fechamentos').add({
    ...dados,
    status: 'aguardando',
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  });
  return docRef.id;
}

/**
 * Atualiza campos de um fechamento existente.
 * @param {string} id - ID Firestore do documento
 * @param {object} dados - campos a atualizar (ex: status, obs)
 */
async function atualizarFechamento(id, dados) {
  mostrarStatusConexao(true);
  await db.collection('fechamentos').doc(id).update({
    ...dados,
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Escuta todos os fechamentos em tempo real (para aba de aprovação).
 */
function ouvirFechamentosAguardando(callback) {
  // Sem orderBy para evitar exigência de índice composto no Firestore
  // Ordenação feita no cliente após receber os dados
  return db.collection('fechamentos')
    .where('status', '==', 'aguardando')
    .onSnapshot(
      (snapshot) => {
        mostrarStatusConexao(true);
        const lista = snapshot.docs
          .map(doc => ({ _id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.criadoEm?.seconds ?? 0) - (a.criadoEm?.seconds ?? 0));
        setTimeout(() => mostrarStatusConexao(false), 3000);
        callback(lista);
      },
      (error) => {
        console.error('Erro ao escutar fechamentos:', error);
        mostrarStatusConexao(false);
      }
    );
}

/**
 * Escuta todos os fechamentos aprovados (para aba de consultas).
 */
function ouvirFechamentosAprovados(callback) {
  return db.collection('fechamentos')
    .where('status', '==', 'aprovado')
    .onSnapshot(
      (snapshot) => {
        mostrarStatusConexao(true);
        // Filtra nulos ou indefinidos de forma segura
        const lista = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        callback(lista);
      },
      (error) => {
        console.error('Erro ao escutar fechamentos aprovados:', error);
        mostrarStatusConexao(false);
      }
    );
}

/**
 * Escuta todos os fechamentos do usuário logado (qualquer status).
 */
function ouvirMeusFechamentos(uid, callback) {
  // Sem orderBy para evitar exigência de índice composto no Firestore
  // Ordenação feita no cliente
  return db.collection('fechamentos')
    .where('uid', '==', uid)
    .onSnapshot(
      (snapshot) => {
        mostrarStatusConexao(true);
        const lista = snapshot.docs
          .map(doc => ({ _id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.criadoEm?.seconds ?? 0) - (a.criadoEm?.seconds ?? 0));
        setTimeout(() => mostrarStatusConexao(false), 3000);
        callback(lista);
      },
      (error) => {
        console.error('Erro ao escutar meus fechamentos:', error);
        mostrarStatusConexao(false);
      }
    );
}

/**
 * Busca uma etiqueta pelo número NF/Orçamento (para importação no fechamento).
 * Normaliza a NF antes de buscar.
 */
async function buscarEtiquetaPorNF(nf) {
  const nfNorm = normalizarNF(nf);
  mostrarStatusConexao(true);

  // 1ª tentativa: buscar etiqueta pelo campo nf (NF ou orçamento original)
  const snap1 = await db.collection('etiquetas')
    .where('nf', '==', nfNorm)
    .limit(1)
    .get();

  if (!snap1.empty) {
    setTimeout(() => mostrarStatusConexao(false), 2000);
    const doc = snap1.docs[0];
    return { _id: doc.id, ...doc.data() };
  }

  // 2ª tentativa: buscar fechamento cujo campo 'orcamento' bate com o input
  // e retornar a etiqueta vinculada (etiquetaId)
  const snap2 = await db.collection('fechamentos')
    .where('orcamento', '==', nfNorm)
    .limit(1)
    .get();

  if (!snap2.empty) {
    const fech = snap2.docs[0].data();
    if (fech.etiquetaId) {
      const etDoc = await db.collection('etiquetas').doc(fech.etiquetaId).get();
      if (etDoc.exists) {
        setTimeout(() => mostrarStatusConexao(false), 2000);
        return { _id: etDoc.id, ...etDoc.data() };
      }
    }
    // Se não houver etiquetaId, retorna sem dados de caixa (fallback mínimo)
    setTimeout(() => mostrarStatusConexao(false), 2000);
    return {
      _id: null,
      nf:          fech.orcamento,
      tipoDoc:     fech.tipoDoc  || 'orcamento',
      cliente:     fech.cliente,
      totalCaixas: fech.totalCaixas,
      kg:          fech.kg,
      caixas:      fech.caixas || [],
      dimensoes:   fech.dimensoes || [],
      entregaTipo: 'transportadora',
      transportadora: fech.nomeTransportadora || ''
    };
  }

  // 3ª tentativa: buscar fechamento pela NF Final aprovada
  const snap3 = await db.collection('fechamentos')
    .where('nfFinal', '==', nfNorm)
    .limit(1)
    .get();

  if (!snap3.empty) {
    const fech = snap3.docs[0].data();
    if (fech.etiquetaId) {
      const etDoc = await db.collection('etiquetas').doc(fech.etiquetaId).get();
      if (etDoc.exists) {
        setTimeout(() => mostrarStatusConexao(false), 2000);
        return { _id: etDoc.id, ...etDoc.data() };
      }
    }
  }

  setTimeout(() => mostrarStatusConexao(false), 2000);
  return null;
}

/**
 * Verifica se já existe uma etiqueta com o número de NF/Orçamento informado.
 * Normaliza a NF antes de buscar para evitar duplicatas por formatação.
 */
async function checarNFExistente(nf) {
  if (!nf) return false;
  const nfNorm = normalizarNF(nf);
  mostrarStatusConexao(true);
  const snapshot = await db.collection('etiquetas')
    .where('nf', '==', nfNorm)
    .limit(1).get();
  setTimeout(() => mostrarStatusConexao(false), 2000);
  return !snapshot.empty;
}

/**
 * Verifica se já existe um fechamento (pendente ou aprovado) para o orçamento/NF.
 * Normaliza antes de buscar para evitar duplicatas por formatação.
 */
async function checarFechamentoExistente(orcamento) {
  if (!orcamento) return false;
  const orcNorm = normalizarNF(orcamento);
  mostrarStatusConexao(true);
  const snapshot = await db.collection('fechamentos')
    .where('orcamento', '==', orcNorm)
    .limit(1).get();
  setTimeout(() => mostrarStatusConexao(false), 2000);
  return !snapshot.empty;
}

/**
 * Busca um fechamento aprovado pelo número da NF Final.
 */
async function buscarFechamentoPorNFFinal(nf) {
  // Normaliza: remove pontos, vírgulas e espaços para garantir correspondência
  const nfClean = String(nf).trim().replace(/[.,\s]/g, '');
  mostrarStatusConexao(true);
  const snapshot = await db.collection('fechamentos')
    .where('nfFinal', '==', nfClean)
    .where('status', '==', 'aprovado')
    .limit(1)
    .get();
  setTimeout(() => mostrarStatusConexao(false), 2000);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { _id: doc.id, ...doc.data() };
}

/**
 * Registra um log de alteração no banco de dados.
 */
async function registrarLog(usuario, acao, documentoId, dados = {}) {
  try {
    await db.collection('logs').add({
      usuario: usuario || 'Sistema',
      acao: acao,
      documentoId: documentoId,
      dados: dados,
      data: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('Erro ao registrar log:', err);
  }
}

/**
 * Escuta todos os fechamentos (para perfis admin e whatsapp).
 */
function ouvirTodosFechamentos(callback) {
  return db.collection('fechamentos')
    .orderBy('criadoEm', 'desc')
    .onSnapshot(
      (snapshot) => {
        mostrarStatusConexao(true);
        const lista = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        callback(lista);
      },
      (error) => {
        console.error('Erro ao escutar todos os fechamentos:', error);
        mostrarStatusConexao(false);
      }
    );
}

