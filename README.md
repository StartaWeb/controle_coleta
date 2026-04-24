<div align="center">
  <img src="EbenezerTitulo.png" alt="Ebenezer Logo" width="300" />
</div>

<h1 align="center">📦 Sistema de Controle de Coleta - Ebenezer</h1>

<p align="center">
  <strong>Gerador de etiquetas inteligente, agendamento e rastreio de coletas gerenciado de forma ágil pelo navegador.</strong>
</p>

<p align="center">
  <a href="https://startaweb.github.io/controle_coleta/" target="_blank">
    <img src="https://img.shields.io/badge/Acessar-Aplicação_Online-0078d7?style=for-the-badge&logo=github" alt="Acessar Aplicação" />
  </a>
</p>

## 📖 Sobre o Projeto

O **Sistema de Controle de Coleta Ebenezer** é uma aplicação web moderna, projetada para gerenciar processos de logística de coletas. Desenvolvida nativamente em HTML, CSS3 Premium e Vanilla JS, ela proporciona uma usabilidade de ponta sem a necessidade de um backend complexo, rodando de forma estática, rápida e responsiva - inclusive compatível também como uma aplicação Desktop isolada através do framework Electron.

### ✨ Principais Funcionalidades

- 📑 **Gerador de Etiquetas Inteligente:** Emita etiquetas numeradas automaticamente preenchendo as quantidades de produtos por caixa. Conta com suporte à impressão meticulosamente formatada para etiquetas na folha A4 (evitando distorções nas bordas).
- 🗓️ **Agendamento de Coleta:** Cadastre datas, solicitantes e ordens de serviço.
- 🔍 **Consulta de Coleta Dinâmica:** Pesquisa rápida em tempo real por cliente, Nota Fiscal ou Status. Filtros interativos e exportação direta para relatórios CSV consolidado (Excel).
- ✅ **Confirmação de Retirada:** Valide o status e o retirante das coletas em poucos segundos.

---

## 🚀 Tecnologias e Arquitetura

Este projeto foi construído focando em alta performance e portabilidade máxima:

- **Frontend Core:** HTML5, CSS3 (Design System exclusivo baseado na tipografia "Inter"), JavaScript (ES6+).
- **Desktop Wrapper:** [Electron](https://www.electronjs.org/) e Electron Forge para build executável local.
- **Deploy Continuo:** GitHub Pages (Serveless Web App).
- **Armazenamento de Estado:** Operações *client-side* dinâmicas focadas em LocalStorage / Manipulação de DOM stateful.

## 📂 Estrutura de Arquivos

```text
/controle_coleta
├── index.html            # Gerador principal de etiquetas (Home)
├── agendamento.html      # Tela de marcação de coletas
├── consulta.html         # Painel de busca e exportação CSV
├── retirada.html         # Tela de confirmações de retirada
├── style.css             # Design System Premium (Estilos globais + Regras de impressão)
├── *.js                  # Scripts modulares de componentes
└── main.js & package.*   # Configuração e entrada do container Electron App
```

## 🛠️ Como Executar

Você pode acessar, testar e utilizar o sistema através de duas formas distintas:

### 1️⃣ Via Web (Navegador) - Acesso Universal Rápido
**Basta clicar no botão no topo do README ou acessar: [Live na GitHub Pages](https://startaweb.github.io/controle_coleta/)!**
A aplicação e as impressões de etiqueta funcionam perfeitamente na nuvem.

### 2️⃣ Via Desktop (Aplicação Local Computador)
Se desejar rodar o sistema diretamente como um software desktop isolado:

```bash
# Clone este repositório para o seu computador
git clone https://github.com/StartaWeb/controle_coleta.git

# Acesse a pasta raiz
cd controle_coleta

# Instale os módulos necessários do framework
npm install

# Inicie a aplicação no formato Janela
npm start
```

## 👨‍💻 Autor e Direitos

Arquitetura e Desenvolvimento conduzido por **Roberto Ursine | StartaWeb**.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/robertoursinedejesus/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/5511982856216)

<p align="center">Todos os direitos reservados © 2026 - Controle de Coleta Ebenezer</p>
