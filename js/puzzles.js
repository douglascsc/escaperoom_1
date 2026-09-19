'use strict';
/*
 * puzzles.js — conteúdo e lógica de cada sala.
 *
 * Cada sala expõe: render(state) -> HTML da sala, e init(container) -> liga os
 * eventos depois que o HTML foi inserido no DOM. Quando uma sala já foi
 * resolvida, render() devolve automaticamente a "tela de sala resolvida"
 * (ver renderSolvedView), o que também garante que recarregar a página no
 * meio do jogo não perde o progresso.
 *
 * IMPORTANTE (ver README, seção "Como alterar respostas"): as respostas de
 * cada desafio ficam claramente marcadas abaixo com comentários "RESPOSTA:".
 */
window.App = window.App || {};

(function () {

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderSolvedView(room) {
    const item = room.item;
    return `
      <div class="room room-solved">
        <div class="solved-banner">
          <p class="solved-kicker">✅ DESAFIO CONCLUÍDO</p>
          <h2 class="solved-title">${room.title}</h2>
          <p class="solved-text">${room.solvedText}</p>
          ${item ? `
          <div class="item-card">
            <span class="item-card-icon">${item.icone}</span>
            <div>
              <p class="item-card-name">${item.nome}</p>
              <p class="item-card-desc">${item.descricao}</p>
            </div>
          </div>` : ''}
          ${room.fragment ? `
          <div class="fragment-card">
            <span class="fragment-label">Fragmento do código final</span>
            <span class="fragment-value">${room.fragment}</span>
          </div>` : ''}
          <button type="button" class="btn btn-primary" data-action="continue-room" data-room="${room.id}">Prosseguir →</button>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------------
  // SALA 01 — HTML
  // ---------------------------------------------------------------------
  const roomHTML = {
    id: 'html',
    label: 'SALA 01 — O CÓDIGO ESCONDIDO',
    title: '🔐 SALA 01 — O CÓDIGO ESCONDIDO',
    estimatedTime: '5–7 min',
    concepts: ['Estrutura HTML', 'Comentários (<!-- -->)', 'Inspeção de elementos (DevTools)'],
    solvedText: 'Você encontrou o comentário escondido no relatório do sistema e destravou o terminal.',
    fragment: '7',
    item: { id: 'chave-mestra', nome: '🔑 Chave Mestra', icone: '🔑', descricao: 'Extraída do terminal do laboratório. Guarde-a — talvez precise dela depois.' },
    // RESPOSTA: senha do terminal
    answer: '7392',
    hints: [
      'Nem tudo que existe em uma página precisa estar visível. Alguns objetos da sala guardam arquivos — abra todos.',
      'Um dos arquivos que você abre é um relatório de sistema. Ferramentas de desenvolvedor (botão direito → Inspecionar, ou F12) mostram o que existe por trás do texto exibido.',
      'Procure por comentários no código-fonte do relatório — eles começam com <!-- e terminam com -->. Existe mais de um número escrito por aí; só um deles é a senha atual.'
    ],
    render: function (state) {
      if (state.solvedPuzzles.includes('html')) return renderSolvedView(roomHTML);
      return `
      <div class="room">
        <p class="room-kicker">SALA 01</p>
        <h2 class="room-title">🔐 O Código Escondido</h2>
        <div class="room-narrative">
          <p>&gt; O terminal principal está bloqueado.</p>
          <p>&gt; Existe uma senha escondida no sistema.</p>
          <p>&gt; O problema é que ela não aparece na interface.</p>
        </div>

        <div class="objects-grid" role="group" aria-label="Objetos da sala">
          <button type="button" class="object-btn" data-object="computador">🖥️<span>Computador</span></button>
          <button type="button" class="object-btn" data-object="pasta">📁<span>Pasta</span></button>
          <button type="button" class="object-btn" data-object="documento">📄<span>Documento</span></button>
          <button type="button" class="object-btn" data-object="lixeira">🗑️<span>Lixeira</span></button>
          <button type="button" class="object-btn" data-object="terminal">💻<span>Terminal</span></button>
        </div>

        <p class="room-tip">💭 Um relatório de sistema pode conter mais informação do que a tela mostra. Ferramentas de desenvolvedor do navegador (botão direito → Inspecionar) ajudam a enxergar o que está por trás da interface.</p>

        <div id="html-detail" class="detail-panel hidden" aria-live="polite"></div>

        <div id="html-terminal" class="terminal-panel hidden">
          <p class="terminal-label">SISTEMA BLOQUEADO — DIGITE A SENHA</p>
          <form id="html-form" class="field-row" autocomplete="off">
            <label class="sr-only" for="html-senha">Senha do terminal</label>
            <input id="html-senha" name="senha" type="text" inputmode="numeric" placeholder="senha" aria-label="Senha do terminal">
            <button type="submit" class="btn btn-primary">ENTRAR</button>
          </form>
          <p id="html-feedback" class="feedback" role="status"></p>
        </div>
      </div>`;
    },
    init: function (container) {
      const detail = container.querySelector('#html-detail');
      const terminal = container.querySelector('#html-terminal');
      const form = container.querySelector('#html-form');
      const input = container.querySelector('#html-senha');
      const feedback = container.querySelector('#html-feedback');

      const contents = {
        computador: '<p class="file-name">🖥️ Estação de trabalho</p><p>Tela de bloqueio ativa. Nenhum dado visível neste terminal físico.</p>',
        pasta: `
          <p class="file-name">📁 relatorios/relatorio_seguranca.log</p>
          <pre class="file-body">Sistema reiniciado às 02:14.
Nenhuma falha crítica detectada.
Rotina de verificação concluída.
<!-- senha temporária: 7392 -->
Backup enviado ao servidor secundário.</pre>`,
        documento: `
          <p class="file-name">📄 memorando_interno.txt</p>
          <pre class="file-body">MEMORANDO INTERNO
Para: Equipe Técnica
Assunto: Segurança de acesso

Lembrem-se: nunca usar códigos óbvios como 0000 ou 1234 como
senha temporária. Este memorando não contém a senha atual.</pre>`,
        lixeira: `
          <p class="file-name">🗑️ Lixeira</p>
          <pre class="file-body">Rascunho descartado antes de ser usado.
<!-- rascunho: 1111 (nunca chegou a ser ativado) --></pre>`,
        terminal: null
      };

      container.querySelectorAll('.object-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const obj = btn.dataset.object;
          App.Game.playSound('click');
          if (obj === 'terminal') {
            terminal.classList.remove('hidden');
            detail.classList.add('hidden');
            input.focus();
            return;
          }
          detail.innerHTML = contents[obj];
          detail.classList.remove('hidden');
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const value = input.value.trim();
        if (value === roomHTML.answer) {
          App.Game.playSound('success');
          feedback.textContent = '✔ Acesso concedido. Porta destravada.';
          feedback.className = 'feedback feedback-success';
          App.Game.completeRoom('html');
        } else {
          App.Game.playSound('error');
          App.Game.registerMistake('html');
          feedback.textContent = '✖ Senha incorreta. Tentativa registrada.';
          feedback.className = 'feedback feedback-error';
          input.select();
        }
      });
    }
  };

  // ---------------------------------------------------------------------
  // SALA 02 — CSS
  // ---------------------------------------------------------------------
  const roomCSS = {
    id: 'css',
    label: 'SALA 02 — A INTERFACE INVISÍVEL',
    title: '🎨 SALA 02 — A INTERFACE INVISÍVEL',
    estimatedTime: '5–7 min',
    concepts: ['Propriedades color/background', 'display vs. visibility', 'Classes e IDs', 'Inspeção de estilos computados'],
    solvedText: 'Você encontrou o texto camuflado no painel de status: a cor do texto era igual à do fundo.',
    fragment: '3',
    item: { id: 'fragmento-css', nome: '🧩 Fragmento de Código', icone: '🧩', descricao: 'Um trecho de CSS arrancado do painel de status.' },
    // RESPOSTA: código escondido por CSS
    answer: '4816',
    hints: [
      'Nem tudo que existe em uma página precisa estar visível. Uma cor de texto pode estar "camuflada" propositalmente.',
      'Tente selecionar todo o conteúdo da tela (Ctrl+A) ou clique com o botão direito em cima do painel e escolha "Inspecionar".',
      'Procure, no painel de estilos do DevTools, por uma classe CSS cuja propriedade color é igual à propriedade background. O texto está lá, só não aparece.'
    ],
    render: function (state) {
      if (state.solvedPuzzles.includes('css')) return renderSolvedView(roomCSS);
      return `
      <div class="room">
        <p class="room-kicker">SALA 02</p>
        <h2 class="room-title">🎨 A Interface Invisível</h2>
        <div class="room-narrative">
          <p>&gt; O sistema abriu uma nova sala.</p>
          <p>&gt; Há uma mensagem escondida nesta interface.</p>
          <p>&gt; Você consegue encontrá-la?</p>
        </div>

        <div class="css-panel" aria-label="Painel de status do sistema">
          <p class="css-line">Painel de status — Laboratório 4</p>
          <p class="css-line css-ok">Status: Operacional</p>
          <p class="css-line css-ghost" id="css-ghost">CÓDIGO: 0000</p>
          <p class="css-line css-mensagem-oculta" id="css-secret">CÓDIGO: 4816</p>
          <p class="css-line">Nenhuma anomalia crítica foi detectada pelos sensores.</p>
          <p class="css-line">Próxima verificação automática em 12 minutos.</p>
        </div>

        <p class="room-tip">💭 Nem tudo que existe nesta tela está sendo mostrado a olho nu. Talvez valha a pena tentar "pegar" todo o conteúdo da página de uma vez.</p>

        <form id="css-form" class="field-row" autocomplete="off">
          <label class="sr-only" for="css-codigo">Código secreto</label>
          <input id="css-codigo" name="codigo" type="text" placeholder="código" aria-label="Código secreto">
          <button type="submit" class="btn btn-primary">DESBLOQUEAR</button>
        </form>
        <p id="css-feedback" class="feedback" role="status"></p>
      </div>`;
    },
    init: function (container) {
      const form = container.querySelector('#css-form');
      const input = container.querySelector('#css-codigo');
      const feedback = container.querySelector('#css-feedback');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const value = input.value.trim();
        if (value === roomCSS.answer) {
          App.Game.playSound('success');
          feedback.textContent = '✔ Mensagem decifrada. Porta destravada.';
          feedback.className = 'feedback feedback-success';
          App.Game.completeRoom('css');
        } else {
          App.Game.playSound('error');
          App.Game.registerMistake('css');
          feedback.textContent = value
            ? '✖ Código incorreto. Esse número não é o que está escondido no painel.'
            : '✖ Digite um código antes de tentar desbloquear.';
          feedback.className = 'feedback feedback-error';
        }
      });
    }
  };

  // ---------------------------------------------------------------------
  // SALA 03 — JAVASCRIPT
  // ---------------------------------------------------------------------
  // RESPOSTA: usuário e senha do sistema de autenticação legado (convenção do usuário padrão do MySQL).
  function verificarAcessoSistema(usuario, senha) {
    const USUARIO_ESPERADO = 'root';
    const SENHA_ESPERADA = '';
    return usuario.trim().toLowerCase() === USUARIO_ESPERADO && senha.trim() === SENHA_ESPERADA;
  }

  const roomJS = {
    id: 'js',
    label: 'SALA 03 — O MECANISMO DE SEGURANÇA',
    title: '⚙️ SALA 03 — O MECANISMO DE SEGURANÇA',
    estimatedTime: '7–10 min',
    concepts: ['Variáveis e comparação', 'Condicionais (if)', 'Funções', 'Console do navegador', 'Credenciais padrão (boas práticas de segurança)'],
    solvedText: 'Você percebeu que o painel seguia a mesma convenção do usuário padrão do MySQL: root, sem senha.',
    fragment: '9',
    item: { id: 'pendrive', nome: '💾 Pendrive', icone: '💾', descricao: 'Encontrado conectado ao terminal. Contém um fragmento do protocolo final.' },
    answer: 'root (senha em branco)',
    hints: [
      'Sistemas de administração antigos, mal configurados, costumam usar convenções conhecidas de outros sistemas — releia o log de inicialização exibido na tela.',
      'Pense no usuário padrão mais famoso de uma instalação recém-feita de um banco de dados MySQL.',
      'Usuário: root — Senha: deixe o campo em branco e clique em ENTRAR.'
    ],
    render: function (state) {
      if (state.solvedPuzzles.includes('js')) return renderSolvedView(roomJS);
      return `
      <div class="room">
        <p class="room-kicker">SALA 03</p>
        <h2 class="room-title">⚙️ O Mecanismo de Segurança</h2>
        <div class="room-narrative">
          <p>&gt; Um painel de autenticação legado ainda está ativo neste setor.</p>
          <p>&gt; Ele não foi feito para ser fácil de usar — mas alguém deixou pistas.</p>
        </div>

        <pre class="terminal-log">[BOOT] auth.module carregado...
[BOOT] verificarAcessoSistema() pronta.
[INFO] Este painel de autenticação legado segue a mesma convenção
       do usuário padrão do MySQL.
[INFO] painel de autenticação aguardando entrada.</pre>

        <form id="js-form" class="auth-form" autocomplete="off">
          <p class="terminal-label">SISTEMA DE AUTENTICAÇÃO</p>
          <label for="js-usuario">USUÁRIO</label>
          <input id="js-usuario" name="usuario" type="text" autocomplete="off">
          <label for="js-senha">SENHA</label>
          <input id="js-senha" name="senha" type="text" autocomplete="off">
          <button type="submit" class="btn btn-primary">ENTRAR</button>
        </form>
        <p id="js-feedback" class="feedback" role="status"></p>
      </div>`;
    },
    init: function (container) {
      console.info('%c[DEBUG] Autenticação legada ativa — mesma convenção do usuário padrão do MySQL.', 'color:#2ee6a6');
      const form = container.querySelector('#js-form');
      const user = container.querySelector('#js-usuario');
      const pass = container.querySelector('#js-senha');
      const feedback = container.querySelector('#js-feedback');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (verificarAcessoSistema(user.value, pass.value)) {
          App.Game.playSound('success');
          feedback.textContent = '✔ Acesso concedido pelo sistema legado.';
          feedback.className = 'feedback feedback-success';
          App.Game.completeRoom('js');
        } else {
          App.Game.playSound('error');
          App.Game.registerMistake('js');
          feedback.textContent = '✖ Usuário ou senha incorretos.';
          feedback.className = 'feedback feedback-error';
        }
      });
    }
  };

  // ---------------------------------------------------------------------
  // SALA 04 — BANCO DE DADOS / SQL
  // ---------------------------------------------------------------------
  const roomDB = {
    id: 'db',
    label: 'SALA 04 — O BANCO DE DADOS',
    title: '🗄️ SALA 04 — O BANCO DE DADOS',
    estimatedTime: '7–10 min',
    concepts: ['Tabelas e registros', 'SELECT', 'WHERE', 'Interpretação de consultas SQL'],
    solvedText: "Você filtrou a tabela usuarios por perfil = 'admin' e descobriu o que aconteceu com o administrador.",
    fragment: '4',
    item: { id: 'chave-sql', nome: '🔐 Chave de Acesso', icone: '🔐', descricao: 'Gerada automaticamente após a consulta SQL bem-sucedida.' },
    hints: [
      'Um dos registros da tabela usuarios está incompleto. Talvez outra tabela explique o que houve com ele.',
      "Use SELECT * FROM tabela; para listar todos os registros de uma tabela. Experimente com usuarios, produtos e logs.",
      "A cláusula WHERE filtra registros por uma condição. Tente: SELECT * FROM usuarios WHERE perfil = 'admin';"
    ],
    render: function (state) {
      if (state.solvedPuzzles.includes('db')) return renderSolvedView(roomDB);
      return `
      <div class="room">
        <p class="room-kicker">SALA 04</p>
        <h2 class="room-title">🗄️ O Banco de Dados</h2>
        <div class="room-narrative">
          <p>&gt; O administrador do sistema desapareceu.</p>
          <p>&gt; Existe um registro importante escondido entre os dados.</p>
        </div>

        <div class="db-layout">
          <div class="db-tables">
            <p class="db-tables-title">TABELAS</p>
            <span class="table-chip">📁 usuarios</span>
            <span class="table-chip">📁 produtos</span>
            <span class="table-chip">📁 logs</span>
          </div>
          <div id="db-table-view" class="db-table-view" aria-live="polite">
            <p class="db-placeholder">Use um comando SQL para consultar uma tabela.</p>
          </div>
        </div>

        <div class="sql-console">
          <p class="terminal-label">SQL COMMAND</p>
          <form id="db-form" class="field-row" autocomplete="off">
            <label class="sr-only" for="db-query">Consulta SQL</label>
            <input id="db-query" name="query" type="text" placeholder="" spellcheck="false">
            <button type="submit" class="btn btn-primary">EXECUTAR</button>
          </form>
          <div id="db-result" class="db-result" role="status"></div>
        </div>
      </div>`;
    },
    init: function (container) {
      const tableView = container.querySelector('#db-table-view');
      const form = container.querySelector('#db-form');
      const input = container.querySelector('#db-query');
      const result = container.querySelector('#db-result');

      function renderTable(name, rows) {
        if (!rows.length) { tableView.innerHTML = '<p class="db-placeholder">Tabela vazia.</p>'; return; }
        const cols = Object.keys(rows[0]);
        let html = `<table class="db-table"><thead><tr>${cols.map(function (c) { return '<th>' + escapeHTML(c) + '</th>'; }).join('')}</tr></thead><tbody>`;
        rows.forEach(function (row) {
          html += '<tr>' + cols.map(function (c) { return '<td>' + escapeHTML(row[c]) + '</td>'; }).join('') + '</tr>';
        });
        html += '</tbody></table>';
        tableView.innerHTML = html;
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const res = App.DB.runQuery(input.value);
        if (res.ok) {
          App.Game.playSound('success');
          renderTable(res.table, res.rows);
          result.className = 'db-result db-result-ok';
          result.textContent = res.message;
          if (res.grants === 'admin_filter') {
            App.Game.completeRoom('db');
          } else if (res.grants === 'logs') {
            App.Game.grantItem('db', { id: 'registro-auditoria', nome: '📄 Registro de Auditoria', icone: '📄', descricao: 'SELO-K19 — comprova a restauração pendente do administrador.' });
          }
        } else {
          App.Game.playSound('error');
          App.Game.registerMistake('db');
          result.className = 'db-result db-result-error';
          result.textContent = res.message;
        }
      });
    },
    // Usada quando outra sala (ex.: a 05) permite voltar e reler esta sala já
    // resolvida. É somente consulta: não chama nada de App.State/App.Game
    // que altere o progresso, só navega pelas tabelas já existentes.
    reviewRender: function () {
      return `
        <div class="db-layout">
          <div class="db-tables">
            <p class="db-tables-title">TABELAS</p>
            <span class="table-chip">📁 usuarios</span>
            <span class="table-chip">📁 produtos</span>
            <span class="table-chip">📁 logs</span>
          </div>
          <div id="review-db-table-view" class="db-table-view" aria-live="polite">
            <p class="db-placeholder">Use um comando SQL para consultar uma tabela.</p>
          </div>
        </div>
        <div class="sql-console">
          <p class="terminal-label">SQL COMMAND</p>
          <form id="review-db-form" class="field-row" autocomplete="off">
            <label class="sr-only" for="review-db-query">Consulta SQL</label>
            <input id="review-db-query" name="query" type="text" placeholder="" spellcheck="false">
            <button type="submit" class="btn btn-primary">EXECUTAR</button>
          </form>
          <div id="review-db-result" class="db-result" role="status"></div>
        </div>`;
    },
    reviewInit: function (container) {
      const tableView = container.querySelector('#review-db-table-view');
      const form = container.querySelector('#review-db-form');
      const input = container.querySelector('#review-db-query');
      const result = container.querySelector('#review-db-result');

      function renderTable(name, rows) {
        if (!rows.length) { tableView.innerHTML = '<p class="db-placeholder">Tabela vazia.</p>'; return; }
        const cols = Object.keys(rows[0]);
        let html = `<table class="db-table"><thead><tr>${cols.map(function (c) { return '<th>' + escapeHTML(c) + '</th>'; }).join('')}</tr></thead><tbody>`;
        rows.forEach(function (row) {
          html += '<tr>' + cols.map(function (c) { return '<td>' + escapeHTML(row[c]) + '</td>'; }).join('') + '</tr>';
        });
        html += '</tbody></table>';
        tableView.innerHTML = html;
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const res = App.DB.runQuery(input.value);
        if (res.ok) {
          App.Game.playSound('success');
          renderTable(res.table, res.rows);
          result.className = 'db-result db-result-ok';
          result.textContent = res.message;
        } else {
          App.Game.playSound('error');
          result.className = 'db-result db-result-error';
          result.textContent = res.message;
        }
      });
    }
  };

  // ---------------------------------------------------------------------
  // SALA 05 — CRUD
  // ---------------------------------------------------------------------
  const roomCRUD = {
    id: 'crud',
    label: 'SALA 05 — O USUÁRIO PERDIDO',
    title: '✏️ SALA 05 — O USUÁRIO PERDIDO',
    estimatedTime: '7–10 min',
    concepts: ['Create', 'Read', 'Update', 'Delete', 'Formulários e localStorage'],
    solvedText: 'Você recriou o usuário administrador com os dados corretos: ADMIN / master / administrador.',
    fragment: '6',
    item: { id: 'cartao-acesso', nome: '🪪 Cartão de Acesso', icone: '🪪', descricao: 'Emitido automaticamente ao restaurar o administrador do sistema.' },
    // RESPOSTA: dados exatos do usuário administrador a ser recriado
    answer: { nome: 'admin', login: 'master', perfil: 'administrador' },
    hints: [
      'O registro do administrador foi apagado — não o sistema inteiro. Use o painel de usuários para recriá-lo.',
      "A consulta aos logs (Sala 04) indicou o login correto: 'master'. O perfil precisa ser, claramente, o de administrador.",
      "Dados exatos: Nome = ADMIN · Login = master · Perfil = administrador."
    ],
    render: function (state) {
      if (state.solvedPuzzles.includes('crud')) return renderSolvedView(roomCRUD);
      const rows = state.crudUsers.map(function (u) {
        return `<tr data-id="${u.id}">
          <td>${u.id}</td><td>${escapeHTML(u.nome)}</td><td>${escapeHTML(u.login)}</td><td>${escapeHTML(u.perfil)}</td>
          <td class="crud-actions">
            <button type="button" class="btn btn-mini" data-action="edit" data-id="${u.id}">EDITAR</button>
            <button type="button" class="btn btn-mini btn-mini-danger" data-action="delete" data-id="${u.id}">EXCLUIR</button>
          </td>
        </tr>`;
      }).join('');
      return `
      <div class="room">
        <p class="room-kicker">SALA 05</p>
        <h2 class="room-title">✏️ O Usuário Perdido</h2>
        <div class="room-narrative">
          <p>&gt; O registro necessário para abrir a porta foi apagado.</p>
          <p>&gt; Você precisa restaurá-lo.</p>
        </div>

        ${state.solvedPuzzles.includes('db') ? '<button type="button" id="crud-review-db-btn" class="btn btn-ghost">← Voltar para Sala 04 — Banco de Dados</button>' : ''}

        <table class="crud-table">
          <thead><tr><th>ID</th><th>NOME</th><th>LOGIN</th><th>PERFIL</th><th>AÇÕES</th></tr></thead>
          <tbody id="crud-tbody">${rows}</tbody>
        </table>
        <button type="button" id="crud-new-btn" class="btn btn-ghost">+ NOVO USUÁRIO</button>

        <form id="crud-form" class="crud-form hidden" autocomplete="off">
          <input type="hidden" id="crud-edit-id" value="">
          <label for="crud-nome">Nome</label>
          <input id="crud-nome" name="nome" type="text" required>
          <label for="crud-login">Login</label>
          <input id="crud-login" name="login" type="text" required>
          <label for="crud-perfil">Perfil</label>
          <select id="crud-perfil" name="perfil">
            <option value="usuário">usuário</option>
            <option value="operador">operador</option>
            <option value="administrador">administrador</option>
          </select>
          <div class="crud-form-actions">
            <button type="submit" class="btn btn-primary">SALVAR</button>
            <button type="button" id="crud-cancel-btn" class="btn btn-ghost">CANCELAR</button>
          </div>
        </form>
        <p id="crud-feedback" class="feedback" role="status"></p>
      </div>`;
    },
    init: function (container) {
      const form = container.querySelector('#crud-form');
      const newBtn = container.querySelector('#crud-new-btn');
      const reviewBtn = container.querySelector('#crud-review-db-btn');
      const cancelBtn = container.querySelector('#crud-cancel-btn');
      const feedback = container.querySelector('#crud-feedback');
      const editIdField = container.querySelector('#crud-edit-id');
      const nomeField = container.querySelector('#crud-nome');
      const loginField = container.querySelector('#crud-login');
      const perfilField = container.querySelector('#crud-perfil');

      function openForm(user) {
        form.classList.remove('hidden');
        if (user) {
          editIdField.value = user.id;
          nomeField.value = user.nome;
          loginField.value = user.login;
          perfilField.value = user.perfil;
        } else {
          editIdField.value = '';
          form.reset();
        }
        nomeField.focus();
      }

      function closeForm() {
        form.classList.add('hidden');
        form.reset();
      }

      function checkAdminMatch(user) {
        const a = roomCRUD.answer;
        return user.nome.trim().toLowerCase() === a.nome &&
          user.login.trim().toLowerCase() === a.login &&
          user.perfil === a.perfil;
      }

      newBtn.addEventListener('click', function () { App.Game.playSound('click'); openForm(null); });
      cancelBtn.addEventListener('click', function () { App.Game.playSound('click'); closeForm(); });
      if (reviewBtn) {
        reviewBtn.addEventListener('click', function () {
          App.Game.playSound('click');
          App.Game.openRoomReview('db');
        });
      }

      container.querySelector('#crud-tbody').addEventListener('click', function (e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = Number(btn.dataset.id);
        const user = App.State.get().crudUsers.find(function (u) { return u.id === id; });
        if (btn.dataset.action === 'edit') {
          App.Game.playSound('click');
          openForm(user);
        } else if (btn.dataset.action === 'delete') {
          App.Game.playSound('click');
          App.State.crudDelete(id);
          App.Game.rerenderRoom();
        }
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const payload = { nome: nomeField.value.trim(), login: loginField.value.trim(), perfil: perfilField.value };
        if (!payload.nome || !payload.login) return;

        let saved;
        if (editIdField.value) {
          saved = App.State.crudUpdate(Number(editIdField.value), payload);
        } else {
          saved = App.State.crudCreate(payload);
        }
        App.Game.playSound('click');
        closeForm();

        if (checkAdminMatch(saved)) {
          App.Game.playSound('success');
          feedback.textContent = '✔ Sistema reconheceu o usuário administrador restaurado.';
          feedback.className = 'feedback feedback-success';
          App.Game.completeRoom('crud');
        } else {
          feedback.textContent = 'Usuário salvo, mas o sistema ainda não reconhece um administrador válido.';
          feedback.className = 'feedback feedback-error';
          App.Game.rerenderRoom();
        }
      });
    }
  };

  // ---------------------------------------------------------------------
  // SALA FINAL — SALA DE CONTROLE
  // ---------------------------------------------------------------------
  const roomFinal = {
    id: 'final',
    label: 'SALA DE CONTROLE',
    title: '🔓 SALA DE CONTROLE',
    estimatedTime: '3–5 min',
    concepts: ['Síntese: combinar pistas de HTML, CSS, JavaScript, Banco de Dados e CRUD'],
    solvedText: '',
    fragment: null,
    item: null,
    hints: [
      'Você não precisa adivinhar. As respostas já estão com você — reveja seu inventário (🎒).',
      'Cada sala revelou um fragmento numérico ao ser concluída.',
      'Combine os fragmentos na ordem em que foram descobertos: HTML, CSS, JavaScript, Banco de Dados, CRUD.'
    ],
    computeAnswer: function (state) {
      return App.State.ROOM_ORDER.filter(function (r) { return r !== 'final'; })
        .map(function (r) { return state.fragments[r] || ''; })
        .join('');
    },
    render: function (state) {
      return `
      <div class="room">
        <p class="room-kicker">SALA DE CONTROLE</p>
        <h2 class="room-title">🔓 Protocolo de Desbloqueio</h2>
        <div class="room-narrative">
          <p>&gt; Todos os subsistemas foram recuperados.</p>
          <p>&gt; Falta apenas um comando: o código final que combina tudo o que você já descobriu.</p>
        </div>
        <form id="final-form" class="terminal-panel" autocomplete="off">
          <p class="terminal-label">PROTOCOLO DE DESBLOQUEIO</p>
          <label class="sr-only" for="final-codigo">Código final</label>
          <input id="final-codigo" name="codigo" type="text" inputmode="numeric" placeholder="código final" aria-label="Código final">
          <button type="submit" class="btn btn-primary">EXECUTAR</button>
        </form>
        <p id="final-feedback" class="feedback" role="status"></p>
      </div>`;
    },
    init: function (container) {
      const form = container.querySelector('#final-form');
      const input = container.querySelector('#final-codigo');
      const feedback = container.querySelector('#final-feedback');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const state = App.State.get();
        const expected = roomFinal.computeAnswer(state);
        if (input.value.trim() === expected) {
          App.Game.playSound('unlock');
          feedback.textContent = '🔓 SISTEMA DESBLOQUEADO. PORTA PRINCIPAL LIBERADA.';
          feedback.className = 'feedback feedback-success';
          App.State.markSolved('final');
          App.Game.finishGame(true);
        } else {
          App.Game.playSound('error');
          App.Game.registerMistake('final');
          feedback.textContent = '✖ Código incorreto. Reveja seu inventário.';
          feedback.className = 'feedback feedback-error';
        }
      });
    }
  };

  App.Puzzles = {
    rooms: {
      html: roomHTML,
      css: roomCSS,
      js: roomJS,
      db: roomDB,
      crud: roomCRUD,
      final: roomFinal
    },
    roomMeta: {
      html: { name: 'HTML', icon: '🔐' },
      css: { name: 'CSS', icon: '🎨' },
      js: { name: 'JavaScript', icon: '⚙️' },
      db: { name: 'SQL', icon: '🗄️' },
      crud: { name: 'CRUD', icon: '✏️' },
      final: { name: 'FINAL', icon: '🔓' }
    }
  };
})();
