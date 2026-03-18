document.getElementById('retiradaForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const notaFiscal = document.getElementById('notaFiscal').value.trim();
  const retirante = document.getElementById('retirante').value.trim();
  const dataRetirada = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  let coletas = JSON.parse(localStorage.getItem('coletas')) || [];

  // Busca apenas pelo número da nota fiscal
  let coleta = coletas.find(c => c.notaFiscal === notaFiscal);

  const resultado = document.getElementById('resultadoRetirada');

  if (!coleta) {
    resultado.innerHTML = `<p style="color:red;">Nota Fiscal não encontrada.</p>`;
    return;
  }

  if (coleta.status === "Realizada") {
    resultado.innerHTML = `<p style="color:orange;">Essa retirada já foi confirmada como realizada.</p>`;
    return;
  }

  coleta.status = "Realizada";
  coleta.dataRetirada = dataRetirada;
  coleta.retirante = retirante;

  localStorage.setItem('coletas', JSON.stringify(coletas));

  resultado.innerHTML = `
    <h2>Retirada Confirmada!</h2>
    <p><strong>Nota Fiscal:</strong> ${coleta.notaFiscal}</p>
    <p><strong>Cliente:</strong> ${coleta.cliente}</p>
    <p><strong>Retirante:</strong> ${retirante}</p>
    <p><strong>Data da Retirada:</strong> ${dataRetirada}</p>
  `;

  document.getElementById('retiradaForm').reset();
});