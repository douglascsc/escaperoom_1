# 🔐 OPERAÇÃO: SERVIDOR 404

Escape Room digital, educativo e jogável, sobre HTML, CSS, JavaScript, Banco de Dados, SQL e CRUD.

> O sistema central foi comprometido. Todas as portas foram bloqueadas. Você tem 30 minutos para recuperar o acesso — investigando código, e não respondendo um questionário.

## Sumário

1. [Objetivo](#objetivo)
2. [Tecnologias utilizadas](#tecnologias-utilizadas)
3. [Como executar](#como-executar)
4. [Como publicar no GitHub Pages](#como-publicar-no-github-pages)
5. [Estrutura do projeto](#estrutura-do-projeto)
6. [Como o jogo funciona por dentro](#como-o-jogo-funciona-por-dentro)
7. [Como adicionar novos desafios](#como-adicionar-novos-desafios)
8. [Como alterar respostas](#como-alterar-respostas)
9. [Como criar novas salas](#como-criar-novas-salas)
10. [Modo Professor](#modo-professor)
11. [Acessibilidade](#acessibilidade)
12. [Limitações conhecidas](#limitações-conhecidas)

## Objetivo

O jogador está em um laboratório de informática cujo sistema central foi bloqueado. Para escapar, precisa investigar cinco salas — HTML, CSS, JavaScript, Banco de Dados/SQL e CRUD — e combinar o que descobrir em cada uma para destravar a sala de controle final.

A proposta **não é um quiz**. Não há perguntas do tipo "o que é HTML?". Em vez disso, o jogador clica em objetos, abre arquivos, inspeciona elementos, lê código-fonte, testa hipóteses e erra — exatamente como em um escape room físico, só que o "cadeado" é feito de conceitos de programação.

Ao final, o objetivo pedagógico é que o aluno tenha praticado, de forma concreta:

- **HTML**: estrutura, comentários, inspeção de elementos.
- **CSS**: classes, cor/fundo, `display` vs. `visibility`, estilos computados.
- **JavaScript**: variáveis, condicionais, funções, eventos, console do navegador.
- **Banco de Dados**: tabelas, registros, campos.
- **SQL**: `SELECT`, `WHERE`, interpretação de consultas.
- **CRUD**: Create, Read, Update, Delete, com dados reais mudando na tela.

## Tecnologias utilizadas

- **HTML5** semântico
- **CSS3** puro (variáveis, grid, flexbox, media queries) — sem framework
- **JavaScript ES6+** puro — sem framework, sem bundler, sem dependências externas
- **Web Audio API** para os efeitos sonoros (sintetizados em tempo real, sem arquivos de áudio)
- **`localStorage`** para persistência do progresso

Não há backend. O jogo roda inteiramente no navegador e pode ser publicado como site estático.

## Como executar

Não há build nem instalação de dependências. Basta abrir `index.html` em um navegador, ou, preferencialmente, servir a pasta com um servidor estático simples (evita eventuais bloqueios de `file://` em alguns navegadores):

```bash
# Python 3
python3 -m http.server 8000

# Node (com o pacote "serve" instalado globalmente)
npx serve .
```

Depois acesse `http://localhost:8000`.

## Como publicar no GitHub Pages

1. Envie o conteúdo deste repositório para o GitHub (branch `main`, por exemplo).
2. No GitHub, vá em **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Escolha a branch `main` e a pasta `/ (root)`.
5. Salve. Em alguns minutos o jogo estará disponível em `https://<seu-usuario>.github.io/<repositorio>/`.

Não é necessário nenhum passo de build: o `index.html` já referencia os arquivos de `css/` e `js/` com caminhos relativos.

## Estrutura do projeto

```text
/
├── index.html          # esqueleto das telas (intro, jogo, vitória, derrota, painéis, modais)
├── css/
│   └── style.css        # todo o visual do jogo
├── js/
│   ├── state.js         # estado central do jogo + persistência em localStorage
│   ├── database.js      # banco de dados simulado da Sala 04 + "interpretador" de SQL controlado
│   ├── puzzles.js       # conteúdo, textos e lógica de validação de cada sala
│   └── game.js          # telas, cronômetro, HUD, painéis, som, modo professor
├── assets/
│   ├── audio/           # reservado para efeitos sonoros em arquivo (não é usado hoje — ver nota abaixo)
│   └── images/          # reservado para imagens/ícones adicionais
└── README.md
```

**Nota sobre áudio**: em vez de arquivos `.mp3`/`.wav` em `assets/audio/`, os efeitos sonoros (clique, erro, sucesso, desbloqueio, alerta, conclusão) são sintetizados em tempo real com a Web Audio API, em `js/game.js` (função `playSound`). Isso evita depender de arquivos binários externos e mantém o repositório leve. A pasta `assets/audio/` foi mantida na estrutura para quem preferir substituir por efeitos sonoros próprios — nesse caso, troque o conteúdo de `playSound()` por `new Audio('assets/audio/arquivo.mp3').play()`.

## Como o jogo funciona por dentro

- **`js/state.js`** guarda um único objeto `gameState` (sala atual, tempo restante, inventário, desafios resolvidos, pistas usadas, erros, usuários do CRUD etc.) e salva automaticamente em `localStorage` a cada mudança. Se a página for recarregada no meio do jogo, o progresso é restaurado (inclusive o tempo restante, compensando o tempo real que passou).
- **`js/puzzles.js`** define cada sala como um objeto com `render(state)` (devolve o HTML da sala) e `init(container)` (liga os eventos depois que o HTML entra no DOM). Quando uma sala já foi resolvida, `render()` automaticamente devolve a "tela de sala concluída" — por isso recarregar a página no meio do jogo nunca deixa o jogador preso numa sala já vencida.
- **`js/game.js`** é o controlador: troca de telas, cronômetro, painéis de inventário/pistas, som, modo professor e telas de vitória/derrota. Ele expõe um pequeno "contrato" em `App.Game` (`completeRoom`, `registerMistake`, `grantItem`, `playSound`, `toast`) que `puzzles.js` usa para reportar o que aconteceu em cada sala, sem precisar conhecer os detalhes de HUD/telas.
- **`js/database.js`** simula um banco de dados com três tabelas (`usuarios`, `produtos`, `logs`) como arrays de objetos JavaScript, e reconhece um conjunto controlado de padrões de consulta `SELECT` (não é um interpretador SQL genérico — ver seção abaixo).

## Como adicionar novos desafios

Cada sala tem, em `js/puzzles.js`, uma seção claramente demarcada (`SALA 01 — CSS`, `SALA 02 — HTML` etc. — a ordem de jogo é definida por `ROOM_ORDER`, em `js/state.js`, não pela ordem em que as salas aparecem no arquivo). Para adicionar uma variação de desafio dentro de uma sala existente:

1. Edite o HTML devolvido por `render()` para incluir o novo elemento/pista.
2. Se o novo desafio tiver sua própria validação, adicione o campo correspondente (ex.: mais um objeto clicável em `contents` na Sala 02 — HTML, ou mais um padrão em `patterns` no `js/database.js` para a Sala 04).
3. Atualize as `hints` (pistas) e `concepts` (conceitos) da sala se o novo desafio exigir algo diferente.
4. Se quiser que o novo desafio dê um item de inventário, use `App.Game.grantItem(roomId, { id, nome, icone, descricao })` (não marca a sala como resolvida) ou inclua o item no campo `item` da sala (é entregue automaticamente quando a sala é concluída).

## Como alterar respostas

As respostas ficam sempre marcadas com o comentário `// RESPOSTA:` em `js/puzzles.js`, próximas à definição de cada sala:

| Sala | Onde está a resposta | Como alterar |
|---|---|---|
| 01 — CSS | `roomCSS.answer` (string) | Troque o valor e o texto do parágrafo `#css-secret` em `roomCSS.render` |
| 02 — HTML | `roomHTML.answer` (string) | Troque o valor e o número dentro do comentário HTML em `contents.pasta`, dentro de `roomHTML.init` |
| 03 — JavaScript | função `verificarAcessoSistema` (usuário/senha) — hoje `root` / senha em branco | Troque `USUARIO_ESPERADO` e `SENHA_ESPERADA`, e ajuste a linha correspondente no `.terminal-log` de `roomJS.render` |
| 04 — SQL | `js/database.js`, array `patterns` (consultas) e `decryptedAdmin` (valores revelados ao descriptografar) | Ajuste os `regex` de cada padrão reconhecido e/ou os valores de `decryptedAdmin` |
| 05 — CRUD | `roomCRUD.answer` (nome/login/perfil) | Troque os três valores esperados — eles precisam bater com `decryptedAdmin` em `js/database.js` para a sala fazer sentido |
| Final | calculado a partir de `fragment` de cada sala | Troque o campo `fragment` de cada sala — o código final é sempre a concatenação, na ordem definida por `App.State.ROOM_ORDER` (hoje CSS → HTML → JS → SQL → CRUD), então não precisa recalcular nada manualmente |

Depois de alterar uma resposta, lembre-se de atualizar também as cinco `hints` daquela sala, para que continuem levando à solução correta.

## Como criar novas salas

1. Em `js/puzzles.js`, copie a estrutura de uma sala existente (título, `estimatedTime`, `concepts`, `hints`, `fragment`, `item`, `render`, `init`) e adicione a nova sala ao objeto `App.Puzzles.rooms` e à lista `App.Puzzles.roomMeta`.
2. Em `js/state.js`, inclua o id da nova sala no array `ROOM_ORDER`, na posição em que ela deve aparecer, e adicione uma entrada correspondente em `hintsUsed` e `mistakesByRoom` no `defaultState()`.
3. Garanta que o novo `fragment` (se houver) seja um caractere/sequência que combine com os das demais salas — ele entra automaticamente na composição do código final.
4. Não é necessário mexer em `js/game.js`: ele lê `App.State.ROOM_ORDER` e `App.Puzzles.rooms` dinamicamente para montar o mapa de progresso, o HUD, o modo professor e a recapitulação final.

## Modo Professor

Para dar suporte ao acompanhamento em sala de aula, existe uma tela oculta com todas as soluções, pistas, conceitos trabalhados, sequência esperada e tempo estimado de cada sala.

**Como abrir**: pressione `Ctrl + Shift + P` durante o jogo (não é anunciado na interface, para não estragar a experiência dos alunos).

A tela mostra, para cada sala:

- resposta esperada;
- conceitos de programação trabalhados;
- as cinco pistas, na ordem em que são reveladas;
- tempo estimado.

**Sequência esperada**: CSS → HTML → JavaScript → Banco de Dados/SQL → CRUD → Sala de Controle (final), com duração total estimada de ~30 minutos. Nos últimos 5 minutos, um botão de tempo extra (+15 min, uso único) fica disponível no cabeçalho — o jogador precisa clicar nele, não é aplicado automaticamente.

**Respostas de referência** (a fonte da verdade é sempre `js/puzzles.js` e `js/database.js`, caso o professor tenha personalizado o jogo):

- **Sala 01 (CSS)**: código `4816`, escondido por uma classe CSS cujo `color` é igual ao `background` (só aparece selecionando o texto ou inspecionando o elemento). Há um item isca com `display: none` mostrando o código falso `0000`.
- **Sala 02 (HTML)**: senha `7392`, encontrada em um comentário HTML (`<!-- senha temporária: 7392 -->`) dentro do arquivo "aberto" ao clicar na 📁 pasta. Há um comentário-isca na 🗑️ lixeira (`1111`) e um número-isca no 📄 documento (`0000`/`1234`).
- **Sala 03 (JavaScript)**: usuário `root` e senha em branco — a mesma convenção do usuário padrão de uma instalação recém-feita do MySQL. Essa dica é dada diretamente no log de boot exibido na sala (e reforçada por um `console.info`); a validação está na função `verificarAcessoSistema`, em `js/puzzles.js`, legível pelas ferramentas de desenvolvedor.
- **Sala 04 (SQL)**: consulta esperada `SELECT * FROM usuarios WHERE perfil = 'admin';`, que revela o registro corrompido do admin. A tabela `logs` (`SELECT * FROM logs;`) explica o que aconteceu. Depois de rodar a consulta certa, aparece um botão "🔓 Descriptografar registro" que revela nome (`ADMIN`), login (`master`) e perfil (`administrador`) — só então a sala é marcada como concluída (a consulta sozinha não basta).
- **Sala 05 (CRUD)**: a sala parte dos mesmos usuários da tabela `usuarios` da Sala 04 (`App.DB.tables.usuarios`, ver `js/state.js`) — incluindo o mesmo registro corrompido do administrador (ID 4). Só essa linha tem os botões Editar/Excluir; Ana, João e Carlos são só contexto. Qualquer um destes caminhos resolve a sala: (1) **UPDATE** — clicar Editar no registro corrompido e preencher os três campos certos; (2) **DELETE + INSERT** — excluir o registro corrompido e rodar `INSERT INTO usuarios (nome, login, perfil) VALUES ('ADMIN', 'master', 'administrador');` no console SQL da sala; ou (3) apenas rodar o mesmo INSERT sem excluir nada antes (o registro corrompido fica ali, sem uso). Os três valores vêm do registro descriptografado na Sala 04 — não são revelados de novo nesta sala.
- **Sala final**: o código é a concatenação dos fragmentos revelados ao concluir cada sala anterior, na ordem CSS → HTML → JS → SQL → CRUD (com os valores padrão acima, o código é `37946`).

## Acessibilidade

- Contraste alto entre texto e fundo (tema escuro pensado para leitura, não apenas estética).
- Estados de foco visíveis (`:focus-visible`) em todos os elementos interativos.
- Objetos clicáveis e ações são `<button>`/`<form>` reais, navegáveis e ativáveis por teclado (Tab + Enter/Espaço).
- Rótulos (`label`, `aria-label`) em todos os campos de formulário.
- Regiões de conteúdo dinâmico (sala atual, resultado de consultas SQL, feedback de erro/sucesso) usam `aria-live` para leitores de tela.
- Nenhuma informação depende exclusivamente de cor — mensagens de erro e sucesso sempre vêm acompanhadas de texto e símbolo (✔/✖).
- `prefers-reduced-motion` é respeitado: animações são praticamente eliminadas para quem configurou essa preferência no sistema.

## Limitações conhecidas

- O "interpretador SQL" da Sala 04 reconhece apenas um conjunto fixo de padrões de consulta (ver `js/database.js`) — não é um parser SQL genérico. Isso é intencional (ver seção 13 do briefing original do projeto): o objetivo é ensinar a lógica de `SELECT`/`WHERE`, não implementar um banco de dados real.
- Como o jogo roda inteiramente no navegador e é publicado como site estático, todo o código-fonte — inclusive as respostas — fica acessível a quem abrir as ferramentas de desenvolvedor. Isso é aceitável e, em boa parte da Sala 03, é a própria mecânica do desafio (ver seção "Segurança / soluções" no briefing original). O jogo não deve ser usado como mecanismo de avaliação com pontuação oficial sem supervisão.
- O progresso é salvo por navegador/dispositivo (`localStorage`), não em nuvem — trocar de navegador ou de computador reinicia o jogo.
