let contadorColeta = JSON.parse(localStorage.getItem('contadorColeta')) || 1;

document.getElementById('coletaForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const cliente = document.getElementById('cliente').value.trim();
  const solicitante = document.getElementById('solicitante').value.trim();
  const atendente = document.getElementById('atendente').value.trim();
  const numeroProtocolo = document.getElementById('protocolo').value.trim(); // ✅ agora salvo como numeroProtocolo
  const notaFiscal = document.getElementById('notaFiscal').value.trim();
  const observacao = document.getElementById('observacao').value.trim();
  const prazo = document.getElementById('prazo').value;

  // Número de coleta sequencial
  const numeroColeta = `COLETA-${String(contadorColeta).padStart(4, '0')}`;
  contadorColeta++;
  localStorage.setItem('contadorColeta', JSON.stringify(contadorColeta));

  // Ordem de serviço gerada automaticamente
  const numeroServico = gerarNumeroServico();

  const agora = new Date();
  const dataHoraAgendamento = agora.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const coleta = {
    cliente,
    solicitante,
    atendente,
    numeroProtocolo,   // ✅ salvo corretamente
    notaFiscal,
    numeroServico,     // ✅ gerado automaticamente
    observacao,
    prazo,
    numeroColeta,
    dataHoraAgendamento,
    status: "Agendada"
  };

  const coletas = JSON.parse(localStorage.getItem('coletas')) || [];
  coletas.push(coleta);
  localStorage.setItem('coletas', JSON.stringify(coletas));

  document.getElementById('confirmacao').innerHTML = `
    <h2>Coleta Agendada!</h2>
    <p><strong>Número da Coleta:</strong> ${numeroColeta}</p>
    <p><strong>Cliente:</strong> ${cliente}</p>
    <p><strong>Solicitante:</strong> ${solicitante}</p>
    <p><strong>Atendente:</strong> ${atendente}</p>
    <p><strong>Número de Protocolo:</strong> ${numeroProtocolo || '-'}</p>
    <p><strong>Nota Fiscal:</strong> ${notaFiscal}</p>
    <p><strong>Ordem de Serviço:</strong> ${numeroServico}</p>
    <p><strong>Observação:</strong> ${observacao}</p>
    <p><strong>Prazo:</strong> ${prazo}</p>
    <p><strong>Agendada em:</strong> ${dataHoraAgendamento}</p>
  `;

  document.getElementById('coletaForm').reset();
});

// Função para gerar número de serviço automaticamente
function gerarNumeroServico() {
  const agora = new Date();
  return (
    "SRV-" +
    agora.getFullYear().toString().slice(-2) +
    (agora.getMonth() + 1).toString().padStart(2, "0") +
    agora.getDate().toString().padStart(2, "0") +
    "-" +
    Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  );
}