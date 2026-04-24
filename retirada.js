// ============================================================
//  retirada.js — Integrado com Firebase Firestore
// ============================================================

document.getElementById('retiradaForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const btnSubmit = this.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Buscando...';

  const notaFiscal  = document.getElementById('notaFiscal').value.trim();
  const retirante   = document.getElementById('retirante').value.trim();
  const resultado   = document.getElementById('resultadoRetirada');

  resultado.innerHTML = '<p style="color:#9c27b0;">⏳ Buscando coleta no banco de dados...</p>';

  try {
    // Busca a coleta pela Nota Fiscal no Firestore
    const snapshot = await db.collection('coletas')
      .where('notaFiscal', '==', notaFiscal)
      .limit(1)
      .get();

    if (snapshot.empty) {
      resultado.innerHTML = `<p style="color:red;">❌ Nota Fiscal <strong>${notaFiscal}</strong> não encontrada.</p>`;
      return;
    }

    const doc    = snapshot.docs[0];
    const coleta = { _id: doc.id, ...doc.data() };

    if (coleta.status === 'Realizada') {
      resultado.innerHTML = `
        <p style="color:orange;">⚠️ Esta coleta já foi confirmada como realizada.</p>
        <p><strong>Retirante:</strong> ${coleta.retirante}</p>
        <p><strong>Data da Retirada:</strong> ${coleta.dataRetirada}</p>
      `;
      return;
    }

    // Atualiza status no Firestore
    const dataRetirada = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    await atualizarColeta(coleta._id, {
      status: 'Realizada',
      retirante,
      dataRetirada
    });

    resultado.innerHTML = `
      <h2>✅ Retirada Confirmada!</h2>
      <p><strong>Nota Fiscal:</strong> ${coleta.notaFiscal}</p>
      <p><strong>Cliente:</strong> ${coleta.cliente}</p>
      <p><strong>Retirante:</strong> ${retirante}</p>
      <p><strong>Data da Retirada:</strong> ${dataRetirada}</p>
      <p style="color:#4caf50; font-weight:700; margin-top:12px;">💾 Status atualizado no banco de dados!</p>
    `;

    document.getElementById('retiradaForm').reset();

  } catch (error) {
    console.error('Erro ao confirmar retirada:', error);
    mostrarStatusConexao(false);
    resultado.innerHTML = `<p style="color:red;">❌ Erro: ${error.message}</p>`;
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Confirmar Retirada';
  }
});