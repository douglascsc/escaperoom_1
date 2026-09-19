'use strict';
/*
 * database.js — banco de dados simulado da Sala 04 (SQL) e da Sala 05 (CRUD)
 * + um "interpretador" controlado: reconhece um conjunto limitado de padrões
 * de SELECT (Sala 04) e de INSERT/UPDATE (Sala 05). Não é um parser SQL
 * completo (ver README, seção "Como adicionar novos desafios").
 */
window.App = window.App || {};

(function () {
  // ID do registro corrompido do administrador na tabela usuarios. A Sala 05
  // parte deste mesmo conjunto de usuários (ver js/state.js) — é esse o
  // registro que o jogador precisa corrigir (UPDATE) ou substituir (INSERT).
  const CORRUPTED_ADMIN_ID = 4;

  const tables = {
    usuarios: [
      { id: 1, nome: 'Ana Beatriz', login: 'ana', perfil: 'usuário' },
      { id: 2, nome: 'João Pedro', login: 'joao', perfil: 'usuário' },
      { id: 3, nome: 'Carlos Eduardo', login: 'carlos', perfil: 'operador' },
      { id: CORRUPTED_ADMIN_ID, nome: '(registro corrompido)', login: '(registro corrompido)', perfil: 'admin' }
    ],
    produtos: [
      { id: 1, nome: 'Roteador RT-220', categoria: 'Rede', estoque: 14 },
      { id: 2, nome: 'Switch 24 portas', categoria: 'Rede', estoque: 6 },
      { id: 3, nome: 'Nobreak 1500VA', categoria: 'Energia', estoque: 3 },
      { id: 4, nome: 'Cabo de rede Cat6 (caixa)', categoria: 'Cabeamento', estoque: 21 }
    ],
    logs: [
      { id: 1, dataHora: '2026-01-03 22:41', evento: 'Backup automático concluído com sucesso.' },
      { id: 2, dataHora: '2026-01-04 03:12', evento: "Manutenção de rotina: conta 'admin' removida acidentalmente da tabela usuarios." },
      { id: 3, dataHora: '2026-01-04 03:13', evento: 'Recuperação necessária: o usuário apagado ainda pode ser localizado. Consulte a tabela de usuários utilizando um filtro.' },
      { id: 4, dataHora: '2026-01-04 09:05', evento: 'Selo de auditoria emitido para a restauração pendente: SELO-K19.' },
      { id: 5, dataHora: '2026-01-05 07:58', evento: 'Nenhuma anomalia adicional detectada.' }
    ]
  };

  function normalize(raw) {
    return raw
      .trim()
      .replace(/;+\s*$/, '')
      .replace(/\s+/g, ' ')
      .replace(/["]/g, "'")
      .toLowerCase();
  }

  // Valores reais do administrador, obtidos ao "descriptografar" o registro
  // corrompido na Sala 04. Isso NÃO altera `tables.usuarios` — é só leitura,
  // a restauração de verdade acontece na Sala 05, via INSERT ou UPDATE.
  const decryptedAdmin = { nome: 'admin', login: 'master', perfil: 'administrador' };
  function decryptAdminRecord() {
    return Object.assign({}, decryptedAdmin);
  }

  // Interpretador controlado para o INSERT da Sala 05 — reconhece apenas o
  // formato INSERT INTO usuarios (nome, login, perfil) VALUES (...), na
  // mesma ordem de colunas. O id é auto-increment (ver crudCreate em
  // js/state.js) e não pode ser informado no INSERT — se o jogador tentar,
  // ganha um erro específico em vez do genérico. Não é um parser SQL genérico.
  const INSERT_RE = /^insert\s+into\s+usuarios\s*\(\s*nome\s*,\s*login\s*,\s*perfil\s*\)\s*values\s*\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)$/i;
  const INSERT_WITH_ID_RE = /^insert\s+into\s+usuarios\s*\(\s*id\s*,/i;

  function runInsert(raw) {
    if (!raw || !raw.trim()) {
      return { ok: false, message: 'Digite um comando INSERT antes de executar.' };
    }
    const normalized = raw.trim().replace(/;+\s*$/, '').replace(/\s+/g, ' ').replace(/"/g, "'");
    if (INSERT_WITH_ID_RE.test(normalized)) {
      return {
        ok: false,
        message: "O campo id é gerado automaticamente (auto-increment) — não inclua id no INSERT. Use: INSERT INTO usuarios (nome, login, perfil) VALUES ('NOME', 'LOGIN', 'PERFIL');"
      };
    }
    const m = normalized.match(INSERT_RE);
    if (!m) {
      return {
        ok: false,
        message: "Comando não reconhecido. Use o formato: INSERT INTO usuarios (nome, login, perfil) VALUES ('NOME', 'LOGIN', 'PERFIL');"
      };
    }
    return { ok: true, values: { nome: m[1], login: m[2], perfil: m[3] } };
  }

  // Interpretador controlado para o UPDATE da Sala 05 — reconhece apenas o
  // formato UPDATE usuarios SET nome = '...', login = '...', perfil = '...'
  // WHERE id = N, com as colunas nessa ordem fixa. Não é um parser SQL genérico.
  const UPDATE_RE = /^update\s+usuarios\s+set\s+nome\s*=\s*'([^']*)'\s*,\s*login\s*=\s*'([^']*)'\s*,\s*perfil\s*=\s*'([^']*)'\s+where\s+id\s*=\s*(\d+)$/i;

  function runUpdate(raw) {
    if (!raw || !raw.trim()) {
      return { ok: false, message: 'Digite um comando UPDATE antes de executar.' };
    }
    const normalized = raw.trim().replace(/;+\s*$/, '').replace(/\s+/g, ' ').replace(/"/g, "'");
    const m = normalized.match(UPDATE_RE);
    if (!m) {
      return {
        ok: false,
        message: "Comando não reconhecido. Use o formato: UPDATE usuarios SET nome = 'NOME', login = 'LOGIN', perfil = 'PERFIL' WHERE id = ID;"
      };
    }
    return { ok: true, id: Number(m[4]), values: { nome: m[1], login: m[2], perfil: m[3] } };
  }

  // Interpretador controlado para o DELETE da Sala 05 — reconhece apenas o
  // formato DELETE FROM usuarios WHERE id = N. Não é um parser SQL genérico.
  const DELETE_RE = /^delete\s+from\s+usuarios\s+where\s+id\s*=\s*(\d+)$/i;

  function runDelete(raw) {
    if (!raw || !raw.trim()) {
      return { ok: false, message: 'Digite um comando DELETE antes de executar.' };
    }
    const normalized = raw.trim().replace(/;+\s*$/, '').replace(/\s+/g, ' ');
    const m = normalized.match(DELETE_RE);
    if (!m) {
      return {
        ok: false,
        message: 'Comando não reconhecido. Use o formato: DELETE FROM usuarios WHERE id = ID;'
      };
    }
    return { ok: true, id: Number(m[1]) };
  }

  // Ponto único de entrada para o console SQL da Sala 05: reconhece um
  // comando INSERT, UPDATE ou DELETE na tabela usuarios e delega para o
  // parser certo.
  function runCrudCommand(raw) {
    if (!raw || !raw.trim()) {
      return { ok: false, message: 'Digite um comando SQL antes de executar.' };
    }
    const normalized = raw.trim().replace(/;+\s*$/, '').replace(/\s+/g, ' ');
    if (/^insert\s+into\s+usuarios/i.test(normalized)) {
      return Object.assign({ kind: 'insert' }, runInsert(raw));
    }
    if (/^update\s+usuarios/i.test(normalized)) {
      return Object.assign({ kind: 'update' }, runUpdate(raw));
    }
    if (/^delete\s+from\s+usuarios/i.test(normalized)) {
      return Object.assign({ kind: 'delete' }, runDelete(raw));
    }
    return {
      ok: false,
      message: "Comando não reconhecido. Use INSERT INTO usuarios (nome, login, perfil) VALUES ('...', '...', '...'); UPDATE usuarios SET nome = '...', login = '...', perfil = '...' WHERE id = ID; ou DELETE FROM usuarios WHERE id = ID;"
    };
  }

  // Padrões reconhecidos: cada um tem um regex de validação e um "handler" que
  // monta a resposta. Isso evita a necessidade de um parser SQL real.
  const patterns = [
    {
      name: 'select_all_usuarios',
      test: /^select\s+\*\s+from\s+usuarios$/,
      run: function () {
        return {
          ok: true,
          table: 'usuarios',
          rows: tables.usuarios,
          message: '4 registros encontrados em "usuarios". Um deles está incompleto — talvez outra tabela explique o motivo.'
        };
      }
    },
    {
      name: 'select_admin_usuarios',
      test: /^select\s+\*\s+from\s+usuarios\s+where\s+perfil\s*=\s*'admin'$/,
      run: function () {
        return {
          ok: true,
          table: 'usuarios',
          rows: [tables.usuarios.find(function (u) { return u.id === CORRUPTED_ADMIN_ID; })],
          message: 'Registro encontrado, mas os dados foram corrompidos na queda do sistema. Consulte a tabela "logs" para entender o que aconteceu.',
          grants: 'admin_filter'
        };
      }
    },
    {
      name: 'select_all_logs',
      test: /^select\s+\*\s+from\s+logs$/,
      run: function () {
        return {
          ok: true,
          table: 'logs',
          rows: tables.logs,
          message: '5 registros encontrados em "logs". Leia com atenção — há instruções de recuperação.',
          grants: 'logs'
        };
      }
    },
    {
      name: 'select_all_produtos',
      test: /^select\s+\*\s+from\s+produtos$/,
      run: function () {
        return {
          ok: true,
          table: 'produtos',
          rows: tables.produtos,
          message: '4 registros encontrados em "produtos". Não parece relevante para o incidente atual.'
        };
      }
    }
  ];

  function runQuery(raw) {
    if (!raw || !raw.trim()) {
      return { ok: false, message: 'Digite uma consulta SQL antes de executar.' };
    }
    const normalized = normalize(raw);
    for (const p of patterns) {
      if (p.test.test(normalized)) {
        return Object.assign({ pattern: p.name }, p.run());
      }
    }
    return {
      ok: false,
      message: 'Consulta não reconhecida ou tabela/campo inexistente. Lembre-se da sintaxe: SELECT * FROM tabela WHERE campo = \'valor\';'
    };
  }

  App.DB = {
    tables: tables,
    CORRUPTED_ADMIN_ID: CORRUPTED_ADMIN_ID,
    runQuery: runQuery,
    runInsert: runInsert,
    runUpdate: runUpdate,
    runDelete: runDelete,
    runCrudCommand: runCrudCommand,
    decryptAdminRecord: decryptAdminRecord
  };
})();
