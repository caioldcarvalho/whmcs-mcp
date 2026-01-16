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
- 🚀 32 tools MCP implementadas e testadas

## Tools Disponíveis (32)

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
11. **whmcs_get_clients_products** - Produtos/serviços de um cliente
12. **whmcs_get_clients_domains** - Domínios de um cliente
13. **whmcs_get_contacts** - Contatos de clientes
14. **whmcs_get_emails** - Histórico de emails enviados

### Produtos, Pedidos e Faturas
15. **whmcs_get_products** - Listar produtos/serviços
16. **whmcs_get_orders** - Listar pedidos
17. **whmcs_get_invoices** - Listar faturas

### Sistema e Administração
18. **whmcs_get_activity_log** - Log de atividades (116k+ entradas)
19. **whmcs_get_stats** - Estatísticas completas (receitas, pedidos, tickets)
20. **whmcs_get_currencies** - Moedas configuradas
21. **whmcs_get_payment_methods** - Métodos de pagamento ativos
22. **whmcs_get_admin_users** - Usuários administradores

### Faturas Combinadas
23. **whmcs_get_unpaid_invoices_detailed** - Faturas não pagas com detalhes de cliente e produtos
24. **whmcs_get_all_unpaid_invoices_complete** - Todas as faturas não pagas com detalhes completos

### Gerenciamento de Serviços
25. **whmcs_module_suspend** - Suspender serviço
26. **whmcs_module_unsuspend** - Reativar serviço suspenso
27. **whmcs_module_terminate** - Encerrar serviço permanentemente
28. **whmcs_module_create** - Provisionar serviço

### Gerenciamento de Pedidos
29. **whmcs_accept_order** - Aceitar e ativar pedido
30. **whmcs_cancel_order** - Cancelar pedido
31. **whmcs_delete_order** - Excluir pedido permanentemente
32. **whmcs_pending_order** - Definir pedido como pendente

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
- [✅ Evaluation](.docs/evaluation.xml) - Conjunto de perguntas para avaliação

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
│   ├── index.ts        # Servidor MCP (32 tools)
│   ├── whmcs-client.ts # Cliente API (32 métodos)
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

- ✅ **32 tools MCP implementadas e testadas**
- ✅ Cliente TypeScript completo
- ✅ Documentação completa
- ✅ Testado em produção com dados reais
- ✅ Cobertura completa dos principais endpoints WHMCS

## Implementações Completas

### ✅ Tickets e Suporte (8 tools)
- GetTickets, GetTicket, GetTicketCounts
- OpenTicket, AddTicketReply, UpdateTicket
- GetSupportDepartments, GetSupportStatuses

### ✅ Clientes (6 tools)
- GetClients, GetClientsDetails
- GetClientsProducts, GetClientsDomains
- GetContacts, GetEmails

### ✅ Produtos e Vendas (3 tools)
- GetProducts, GetOrders, GetInvoices

### ✅ Sistema e Admin (5 tools)
- GetActivityLog (116k+ entradas testadas)
- GetStats (receitas, pedidos, tickets)
- GetCurrencies, GetPaymentMethods
- GetAdminUsers

### ✅ Faturas Combinadas (2 tools)
- GetUnpaidInvoicesDetailed, GetAllUnpaidInvoicesComplete

### ✅ Gestão de Serviços (4 tools)
- ModuleSuspend, ModuleUnsuspend, ModuleTerminate, ModuleCreate

### ✅ Gestão de Pedidos (4 tools)
- AcceptOrder, CancelOrder, DeleteOrder, PendingOrder

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
