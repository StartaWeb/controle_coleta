	let contadorColeta = JSON.parse(localStorage.getItem('contadorColeta')) || 1;

	document.getElementById('coletaForm').addEventListener('submit', function(e) {
	  e.preventDefault();

	  const cliente = document.getElementById('cliente').value.trim();
	  const solicitante = document.getElementById('solicitante').value.trim();
	  const atendente = document.getElementById('atendente').value.trim();
	  const protocolo = document.getElementById('protocolo').value.trim();
	  const notaFiscal = document.getElementById('notaFiscal').value.trim();
	  const ordemServico = document.getElementById('ordemServico').value.trim();
	  const prazo = document.getElementById('prazo').value;

	  const numeroColeta = `COLETA-${String(contadorColeta).padStart(4, '0')}`;
	  contadorColeta++;
	  localStorage.setItem('contadorColeta', JSON.stringify(contadorColeta));

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
		protocolo,
		notaFiscal,
		ordemServico,
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
		<p><strong>Número:</strong> ${numeroColeta}</p>
		<p><strong>Cliente:</strong> ${cliente}</p>
		<p><strong>Solicitante:</strong> ${solicitante}</p>
		<p><strong>Atendente:</strong> ${atendente}</p>
		<p><strong>Protocolo:</strong> ${protocolo}</p>
		<p><strong>Nota Fiscal:</strong> ${notaFiscal}</p>
		<p><strong>Ordem de Serviço:</strong> ${ordemServico}</p>
		<p><strong>Prazo:</strong> ${prazo}</p>
		<p><strong>Agendada em:</strong> ${dataHoraAgendamento}</p>
	  `;

	  document.getElementById('coletaForm').reset();
	});