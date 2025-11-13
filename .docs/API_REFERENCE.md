# WHMCS API Reference - Tickets

Documentação detalhada dos endpoints da API WHMCS para gerenciamento de tickets.

## Autenticação

Todas as requisições devem incluir:
- `identifier`: WHMCS API Identifier
- `secret`: WHMCS API Secret
- `action`: Nome do endpoint
- `responsetype`: "json" (recomendado)

## Endpoints Implementados

### 1. GetTickets

**Propósito**: Obter lista de tickets com filtros

**Parâmetros Obrigatórios:**
- `action`: "GetTickets"

**Parâmetros Opcionais:**

| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|--------|
| limitstart | int | Offset para paginação | 0 |
| limitnum | int | Número de registros | 25 |
| deptid | int | Filtrar por departamento | - |
| clientid | int | Filtrar por cliente | - |
| email | string | Buscar por email (não-cliente) | - |
| status | string | Filtrar por status | - |
| subject | string | Buscar no assunto (aproximado) | - |
| ignore_dept_assignments | bool | Ignorar restrições de departamento | false |

**Resposta:**
```json
{
  "result": "success",
  "totalresults": 100,
  "startnumber": 0,
  "numreturned": 25,
  "tickets": {
    "ticket": [
      {
        "id": "1",
        "tid": "516757",
        "deptid": "1",
        "userid": "1",
        "name": "Nome do Cliente",
        "email": "cliente@example.com",
        "subject": "Assunto do Ticket",
        "status": "Open",
        "priority": "Medium",
        "date": "2024-01-01 10:00:00",
        "lastreply": "2024-01-01 15:00:00",
        "flag": "0",
        "requestor_name": "Nome Solicitante",
        "requestor_type": "Owner",
        "requestor_email": "solicitante@example.com",
        "owner_name": "Admin Name",
        "attachments": ""
      }
    ]
  }
}
```

---

### 2. GetTicket

**Propósito**: Obter detalhes completos de um ticket específico

**Parâmetros Obrigatórios:**
- `action`: "GetTicket"
- `ticketid` (int) OU `ticketnum` (string): ID ou número do ticket

**Parâmetros Opcionais:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| repliessort | string | Ordenar respostas: "ASC" ou "DESC" |

**Resposta:**
```json
{
  "result": "success",
  "ticketid": "1",
  "tid": "516757",
  "c": "ABC123",
  "deptid": "1",
  "deptname": "Suporte",
  "userid": "1",
  "contactid": "0",
  "name": "Nome do Cliente",
  "email": "cliente@example.com",
  "subject": "Assunto do Ticket",
  "status": "Open",
  "priority": "Medium",
  "date": "2024-01-01 10:00:00",
  "lastreply": "2024-01-01 15:00:00",
  "requestor_name": "Nome",
  "requestor_type": "Owner",
  "requestor_email": "email@example.com",
  "admin": "Admin Name",
  "flag": "0",
  "service": "",
  "cc": "",
  "replies": {
    "reply": [
      {
        "replyid": "1",
        "userid": "1",
        "name": "Nome",
        "email": "email@example.com",
        "date": "2024-01-01 10:00:00",
        "message": "Mensagem do ticket",
        "attachment": "",
        "attachments": "",
        "admin": "",
        "rating": "0"
      }
    ]
  },
  "notes": {
    "note": []
  }
}
```

---

### 3. OpenTicket

**Propósito**: Criar um novo ticket

**Parâmetros Obrigatórios:**
- `action`: "OpenTicket"
- `deptid` (int): ID do departamento
- `subject` (string): Assunto do ticket
- `message` (string): Mensagem inicial

**Parâmetros Opcionais:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| clientid | int | ID do cliente |
| userid | int | ID do usuário (com clientid) |
| contactid | int | ID do contato (com clientid) |
| name | string | Nome (se não for cliente) |
| email | string | Email (se não for cliente) |
| priority | string | Prioridade: Low, Medium, High |
| created | string | Data/hora ISO8601 ou "YYYY-MM-DD HH:mm:ss" |
| serviceid | int | ID do serviço relacionado |
| domainid | int | ID do domínio relacionado |
| admin | bool | Indica se é ticket de admin |
| noemail | bool | Não enviar email de notificação |
| markdown | bool | Usar formatação markdown |
| customfields | string | Campos customizados (base64) |
| attachments | array | Anexos (base64 JSON) |
| preventClientClosure | bool | Impedir cliente de fechar |

**Resposta:**
```json
{
  "result": "success",
  "id": "1",
  "tid": "516757",
  "c": "ABC123"
}
```

---

### 4. AddTicketReply

**Propósito**: Adicionar resposta a um ticket existente

**Parâmetros Obrigatórios:**
- `action`: "AddTicketReply"
- `ticketid` (int): ID do ticket
- `message` (string): Conteúdo da resposta

**Parâmetros Opcionais:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| markdown | bool | Usar formatação markdown |
| clientid | int | ID do cliente |
| contactid | int | ID do contato |
| adminusername | string | Nome do admin |
| name | string | Nome (não-admin/cliente) |
| email | string | Email (não-admin/cliente) |
| status | string | Alterar status do ticket |
| noemail | bool | Não enviar email |
| customfields | string | Campos customizados (base64) |
| attachments | array | Anexos (base64 JSON) |
| created | string | Data/hora da resposta |

**Resposta:**
```json
{
  "result": "success"
}
```

---

### 5. UpdateTicket

**Propósito**: Atualizar propriedades de um ticket

**Parâmetros Obrigatórios:**
- `action`: "UpdateTicket"
- `ticketid` (int): ID do ticket

**Parâmetros Opcionais:**
- `deptid` (int): Novo departamento
- `subject` (string): Novo assunto
- `priority` (string): Nova prioridade
- `status` (string): Novo status
- `userid` (int): Novo cliente associado
- `flag` (int): ID do admin para flag
- `removeFlag` (bool): Remover flag

---

## Status de Tickets Comuns

- `Open` - Aberto
- `Answered` - Respondido
- `Customer-Reply` - Resposta do Cliente
- `Closed` - Fechado
- `On Hold` - Em Espera
- `In Progress` - Em Progresso

## Prioridades

- `Low` - Baixa
- `Medium` - Média
- `High` - Alta

## Códigos de Erro Comuns

- `Ticket ID Not Found` - ID do ticket não encontrado
- `Client ID Not Found` - ID do cliente não encontrado
- `Department Not Found` - Departamento não encontrado
- `You must provide either a ticket id or ticket number` - Necessário fornecer ID ou número do ticket
