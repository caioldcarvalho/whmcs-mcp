# WHMCS MCP Server - Roadmap

## Objetivo
Criar um servidor MCP (Model Context Protocol) para integração com a API do WHMCS, focando inicialmente em operações de tickets.

## Fases de Implementação

### Fase 1: Estrutura Base ✓
- [x] Configurar package.json e tsconfig.json
- [x] Criar estrutura de pastas
- [x] Documentar roadmap

### Fase 2: Cliente API Base
- [ ] Implementar cliente HTTP para WHMCS API
- [ ] Configurar autenticação (identifier + secret)
- [ ] Criar tipos TypeScript para respostas da API
- [ ] Implementar tratamento de erros

### Fase 3: Tools Básicas de Leitura
- [ ] **GetTickets** - Listar tickets com filtros
  - Parâmetros: limitstart, limitnum, clientid, deptid, status, subject, etc.
- [ ] **GetTicket** - Visualizar detalhes de um ticket específico
  - Parâmetros: ticketid, ticketnum

**Ponto de Teste 1**: Testar listagem e visualização de tickets

### Fase 4: Tools de Criação e Modificação
- [ ] **OpenTicket** - Criar novo ticket
  - Parâmetros: deptid, subject, message, clientid, priority, etc.
- [ ] **AddTicketReply** - Responder a um ticket
  - Parâmetros: ticketid, message, status, etc.

**Ponto de Teste 2**: Testar criação e resposta de tickets

### Fase 5: Tools de Gerenciamento
- [ ] **UpdateTicket** - Atualizar propriedades do ticket
  - Parâmetros: ticketid, deptid, status, subject, priority, etc.
- [ ] **AddTicketNote** - Adicionar nota interna
  - Parâmetros: ticketid, message, admin, etc.

**Ponto de Teste 3**: Testar atualização e notas

### Fase 6: Configuração MCP
- [ ] Criar configuração para instalação local
- [ ] Testar integração com Claude Desktop
- [ ] Documentar processo de instalação

### Fase 7: Tools Avançadas (Futuro)
- [ ] GetSupportDepartments - Listar departamentos
- [ ] GetSupportStatuses - Listar status disponíveis
- [ ] GetTicketAttachment - Download de anexos
- [ ] DeleteTicket - Excluir tickets
- [ ] MergeTicket - Mesclar tickets

## Tecnologias
- TypeScript
- MCP SDK (@modelcontextprotocol/sdk)
- Axios (HTTP client)
- dotenv (configuração)

## Configuração Necessária
Variáveis de ambiente no .env:
- `WHMCS_IDENTIFIER` - API Identifier
- `WHMCS_SECRET` - API Secret
- `WHMCS_API_URL` - URL da API WHMCS
