# Como Funciona o WHMCS MCP

## Arquitetura

```
┌─────────────────┐
│  Você (usuário) │
└────────┬────────┘
         │ "Liste os tickets"
         ↓
┌─────────────────────────┐
│     Claude Code CLI     │
│  (entende linguagem     │
│   natural e decide      │
│   qual tool usar)       │
└────────┬────────────────┘
         │ whmcs_get_tickets({ limitnum: 5 })
         ↓
┌──────────────────────────────────────┐
│       MCP Server (stdio)             │
│   build/index.js                     │
│                                      │
│   - Recebe chamada da tool           │
│   - Valida parâmetros                │
│   - Executa WHMCSClient              │
└────────┬─────────────────────────────┘
         │ client.getTickets({ limitnum: 5 })
         ↓
┌──────────────────────────────────────┐
│     WHMCSClient                      │
│   (whmcs-client.ts)                  │
│                                      │
│   - Adiciona autenticação            │
│   - Serializa parâmetros             │
│   - Faz requisição HTTP              │
└────────┬─────────────────────────────┘
         │ POST com identifier + secret
         ↓
┌──────────────────────────────────────┐
│       API do WHMCS                   │
│   https://app.mysourei.com/...       │
│                                      │
│   - Valida credenciais               │
│   - Valida IP                        │
│   - Processa requisição              │
│   - Retorna JSON                     │
└──────────────────────────────────────┘
```

## Dois Modos de Uso

### 1. Via MCP (modo normal) - O que VOCÊ usa

**Como você interage:**
```bash
# Apenas conversando naturalmente
"Mostre os últimos 5 tickets"
"Qual o status do ticket #UGR-403714?"
"Liste tickets abertos do departamento 13"
```

**O que acontece:**
- Claude Code identifica automaticamente qual tool usar
- Extrai os parâmetros da sua pergunta
- Chama o MCP server
- Formata a resposta de forma legível

**Vantagens:**
- Natural e fácil
- Não precisa saber nomes de funções ou parâmetros
- Claude interpreta sua intenção
- Respostas formatadas e contextualizadas

### 2. Via Node Direto (modo desenvolvedor) - O que EU uso para TESTAR

**Como rodar:**
```bash
node -e "
import('./build/whmcs-client.js').then(async ({ WHMCSClient }) => {
  const client = new WHMCSClient({
    identifier: 'xxx',
    secret: 'yyy',
    apiUrl: 'https://...'
  });

  const tickets = await client.getTickets({ limitnum: 5 });
  console.log(tickets);
});
"
```

**O que acontece:**
- Chama o cliente da API diretamente
- Bypassa o MCP server
- Retorna JSON cru
- Útil para debugar

**Vantagens:**
- Teste rápido durante desenvolvimento
- Debug de problemas
- Validar que o cliente funciona antes de integrar ao MCP
- Ver resposta JSON completa

## Por que o comando é "gigantesco"?

Porque estou fazendo tudo em uma linha:

```javascript
// Versão expandida do que eu rodo:
import('./build/whmcs-client.js')           // 1. Importa módulo
  .then(async ({ WHMCSClient }) => {        // 2. Pega a classe
    const client = new WHMCSClient({        // 3. Cria instância
      identifier: 'xxx',                     // 4. Configura
      secret: 'yyy',
      apiUrl: 'https://...'
    });

    const tickets = await client.getTickets({ // 5. Chama método
      limitnum: 5
    });

    console.log(tickets);                    // 6. Mostra resultado
  })
  .catch(console.error);                     // 7. Trata erros
```

Tudo isso em uma linha só porque `node -e` só aceita uma string.

## Build vs Runtime

### O que é o "build"?

```
src/                  →  npm run build  →  build/
├── index.ts              (TypeScript         ├── index.js
├── whmcs-client.ts        Compiler)          ├── whmcs-client.js
└── types.ts                                  └── types.js
```

**TypeScript** (src/) → **JavaScript** (build/)

### Por que precisa buildar?

1. **Node.js não entende TypeScript** nativamente
2. TypeScript precisa ser compilado para JavaScript
3. O MCP server roda o JavaScript compilado

### Quando buildar?

```bash
# Sempre que modificar código em src/
npm run build

# Ou deixar compilando automaticamente
npm run dev  # modo watch
```

## Fluxo Completo de Desenvolvimento

```
1. Escrever código TypeScript (src/)
        ↓
2. npm run build
        ↓
3. Código compilado (build/)
        ↓
4. Testar com node -e (opcional)
        ↓
5. MCP Server usa build/index.js
        ↓
6. Claude Code carrega o MCP
        ↓
7. Você usa normalmente conversando
```

## Exemplo Prático

### Como VOCÊ usa (via MCP):

```
Você: "Liste os últimos 3 tickets abertos"

Claude Code:
- Analisa sua pergunta
- Decide usar whmcs_get_tickets
- Define parâmetros: { limitnum: 3, status: "Open" }
- Chama MCP server
- Formata resposta

Resposta:
"Encontrei 3 tickets abertos:
1. #UGR-403714: Não consigo pegar o pombo
2. #EGY-948827: Teste notificação 5
3. #IIM-392965: Teste notificação 4"
```

### Como EU testo (direto):

```bash
$ node -e "import('./build/whmcs-client.js').then(async ({ WHMCSClient }) => {
  const client = new WHMCSClient({...});
  console.log(await client.getTickets({ limitnum: 3, status: 'Open' }));
});"

# Saída:
{
  "result": "success",
  "totalresults": 7,
  "tickets": { ... }
}
```

## Por que existem duas formas?

| Aspecto | Via MCP (seu uso) | Via Node (meu teste) |
|---------|-------------------|----------------------|
| Público | Usuário final | Desenvolvedor |
| Interface | Linguagem natural | Código JavaScript |
| Objetivo | Usar funcionalidade | Testar/debugar |
| Resposta | Formatada, contexto | JSON cru |
| Facilidade | Muito fácil | Requer conhecimento técnico |

## Resumo

**Você pergunta:** "Liste os tickets"
**Claude Code faz:** Chama a tool automaticamente
**Você vê:** Resposta formatada

**Eu testo com `node -e`:** Para garantir que o código funciona antes de você usar

É como a diferença entre:
- **Você**: Usar um aplicativo no celular (toque na tela)
- **Eu**: Testar o código do aplicativo (escrever e rodar comandos)

Ambos chegam no mesmo resultado, mas por caminhos diferentes! 🚀
