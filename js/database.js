'use strict';
/*
 * database.js — banco de dados simulado da Sala 04 (SQL) + um "interpretador"
 * controlado: reconhece um conjunto limitado de padrões de consulta SELECT,
 * não é um parser SQL completo (ver README, seção "Como adicionar novos desafios").
 */
window.App = window.App || {};

(function () {
  const tables = {
    usuarios: [
      { id: 1, nome: 'Ana Beatriz', login: 'ana', perfil: 'usuário' },
      { id: 2, nome: 'João Pedro', login: 'joao', perfil: 'usuário' },
      { id: 3, nome: 'Carlos Eduardo', login: 'carlos', perfil: 'operador' },
      { id: 4, nome: '(registro corrompido)', login: '(registro corrompido)', perfil: 'admin' }
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
      { id: 3, dataHora: '2026-01-04 03:13', evento: "Recuperação necessária: recriar usuário com login 'master' e perfil administrador pelo painel de administração." },
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
          rows: [tables.usuarios[3]],
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
    runQuery: runQuery
  };
})();
