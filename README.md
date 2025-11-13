# WHMCS MCP Server

Servidor MCP (Model Context Protocol) para integração completa com a API do WHMCS.

## Características

### Tickets e Suporte
- ✅ Listar tickets com filtros avançados
- ✅ Visualizar detalhes completos de tickets (incluindo respostas e notas)
- ✅ Criar novos tickets
- ✅ Adicionar respostas a tickets
- ✅ Atualizar propriedades de tickets
- ✅ Listar departamentos de suporte
- ✅ Visualizar status de tickets com contadores
- ✅ Estatísticas completas de tickets

### Clientes
- ✅ Listar clientes com filtros e paginação
- ✅ Visualizar detalhes completos de clientes (com estatísticas)

### Produtos e Pedidos
- ✅ Listar produtos/serviços disponíveis
- ✅ Listar pedidos com filtros

### Faturas
- ✅ Listar faturas com filtros e ordenação

### Geral
- 🔒 Autenticação segura via API credentials
- 📝 Totalmente tipado com TypeScript
- 🚀 21 tools MCP implementadas e testadas

## Tools Disponíveis (21)

### Tickets
1. **whmcs_get_tickets** - Lista tickets com filtros
2. **whmcs_get_ticket** - Ver ticket específico com todas as respostas
3. **whmcs_get_ticket_counts** - Estatísticas e contadores de tickets
4. **whmcs_open_ticket** - Criar novo ticket
5. **whmcs_add_ticket_reply** - Responder ticket
6. **whmcs_update_ticket** - Atualizar propriedades

### Suporte
7. **whmcs_get_support_departments** - Listar departamentos
8. **whmcs_get_support_statuses** - Ver status com contadores

### Clientes
9. **whmcs_get_clients** - Listar clientes
10. **whmcs_get_clients_details** - Detalhes completos de um cliente

### Produtos e Pedidos
11. **whmcs_get_products** - Listar produtos/serviços
12. **whmcs_get_orders** - Listar pedidos

### Faturas
13. **whmcs_get_invoices** - Listar faturas

### Gestão de Clientes Estendida
14. **whmcs_get_clients_products** - Produtos/serviços de um cliente
15. **whmcs_get_clients_domains** - Domínios de um cliente

### Sistema e Administração
16. **whmcs_get_activity_log** - Log de atividades (116k+ entradas)
17. **whmcs_get_stats** - Estatísticas completas (receitas, pedidos, tickets)
18. **whmcs_get_currencies** - Moedas configuradas
19. **whmcs_get_payment_methods** - Métodos de pagamento ativos
20. **whmcs_get_admin_users** - Usuários administradores
21. **whmcs_get_contacts** - Contatos de clientes
22. **whmcs_get_emails** - Histórico de emails enviados

## Instalação Rápida

```bash
# Instalar dependências
npm install

# Compilar
npm run build

# Configurar .env com suas credenciais
```

## Configuração no Claude Code

```bash
# Adicionar MCP ao Claude Code
claude mcp add --transport stdio whmcs -- node /caminho/absoluto/whmcs-mcp/build/index.js

# Verificar
claude mcp list
```

Ou configure manualmente em `~/.config/Claude/config.json`:

```json
{
  "mcpServers": {
    "whmcs": {
      "command": "node",
      "args": ["/caminho/absoluto/whmcs-mcp/build/index.js"],
      "env": {
        "WHMCS_IDENTIFIER": "seu_identifier",
        "WHMCS_SECRET": "seu_secret",
        "WHMCS_API_URL": "https://seu-whmcs.com/includes/api.php"
      }
    }
  }
}
```

## Documentação

- [📋 Roadmap](.docs/ROADMAP.md) - Plano de desenvolvimento
- [📚 API Reference](.docs/API_REFERENCE.md) - Documentação completa da API WHMCS
- [📝 API Functions](.docs/API_FUNCTIONS.md) - Lista de todas as funções GET implementadas
- [⚙️ Instalação](.docs/INSTALACAO.md) - Guia detalhado de instalação
- [🔧 Troubleshooting](.docs/TROUBLESHOOTING.md) - Solução de problemas
- [🤔 Como Funciona](.docs/COMO_FUNCIONA.md) - Explicação da arquitetura

## Exemplo de Uso

No Claude Code, você pode fazer perguntas como:

**Tickets:**
- "Liste os últimos 10 tickets abertos"
- "Mostre os detalhes do ticket #123456"
- "Quantos tickets estão aguardando resposta?"
- "Quais são os departamentos de suporte disponíveis?"

**Clientes:**
- "Liste os últimos 5 clientes ativos"
- "Mostre os detalhes do cliente ID 123"
- "Quantos clientes temos no total?"

**Produtos:**
- "Liste todos os produtos disponíveis"
- "Quais produtos do grupo 5?"

**Pedidos e Faturas:**
- "Liste os últimos 10 pedidos"
- "Mostre as faturas em aberto"

## Tecnologias

- TypeScript
- MCP SDK (@modelcontextprotocol/sdk)
- Axios (HTTP client)
- WHMCS API v1

## Estrutura do Projeto

```
whmcs-mcp/
├── .docs/              # Documentação completa
│   ├── ROADMAP.md
│   ├── API_REFERENCE.md
│   ├── API_FUNCTIONS.md
│   ├── INSTALACAO.md
│   ├── TROUBLESHOOTING.md
│   └── COMO_FUNCIONA.md
├── src/                # Código-fonte TypeScript
│   ├── index.ts        # Servidor MCP (21 tools)
│   ├── whmcs-client.ts # Cliente API (21 métodos)
│   └── types.ts        # Tipos TypeScript completos
├── build/              # Código compilado
├── .env                # Configuração
└── package.json
```

## Desenvolvimento

```bash
# Modo watch (recompila automaticamente)
npm run dev

# Build manual
npm run build

# Testar cliente diretamente
node -e "import('./build/whmcs-client.js').then(async ({WHMCSClient}) => { ... })"
```

## Requisitos

- Node.js >= 18
- Conta WHMCS com API habilitada
- API Identifier e Secret do WHMCS
- IP autorizado na API do WHMCS

## Status do Projeto

- ✅ **21 funções GET implementadas e testadas**
- ✅ Cliente TypeScript completo
- ✅ Documentação completa
- ✅ Testado em produção com dados reais
- ✅ Cobertura completa dos principais endpoints WHMCS

## Implementações Completas

### ✅ Tickets e Suporte (8 tools)
- GetTickets, GetTicket, GetTicketCounts
- OpenTicket, AddTicketReply, UpdateTicket
- GetSupportDepartments, GetSupportStatuses

### ✅ Clientes (4 tools)
- GetClients, GetClientsDetails
- GetClientsProducts, GetClientsDomains

### ✅ Produtos e Vendas (3 tools)
- GetProducts, GetOrders, GetInvoices

### ✅ Sistema e Admin (6 tools)
- GetActivityLog (116k+ entradas testadas)
- GetStats (receitas, pedidos, tickets)
- GetCurrencies, GetPaymentMethods
- GetAdminUsers, GetContacts, GetEmails

## Próximas Implementações Sugeridas

Ver [API_FUNCTIONS.md](.docs/API_FUNCTIONS.md) para lista completa de funções disponíveis.

### Funções GET Adicionais
- GetTicketNotes, GetTicketAttachment
- GetAnnouncements, GetPromotions
- GetServers, GetProjects

### Funções de Ação
- AddTicketNote, DeleteTicket, MergeTicket
- ModuleSuspend, ModuleUnsuspend, ModuleTerminate

## Licença

MIT

## Autor

Desenvolvido para integração com WHMCS via Model Context Protocol.
