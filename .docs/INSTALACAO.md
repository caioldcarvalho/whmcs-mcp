# Instalação e Configuração do WHMCS MCP

## Pré-requisitos

- Node.js v18 ou superior
- npm ou yarn
- Claude Desktop instalado
- Credenciais da API WHMCS (Identifier e Secret)

## Passo 1: Clonar e Instalar

```bash
cd /home/caio/workspace/whmcs-mcp
npm install
npm run build
```

## Passo 2: Configurar Variáveis de Ambiente

O arquivo `.env` já deve estar configurado com:

```env
WHMCS_IDENTIFIER=seu_identifier_aqui
WHMCS_SECRET=seu_secret_aqui
WHMCS_API_URL=https://seu-whmcs.com/includes/api.php
```

## Passo 3: Configurar no Claude Code

Edite o arquivo de configuração do Claude Code:

**Linux/Mac:**
```bash
nano ~/.config/Claude/config.json
```

**Windows:**
```
%APPDATA%\Claude\config.json
```

Adicione a configuração do MCP:

```json
{
  "mcpServers": {
    "whmcs": {
      "command": "node",
      "args": [
        "/home/caio/workspace/whmcs-mcp/build/index.js"
      ],
      "env": {
        "WHMCS_IDENTIFIER": "aMvKSwNh0hfZeWE1716X7EAnfuruyaXm",
        "WHMCS_SECRET": "5nJFHNQPSXG90ZNkpiOFXkSPkrObOSDH",
        "WHMCS_API_URL": "https://app.mysourei.com/includes/api.php"
      }
    }
  }
}
```

**Nota:** Substitua o caminho absoluto e as credenciais pelos seus valores reais.

## Passo 4: Reiniciar Claude Code

Feche completamente o Claude Code e abra novamente para carregar o novo MCP server.

Ou use o comando:
```bash
# Recarregar configuração (se disponível)
claude-code reload
```

## Passo 5: Verificar Instalação

No Claude Code, você deve ver as seguintes tools disponíveis:

- 🎫 **whmcs_get_tickets** - Listar tickets
- 🔍 **whmcs_get_ticket** - Ver detalhes de um ticket
- ✨ **whmcs_open_ticket** - Criar novo ticket
- 💬 **whmcs_add_ticket_reply** - Responder ticket
- 📝 **whmcs_update_ticket** - Atualizar ticket

## Testando as Tools

### Teste 1: Listar Tickets

```
Liste os 5 últimos tickets abertos
```

O Claude deve usar a tool `whmcs_get_tickets` com:
```json
{
  "limitnum": 5,
  "status": "Open"
}
```

### Teste 2: Ver Detalhes de um Ticket

```
Mostre os detalhes completos do ticket #516757
```

O Claude deve usar a tool `whmcs_get_ticket` com:
```json
{
  "ticketnum": "516757"
}
```

### Teste 3: Criar um Ticket (CUIDADO - cria ticket real!)

```
Crie um ticket de teste no departamento 1 com o assunto "Teste MCP"
```

O Claude deve usar a tool `whmcs_open_ticket` com:
```json
{
  "deptid": 1,
  "subject": "Teste MCP",
  "message": "Este é um ticket de teste criado via MCP",
  "name": "Sistema MCP",
  "email": "teste@example.com"
}
```

## Troubleshooting

### MCP Server não aparece no Claude

1. Verifique se o caminho no `claude_desktop_config.json` está correto
2. Certifique-se de que o projeto foi compilado (`npm run build`)
3. Verifique os logs do Claude Desktop

### Erros de Autenticação

1. Confirme que as credenciais no `.env` ou `claude_desktop_config.json` estão corretas
2. Teste as credenciais diretamente na API do WHMCS
3. Verifique se o IP está autorizado nas configurações de API do WHMCS

### Erros de Tipo/Compilação

```bash
npm run build
```

Se houver erros, revise os arquivos TypeScript em `src/`.

## Desenvolvimento

Para desenvolvimento ativo:

```bash
npm run dev
```

Isso manterá o TypeScript compilando automaticamente em modo watch.

## Estrutura do Projeto

```
whmcs-mcp/
├── .docs/              # Documentação
│   ├── ROADMAP.md
│   ├── API_REFERENCE.md
│   └── INSTALACAO.md
├── src/                # Código-fonte TypeScript
│   ├── index.ts        # Servidor MCP principal
│   ├── whmcs-client.ts # Cliente da API WHMCS
│   └── types.ts        # Definições de tipos
├── build/              # Código compilado (gerado)
├── .env                # Variáveis de ambiente
├── package.json
└── tsconfig.json
```

## Próximos Passos

1. Teste todas as 5 tools implementadas
2. Adicione tratamento de erros mais robusto
3. Implemente ferramentas adicionais (departamentos, anexos, etc.)
4. Adicione validação de parâmetros
5. Melhore a formatação das respostas
