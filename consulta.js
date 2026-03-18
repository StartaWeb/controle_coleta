function carregarColetas() {
  return JSON.parse(localStorage.getItem('coletas')) || [];
}

function habilitarEdicao(numeroColeta) {
  const div = document.getElementById(`coleta-${numeroColeta}`);
  if (!div) return;

  div.querySelectorAll("[data-campo]").forEach(el => {
    const campo = el.getAttribute("data-campo");
    const valor = el.textContent.split(":")[1]?.trim() || "";
    el.innerHTML = `<label>${campo}: <input type="text" id="edit-${campo.toLowerCase()}-${numeroColeta}" value="${valor}"></label>`;
  });

  const btnSalvar = div.querySelector(".btn-salvar");
  if (btnSalvar) btnSalvar.style.display = "inline-block";
}

function editarColeta(numeroColeta) {
  const coletas = carregarColetas();
  const index = coletas.findIndex(c => String(c.numeroColeta) === String(numeroColeta));
  if (index === -1) return;

  const coleta = coletas[index];

  coleta.cliente = document.getElementById(`edit-cliente-${numeroColeta}`).value.trim();
  coleta.numeroProtocolo = document.getElementById(`edit-numeroprotocolo-${numeroColeta}`)?.value.trim() || coleta.numeroProtocolo;
  coleta.notaFiscal = document.getElementById(`edit-notafiscal-${numeroColeta}`)?.value.trim() || coleta.notaFiscal;
  coleta.observacao = document.getElementById(`edit-observacao-${numeroColeta}`)?.value.trim() || coleta.observacao;

  localStorage.setItem('coletas', JSON.stringify(coletas));
  alert("Coleta atualizada!");
  exibirColetas(coletas);
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
    div.id = `coleta-${coleta.numeroColeta}`;

    div.innerHTML = `
      <h3>${coleta.numeroColeta}</h3>
      <p data-campo="cliente">Cliente: ${coleta.cliente}</p>
      <p data-campo="numeroprotocolo">Número de Protocolo: ${coleta.numeroProtocolo || '-'}</p>
      <p data-campo="notafiscal">Nota Fiscal: ${coleta.notaFiscal || '-'}</p>
      <p data-campo="observacao">Observação: ${coleta.observacao || '-'}</p>
      <p><strong>Prazo:</strong> ${coleta.prazo}</p>
      <p><strong>Agendada em:</strong> ${coleta.dataHoraAgendamento || '-'}</p>
      <p><strong>Status:</strong> ${coleta.status}</p>
      <p><strong>Retirante:</strong> ${coleta.retirante || '-'}</p>
      <p><strong>Data da Retirada:</strong> ${coleta.dataRetirada || '-'}</p>
      <button class="btn-editar" onclick="habilitarEdicao('${coleta.numeroColeta}')">Editar</button>
      <button class="btn-salvar" style="display:none" onclick="editarColeta('${coleta.numeroColeta}')">Salvar Alterações</button>
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
    const matchCliente = (coleta.cliente?.toLowerCase() || "").includes(clienteFiltro);
    const matchNumero = (String(coleta.numeroColeta).toLowerCase() || "").includes(numeroFiltro);
    const matchNF = nfFiltro === '' || (coleta.notaFiscal?.toLowerCase().includes(nfFiltro));
    const matchStatus = statusFiltro === '' || coleta.status === statusFiltro;
    return matchCliente && matchNumero && matchNF && matchStatus;
  });

  exibirColetas(filtradas);
}

// Função de exportação para CSV
function exportarParaCSV() {
  const coletas = carregarColetas();
  if (coletas.length === 0) {
    alert("Nenhuma coleta para exportar.");
    return;
  }

  const cabecalho = Object.keys(coletas[0]).join(";");
  const linhas = coletas.map(c => Object.values(c).join(";"));
  const csv = [cabecalho, ...linhas].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "coletas.csv";
  a.click();

  URL.revokeObjectURL(url);
}

window.onload = () => {
  exibirColetas(carregarColetas());
};