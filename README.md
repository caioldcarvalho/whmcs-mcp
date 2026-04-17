# WHMCS MCP Server

MCP (Model Context Protocol) server for full integration with the WHMCS API.

## Features

### Tickets and Support
- List tickets with advanced filters
- View full ticket details (including replies and notes)
- Create new tickets
- Add replies to tickets
- Update ticket properties
- List support departments
- View ticket statuses with counts
- Full ticket statistics

### Clients
- List clients with filters and pagination
- View full client details (with stats)

### Products and Orders
- List available products/services
- List orders with filters

### Invoices
- List invoices with filters and sorting

### General
- Secure authentication via API credentials
- Fully typed with TypeScript
- 34 MCP tools implemented and tested

## Available Tools (34)

### Tickets
1. **whmcs_get_tickets** - List tickets with filters
2. **whmcs_get_ticket** - View a specific ticket with all replies
3. **whmcs_get_ticket_counts** - Ticket statistics and counts
4. **whmcs_open_ticket** - Create a new ticket
5. **whmcs_add_ticket_reply** - Reply to a ticket
6. **whmcs_update_ticket** - Update ticket properties

### Support
7. **whmcs_get_support_departments** - List departments
8. **whmcs_get_support_statuses** - View statuses with counts

### Clients
9. **whmcs_get_clients** - List clients
10. **whmcs_get_clients_details** - Full client details
11. **whmcs_get_clients_products** - Client products/services
12. **whmcs_get_clients_domains** - Client domains
13. **whmcs_get_contacts** - Client contacts
14. **whmcs_get_emails** - Email history

### Products, Orders, and Invoices
15. **whmcs_get_products** - List products/services
16. **whmcs_get_orders** - List orders
17. **whmcs_get_invoices** - List invoices

### Billing Analysis
18. **whmcs_find_invoice_gaps** - Find missing invoice months per client
19. **whmcs_list_clients_with_pending_invoices** - List clients with unpaid/overdue invoices

### System and Administration
20. **whmcs_get_activity_log** - Activity log (116k+ entries)
21. **whmcs_get_stats** - Full statistics (revenue, orders, tickets)
22. **whmcs_get_currencies** - Configured currencies
23. **whmcs_get_payment_methods** - Active payment methods
24. **whmcs_get_admin_users** - Admin users

### Combined Invoices
25. **whmcs_get_unpaid_invoices_detailed** - Unpaid invoices with client and product details
26. **whmcs_get_all_unpaid_invoices_complete** - All unpaid invoices with full details

### Service Management
27. **whmcs_module_suspend** - Suspend service
28. **whmcs_module_unsuspend** - Unsuspend service
29. **whmcs_module_terminate** - Terminate service permanently
30. **whmcs_module_create** - Provision service

### Order Management
31. **whmcs_accept_order** - Accept and activate order
32. **whmcs_cancel_order** - Cancel order
33. **whmcs_delete_order** - Delete order permanently
34. **whmcs_pending_order** - Set order as pending

## Quick Install

### Claude Code (one command)

```bash
claude mcp add whmcs \
  -e WHMCS_API_URL=https://your-whmcs.com/includes/api.php \
  -e WHMCS_IDENTIFIER=your_identifier \
  -e WHMCS_SECRET=your_secret \
  -- npx -y whmcs-mcp
```

Or with admin credentials instead of API keys:

```bash
claude mcp add whmcs \
  -e WHMCS_API_URL=https://your-whmcs.com/includes/api.php \
  -e WHMCS_USERNAME=your_admin_user \
  -e WHMCS_PASSWORD=your_admin_password \
  -- npx -y whmcs-mcp
```

That's it. Run `claude mcp list` to verify.

### Claude Desktop

Add to your `claude_desktop_config.json` ([location by OS](https://modelcontextprotocol.io/quickstart/user)):

```json
{
  "mcpServers": {
    "whmcs": {
      "command": "npx",
      "args": ["-y", "whmcs-mcp"],
      "env": {
        "WHMCS_API_URL": "https://your-whmcs.com/includes/api.php",
        "WHMCS_IDENTIFIER": "your_identifier",
        "WHMCS_SECRET": "your_secret"
      }
    }
  }
}
```

Restart Claude Desktop and the 34 tools will be available.

### Alternative: mcp.json file

If you prefer a config file instead of env vars, create `mcp.json` in the project root:

```bash
cp mcp.example.json mcp.json
# edit mcp.json with your credentials
```

When using admin credentials with `username`/`password`, the server automatically hashes the password with MD5 (WHMCS requirement). You can also provide an already MD5-hashed password.

### Adding credentials later

If you already added the MCP server but didn't have the credentials yet:

**Claude Code:** run `claude mcp add whmcs ...` again with the `-e` flags -- it overwrites the previous entry.

**Claude Desktop:** open `claude_desktop_config.json` and add the `env` block to the existing `whmcs` entry:

```json
"env": {
  "WHMCS_API_URL": "https://your-whmcs.com/includes/api.php",
  "WHMCS_IDENTIFIER": "your_identifier",
  "WHMCS_SECRET": "your_secret"
}
```

Then restart Claude Desktop.

## Usage Examples

In Claude Code, you can ask questions like:

**Tickets:**
- "List the last 10 open tickets"
- "Show details for ticket #123456"
- "How many tickets are awaiting response?"
- "Which support departments are available?"

**Clients:**
- "List the last 5 active clients"
- "Show details for client ID 123"
- "How many clients do we have total?"

**Products:**
- "List all available products"
- "Which products are in group 5?"

**Orders and Invoices:**
- "List the last 10 orders"
- "Show overdue invoices"

## Technologies

- TypeScript
- MCP SDK (@modelcontextprotocol/sdk)
- Axios (HTTP client)
- WHMCS API v1

## Project Structure

```
whmcs-mcp/
├── src/                # TypeScript source code
│   ├── index.ts        # MCP server (34 tools)
│   ├── config.ts       # Config loader (env vars → mcp.json)
│   ├── whmcs-client.ts # API client (34 methods)
│   └── types.ts        # TypeScript types
├── test/               # Unit tests
├── build/              # Compiled output
├── mcp.example.json    # Config file template (optional)
└── package.json
```

## Development

```bash
# Watch mode (auto rebuild)
npm run dev

# Manual build
npm run build

# Run the MCP server with the default mcp.json
node build/index.js

# Run with a custom config path
node build/index.js --config /absolute/path/mcp.json

# Test client directly
node -e "import('./build/whmcs-client.js').then(async ({WHMCSClient}) => { ... })"
```

## Requirements

- Node.js >= 18
- WHMCS account with API enabled
- WHMCS API Identifier and Secret
- IP authorized in the WHMCS API

## Project Status

- **34 MCP tools implemented and tested**
- Complete TypeScript client
- Tested in production with real data
- Full coverage of main WHMCS endpoints

## Completed Implementations

### Tickets and Support (8 tools)
- GetTickets, GetTicket, GetTicketCounts
- OpenTicket, AddTicketReply, UpdateTicket
- GetSupportDepartments, GetSupportStatuses

### Clients (6 tools)
- GetClients, GetClientsDetails
- GetClientsProducts, GetClientsDomains
- GetContacts, GetEmails

### Products and Sales (3 tools)
- GetProducts, GetOrders, GetInvoices

### System and Admin (5 tools)
- GetActivityLog (116k+ entries tested)
- GetStats (revenue, orders, tickets)
- GetCurrencies, GetPaymentMethods
- GetAdminUsers

### Combined Invoices (2 tools)
- GetUnpaidInvoicesDetailed, GetAllUnpaidInvoicesComplete

### Billing Analysis (2 tools)
- FindInvoiceGaps, ListClientsWithPendingInvoices

### Service Management (4 tools)
- ModuleSuspend, ModuleUnsuspend, ModuleTerminate, ModuleCreate

### Order Management (4 tools)
- AcceptOrder, CancelOrder, DeleteOrder, PendingOrder

## License

MIT

## Author

Built for WHMCS integration via Model Context Protocol.
