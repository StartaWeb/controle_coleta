document.getElementById('retiradaForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const numero = document.getElementById('numeroColeta').value.trim();
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
  let coleta = coletas.find(c => c.numeroColeta === numero);

  const resultado = document.getElementById('resultadoRetirada');

  if (!coleta) {
    resultado.innerHTML = `<p style="color:red;">Coleta não encontrada.</p>`;
    return;
  }

  if (coleta.status === "Realizada") {
    resultado.innerHTML = `<p style="color:orange;">Essa coleta já foi confirmada como realizada.</p>`;
    return;
  }

  coleta.status = "Realizada";
  coleta.dataRetirada = dataRetirada;
  coleta.retirante = retirante;

  localStorage.setItem('coletas', JSON.stringify(coletas));

  resultado.innerHTML = `
    <h2>Retirada Confirmada!</h2>
    <p><strong>Número:</strong> ${coleta.numeroColeta}</p>
    <p><strong>Cliente:</strong> ${coleta.cliente}</p>
    <p><strong>Retirante:</strong> ${retirante}</p>
    <p><strong>Data da Retirada:</strong> ${dataRetirada}</p>
  `;

  document.getElementById('retiradaForm').reset();
});