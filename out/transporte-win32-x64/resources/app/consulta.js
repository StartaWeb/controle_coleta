function carregarColetas() {
  return JSON.parse(localStorage.getItem('coletas')) || [];
}

function exibirColetas(lista) {
  const container = document.getElementById('listaColetas');
  container.innerHTML = '';

  if (lista.length === 0) {
    container.innerHTML = '<p>Nenhuma coleta encontrada.</p>';
    return;
  }

  lista.forEach(coleta => {
    const div = document.createElement('div');
    div.className = 'coleta-card';
    div.innerHTML = `
      <h3>${coleta.numeroColeta}</h3>
      <p><strong>Cliente:</strong> ${coleta.cliente}</p>
      <p><strong>Solicitante:</strong> ${coleta.solicitante}</p>
      <p><strong>Atendente:</strong> ${coleta.atendente}</p>
      <p><strong>Nota Fiscal:</strong> ${coleta.notaFiscal || '-'}</p>
      <p><strong>Prazo:</strong> ${coleta.prazo}</p>
      <p><strong>Agendada em:</strong> ${coleta.dataHoraAgendamento || '-'}</p>
      <p><strong>Status:</strong> ${coleta.status}</p>
      <p><strong>Retirante:</strong> ${coleta.retirante || '-'}</p>
      <p><strong>Data da Retirada:</strong> ${coleta.dataRetirada || '-'}</p>
    `;
    container.appendChild(div);
  });
}

function filtrarColetas() {
  const clienteFiltro = document.getElementById('filtroCliente').value.toLowerCase();
  const numeroFiltro = document.getElementById('filtroNumero').value.toLowerCase();
  const nfFiltro = document.getElementById('filtroNF').value.toLowerCase();
  const statusFiltro = document.getElementById('filtroStatus').value;

  const coletas = carregarColetas();

  const filtradas = coletas.filter(coleta => {
    const matchCliente = coleta.cliente.toLowerCase().includes(clienteFiltro);
    const matchNumero = coleta.numeroColeta.toLowerCase().includes(numeroFiltro);
    const matchNF = coleta.notaFiscal?.toLowerCase().includes(nfFiltro);
    const matchStatus = statusFiltro === '' || coleta.status === statusFiltro;
    return matchCliente && matchNumero && matchNF && matchStatus;
  });

  exibirColetas(filtradas);
}

function exportarParaExcel() {
  const coletas = carregarColetas();

  if (coletas.length === 0) {
    alert("Nenhuma coleta para exportar.");
    return;
  }

  const headers = [
    "Número da Coleta",
    "Cliente",
    "Solicitante",
    "Atendente",
    "Nota Fiscal",
    "Prazo",
    "Data/Hora do Agendamento",
    "Status",
    "Retirante",
    "Data/Hora da Retirada"
  ];

  const linhas = coletas.map(c => [
    c.numeroColeta,
    c.cliente,
    c.solicitante,
    c.atendente,
    c.notaFiscal || "",
    c.prazo,
    c.dataHoraAgendamento || "",
    c.status,
    c.retirante || "",
    c.dataRetirada || ""
  ]);

  const csvContent = [headers, ...linhas]
    .map(linha => linha.map(valor => `"${valor}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'relatorio_coletas.csv';
  a.click();
  URL.revokeObjectURL(url);
}

window.onload = () => {
  exibirColetas(carregarColetas());
};