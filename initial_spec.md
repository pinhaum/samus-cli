# Metroid Trace — Especificação v2

## Visão Geral

Ferramenta de terminal que transforma stack traces em mapas estilo Metroid/Castlevania navegáveis para facilitar o debugging de forma visual e divertida.

**Slogan:**

> Transforme seus erros em dungeons exploráveis.

---

## Objetivo

Receber um stack trace como entrada e gerar uma representação visual interativa em ASCII dentro do terminal, transformando chamadas de função em salas, módulos em biomas e exceções em chefes finais.

---

## Escopo da Fase 1

Esta especificação cobre exclusivamente a Fase 1. Features fora deste escopo estão listadas no Roadmap.

| Feature                                   | Status    |
| ----------------------------------------- | --------- |
| Entrada via pipe e arquivo                | ✅ Fase 1 |
| Renderização ASCII com biomas             | ✅ Fase 1 |
| Bosses por tipo de exceção                | ✅ Fase 1 |
| Threat Level                              | ✅ Fase 1 |
| Tesouros por heurística                   | ✅ Fase 1 |
| Minimap                                   | ✅ Fase 1 |
| Navegação interativa ↑↓ entre salas       | ✅ Fase 1 |
| Detalhes da sala (ENTER)                  | ✅ Fase 1 |
| Layouts variados de sala (L, T, corredor) | ✅ Fase 1 |
| Exportação PNG/SVG/Markdown               | ❌ Fase 3 |
| Mapas procedurais com determinismo        | ❌ Fase 4 |
| Animações                                 | ❌ Fase 4 |

---

## Entrada

### Pipe

```bash
cat error.log | samus-cli
```

### Arquivo

```bash
samus-cli error.log
```

> Nenhuma outra forma de entrada está no escopo da Fase 1.

---

## Stack de Tecnologia

| Camada             | Escolha              |
| ------------------ | -------------------- |
| Linguagem          | TypeScript + Node.js |
| CLI                | Commander            |
| UI Terminal        | Blessed              |
| Geração de imagens | ❌ Fase 3            |

---

## Arquitetura e Fluxo de Dados

```
stdin / arquivo
      │
      ▼
  [parser]
  Lê o texto bruto e produz ParsedFrame[]
      │
      ▼
  [map]
  Recebe ParsedFrame[], resolve bioma, tesouro,
  tipo de sala e produz DungeonMap
      │
      ▼
  [renderer]
  Recebe DungeonMap e produz strings ASCII
  para cada sala (box, corredor, boss room)
      │
      ▼
  [ui]
  Blessed recebe as strings do renderer,
  monta a tela, gerencia navegação e minimap
```

### Contratos de dados

```ts
// Saída do parser
interface ParsedFrame {
  functionName: string; // ex: "UserService.findUser"
  file: string; // ex: "user.service.ts"
  line: number; // ex: 42
  column?: number;
  directory?: string; // inferido do path completo, ex: "user"
  isAnonymous: boolean; // true para <anonymous>, eval, node:internal
}

interface ParsedStack {
  errorType: string; // ex: "TypeError"
  errorMessage: string; // ex: "Cannot read properties of undefined"
  frames: ParsedFrame[];
}

// Saída do map
interface DungeonRoom {
  frame: ParsedFrame;
  biome: Biome; // enum com os biomas disponíveis
  layout: RoomLayout; // enum: 'corridor' | 'L' | 'T' | 'square'
  treasure?: Treasure; // ausente se não detectado ou se for boss room
  isBossRoom: boolean;
}

interface DungeonMap {
  rooms: DungeonRoom[];
  boss: Boss;
  threatLevel: number; // 0–100
}
```

---

## Parser

### Formato suportado

Node.js / TypeScript:

```
Error: mensagem do erro
    at FunctionName (path/to/file.ts:linha:coluna)
    at FunctionName (path/to/file.ts:linha:coluna)
```

### Regras de parsing

- A primeira linha é a exceção: `ErrorType: mensagem`
- Cada linha `at ...` é um frame
- Path completo é usado para inferir `directory` (primeiro segmento após `src/` ou raiz)
- Frames com `<anonymous>`, `eval`, ou prefixo `node:` recebem `isAnonymous: true`
- Frames anônimos são renderizados como **Unknown Room** — sala genérica sem bioma nem tesouro
- Stack malformada ou sem frames válidos encerra com mensagem de erro amigável no terminal

---

## Sistema de Biomas

O bioma é determinado pelo campo `directory` do frame.

| Diretório              | Bioma       | Ícone |
| ---------------------- | ----------- | ----- |
| `auth`                 | Castelo     | 🏰    |
| `user`                 | Caverna     | 🕳    |
| `api`                  | Fortaleza   | 🛡    |
| `database` / `db`      | Esgoto      | 🚧    |
| `cache`                | Laboratório | 🧪    |
| `queue`                | Mina        | ⛏     |
| `payments` / `payment` | Vulcão      | 🌋    |
| _(sem match)_          | Floresta    | 🌲    |

Biomas afetam o ícone exibido no header da sala e no minimap.

---

## Layouts de Sala

O layout de cada sala é sorteado aleatoriamente a cada execução (sem determinismo).

| Layout     | Descrição                                 |
| ---------- | ----------------------------------------- |
| `corridor` | Retângulo estreito — sala de passagem     |
| `L`        | Formato em L — sala com desvio            |
| `T`        | Formato em T — sala com bifurcação visual |
| `square`   | Quadrado — sala principal                 |

A boss room sempre usa o layout `square`.

---

## Bosses

Mapeamento de tipo de exceção para boss.

| Exceção                | Boss                 | Ícone |
| ---------------------- | -------------------- | ----- |
| `TypeError`            | Shape Shifter        | 👾    |
| `ReferenceError`       | The Forgotten One    | 👻    |
| `NullPointerException` | Ghost of Nothingness | 💀    |
| `StackOverflowError`   | Infinite Hydra       | 🐉    |
| `OutOfMemoryError`     | Memory Eater         | 🧠    |
| `TimeoutError`         | Ancient Clockkeeper  | ⏳    |
| _(outros)_             | Unknown Evil         | 👹    |

A boss room exibe:

- Nome do boss e ícone
- Tipo e mensagem da exceção
- Arquivo e linha do frame

A boss room **não exibe tesouro**.

---

## Threat Level

### Cálculo

```
threatLevel = clamp(frameScore + exceptionScore + repetitionScore + recursionScore, 0, 100)
```

| Componente        | Cálculo                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| `frameScore`      | `frames.length * 5` (cap: 50)                                             |
| `exceptionScore`  | StackOverflow/OutOfMemory = 30; TypeError/ReferenceError = 15; outros = 5 |
| `repetitionScore` | frames com mesmo arquivo repetido: `+5` por repetição (cap: 20)           |
| `recursionScore`  | mesma função aparece 3+ vezes: `+20`                                      |

### Exibição

```
Threat Level: ██████████░░░░░░░░░░ 60%
```

Exibido no rodapé da tela, sempre visível.

---

## Tesouros

### Heurística de detecção

Analisa `functionName` e `file` do frame.

| Condição                                          | Tesouro                |
| ------------------------------------------------- | ---------------------- |
| `functionName` contém `cache` ou `memo`           | 💎 Cache Hit           |
| `functionName` contém `memo` (memoize)            | 🗝 Memoized Function   |
| `file` termina em `.test.ts` ou `.spec.ts`        | ⚔ Test Coverage        |
| `file` termina em `.docs.ts` ou dir contém `docs` | 📜 Documentation Found |

### Regras

- Máximo de um tesouro por sala
- Boss room nunca exibe tesouro
- Frames anônimos nunca exibem tesouro
- Se múltiplas condições forem verdadeiras, usa a primeira da tabela acima

---

## Minimap

- Posição: **canto superior direito**, sempre visível durante navegação
- Todas as salas são reveladas desde o início
- Sala atual destacada com cursor `@`

```
┌─────────┐
│■■■■■■■■ │
│■■■■■■■@ │
│■■■□□□X  │
└─────────┘
```

| Símbolo | Significado       |
| ------- | ----------------- |
| `■`     | Sala visitada     |
| `□`     | Sala não visitada |
| `X`     | Boss room         |
| `@`     | Posição atual     |

---

## Navegação

| Tecla   | Ação                         |
| ------- | ---------------------------- |
| `↑` `↓` | Navegar entre salas          |
| `ENTER` | Abrir detalhes da sala atual |
| `ESC`   | Fechar detalhes / sair       |

### Modo detalhes (ENTER)

```
┌─ Room Details ──────────────────┐
│ Function: AuthController.login  │
│ File:     auth.controller.ts    │
│ Line:     18                    │
│ Biome:    🏰 AUTH CASTLE        │
│ Treasure: —                     │
└─────────────────────────────────┘
```

---

## Estrutura de Pastas

```
src/
├── cli/          # Entry point, Commander, leitura de stdin/arquivo
├── parser/       # Texto bruto → ParsedStack
├── map/          # ParsedStack → DungeonMap (bioma, layout, tesouro, boss)
├── bosses/       # Mapeamento de exceção → Boss
├── renderer/     # DungeonMap → strings ASCII por sala
├── ui/           # Blessed: monta tela, navegação, minimap
├── themes/       # Definições de bioma (ícone, nome, cor)
└── utils/        # clamp, hash helpers, formatação
```

---

## Plano de Desenvolvimento

Ordem de implementação baseada nas dependências entre módulos. Cada etapa tem critério de conclusão e ponto de validação manual antes de avançar.

---

### Etapa 1 — Setup do projeto

**O que fazer:**

- Inicializar projeto TypeScript + Node.js
- Configurar `tsconfig.json`, `package.json`, scripts `build` e `dev`
- Instalar dependências: `commander`, `blessed`, `@types/blessed`
- Criar estrutura de pastas conforme `src/`

**Critério de conclusão:**

- `npm run build` executa sem erros
- `npm run dev` inicializa sem erros

**Validação manual:** nenhuma — etapa puramente estrutural.

---

### Etapa 2 — Parser

**O que fazer:**

- Implementar `src/parser/index.ts`
- Parsear texto bruto → `ParsedStack`
- Cobrir: frame normal, frame anônimo, stack malformada

**Critério de conclusão:**

- Dado o input de exemplo da spec, o parser retorna `ParsedStack` com todos os campos corretos
- Frame anônimo retorna `isAnonymous: true`
- Stack malformada retorna erro amigável sem exception não tratada

**Validação manual:**

```bash
# Criar fixtures/sample.log com o exemplo da spec e rodar:
npx ts-node src/parser/index.ts < fixtures/sample.log
# Inspecionar o JSON impresso no stdout
```

---

### Etapa 3 — Map

**O que fazer:**

- Implementar `src/map/index.ts`
- Recebe `ParsedStack` → produz `DungeonMap`
- Resolver bioma por `directory`
- Sortear layout aleatório por sala
- Detectar tesouros por heurística
- Resolver boss por `errorType`
- Calcular `threatLevel` com a fórmula da spec

**Critério de conclusão:**

- `DungeonMap` gerado tem `rooms.length === frames.length`
- Boss room é sempre a última sala (`frames[0]`, frame mais interno)
- Boss room não tem `treasure`
- `threatLevel` entre 0 e 100

**Validação manual:**

```bash
npx ts-node src/map/index.ts < fixtures/sample.log
# Inspecionar o DungeonMap impresso no stdout
```

---

### Etapa 4 — Renderer

**O que fazer:**

- Implementar `src/renderer/index.ts`
- Recebe `DungeonMap` → produz array de strings ASCII, uma por sala
- Implementar os 4 layouts: `corridor`, `L`, `T`, `square`
- Boss room usa layout `square` com boss name e ícone
- Salas normais exibem bioma, função, tesouro (se houver)
- Salas anônimas exibem "Unknown Room"

**Critério de conclusão:**

- Cada sala renderizada cabe em 80 colunas
- Boss room exibe nome do boss, tipo/mensagem da exceção, arquivo e linha
- Salas normais exibem ícone do bioma e tesouro quando presente

**Validação manual:**

```bash
npx ts-node src/renderer/index.ts < fixtures/sample.log
# Verificar o output ASCII no terminal — sem quebras, alinhamento correto
```

---

### Etapa 5 — UI com Blessed

**O que fazer:**

- Implementar `src/ui/index.ts`
- Montar a tela com Blessed: painel principal (salas) + minimap (canto superior direito) + rodapé (Threat Level)
- Navegação ↑↓ entre salas
- ENTER abre painel de detalhes da sala
- ESC fecha detalhes ou encerra o programa
- Minimap: todas as salas visíveis, `@` marca posição atual, `X` marca boss room, `■`/`□` para visitado/não visitado

**Critério de conclusão:**

- Navegação ↑↓ funciona sem flickering
- Minimap atualiza posição ao navegar
- Painel de detalhes abre e fecha corretamente
- Threat Level visível no rodapé em todas as telas

**Validação manual:**

```bash
cat fixtures/sample.log | samus-cli
# Navegar pelo mapa, abrir detalhes, verificar minimap e Threat Level
```

---

### Etapa 6 — CLI e integração final

**O que fazer:**

- Implementar `src/cli/index.ts` com Commander
- Suporte a pipe (`stdin`) e arquivo como argumento
- Detectar automaticamente se está recebendo pipe ou argumento
- Encadear: `cli → parser → map → renderer → ui`
- Tratar erros de arquivo não encontrado e input vazio

**Critério de conclusão:**

- `cat fixtures/sample.log | samus-cli` funciona
- `samus-cli fixtures/sample.log` funciona
- Arquivo inexistente exibe mensagem amigável e encerra com código 1
- Input vazio exibe mensagem amigável e encerra com código 1

**Validação manual:**

```bash
cat fixtures/sample.log | samus-cli
samus-cli fixtures/sample.log
samus-cli fixtures/naoexiste.log
echo "" | samus-cli
```

---

## Roadmap

### Fase 1 (esta spec)

- Parser Node.js/TypeScript
- Renderização ASCII com biomas e layouts variados
- Bosses por tipo de exceção
- Threat Level completo
- Tesouros por heurística
- Minimap estático
- Navegação interativa com Blessed

### Fase 2

- Suporte a outros formatos de stack (Python, Java)
- Temas visuais alternativos

### Fase 3

- Exportação PNG, SVG e Markdown
- Compartilhamento via GitHub Gist

### Fase 4

- Geração procedural determinística (mesma stack = mesmo mapa)
- Animações
- Debug colaborativo (multiplayer local)

---

## Diferencial

Não é apenas um visualizador de stack traces.

É uma ferramenta de debugging gamificada que transforma erros em mapas exploráveis, tornando a análise de falhas mais intuitiva, divertida e compartilhável.
