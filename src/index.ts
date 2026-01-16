#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { WHMCSClient } from './whmcs-client.js';
import { z } from 'zod';
import type {
  GetTicketsParams,
  GetTicketParams,
  OpenTicketParams,
  AddTicketReplyParams,
  UpdateTicketParams,
  GetSupportDepartmentsParams,
  GetSupportStatusesParams,
  GetTicketCountsParams,
  GetClientsParams,
  GetClientsDetailsParams,
  GetProductsParams,
  GetOrdersParams,
  GetInvoicesParams,
  GetClientsProductsParams,
  GetClientsDomainsParams,
  GetActivityLogParams,
  GetStatsParams,
  GetAdminUsersParams,
  GetContactsParams,
  GetEmailsParams,
  GetUnpaidInvoicesDetailedParams,
  GetAllUnpaidInvoicesCompleteParams,
  ModuleCommandParams,
  ModuleSuspendParams,
  AcceptOrderParams,
  CancelOrderParams,
  DeleteOrderParams,
  PendingOrderParams,
} from './types.js';

// Load environment variables
dotenv.config();

// Validate environment variables
const WHMCS_IDENTIFIER = process.env.WHMCS_IDENTIFIER;
const WHMCS_SECRET = process.env.WHMCS_SECRET;
const WHMCS_API_URL = process.env.WHMCS_API_URL;

if (!WHMCS_IDENTIFIER || !WHMCS_SECRET || !WHMCS_API_URL) {
  throw new Error(
    'Missing required environment variables: WHMCS_IDENTIFIER, WHMCS_SECRET, WHMCS_API_URL'
  );
}

// Initialize WHMCS client
const whmcsClient = new WHMCSClient({
  identifier: WHMCS_IDENTIFIER,
  secret: WHMCS_SECRET,
  apiUrl: WHMCS_API_URL,
});

const ResponseFormatSchema = z.enum(['markdown', 'json']).default('markdown');
type ResponseFormat = z.infer<typeof ResponseFormatSchema>;

const responseFormatProperty = {
  type: 'string',
  enum: ['markdown', 'json'],
  description: 'Output format: markdown or json (default: markdown)',
  default: 'markdown',
} as const;

const genericOutputSchema = {
  type: 'object',
  additionalProperties: true,
} as const;

function addResponseFormatToSchema(inputSchema: Tool['inputSchema']): Tool['inputSchema'] {
  const schema = inputSchema as {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
  const properties = schema.properties ?? {};
  return {
    ...schema,
    properties: {
      ...properties,
      response_format: responseFormatProperty,
    },
  };
}

function formatZodError(error: z.ZodError): string {
  return error.errors
    .map((issue) => {
      const path = issue.path.length ? issue.path.join('.') : 'input';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}

function parseToolArgs<T>(schema: z.ZodType<T>, args: unknown): T {
  const parsed = schema.safeParse(args ?? {});
  if (!parsed.success) {
    throw new Error(`Invalid arguments: ${formatZodError(parsed.error)}`);
  }
  return parsed.data;
}

type ToolOutput = {
  data: unknown;
  pagination?: Pagination;
};

function formatToolResponse(title: string, responseFormat: ResponseFormat, output: ToolOutput) {
  let text: string;
  if (responseFormat === 'markdown') {
    const lines = [`# ${title}`];
    const pagination = output.pagination;
    if (pagination) {
      lines.push('');
      lines.push(`- Total: ${pagination.total}`);
      lines.push(`- Returned: ${pagination.count}`);
      lines.push(`- Offset: ${pagination.offset}`);
      lines.push(`- Has more: ${pagination.has_more ? 'yes' : 'no'}`);
    }
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(output, null, 2));
    lines.push('```');
    text = lines.join('\n');
  } else {
    text = JSON.stringify(output, null, 2);
  }

  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
    structuredContent: output,
  };
}

type Pagination = {
  total: number;
  count: number;
  offset: number;
  has_more: boolean;
  next_offset?: number;
};

function buildPagination(total: number, count: number, offset: number): Pagination {
  const hasMore = total > offset + count;
  return {
    total,
    count,
    offset,
    has_more: hasMore,
    ...(hasMore ? { next_offset: offset + count } : {}),
  };
}

function wrapData(data: unknown, pagination?: Pagination): ToolOutput {
  if (!pagination) {
    return { data };
  }
  return {
    data,
    pagination,
  };
}

// Define tools with annotations
const rawTools: Tool[] = [
  {
    name: 'whmcs_get_tickets',
    description:
      'List support tickets from WHMCS with optional filters. Returns a paginated list of tickets with basic information.',
    inputSchema: {
      type: 'object',
      properties: {
        limitstart: {
          type: 'number',
          description: 'Starting offset for pagination (default: 0)',
        },
        limitnum: {
          type: 'number',
          description: 'Number of tickets to return (default: 25)',
        },
        deptid: {
          type: 'number',
          description: 'Filter by department ID',
        },
        clientid: {
          type: 'number',
          description: 'Filter by client ID',
        },
        email: {
          type: 'string',
          description: 'Filter by email address (for non-client tickets)',
        },
        status: {
          type: 'string',
          description: 'Filter by ticket status (e.g., Open, Answered, Closed)',
        },
        subject: {
          type: 'string',
          description: 'Search in ticket subject (approximate matching)',
        },
      },
    },
    annotations: {
      title: 'List Support Tickets',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_ticket',
    description:
      'Get detailed information about a specific ticket, including all replies and notes. Use either ticketid or ticketnum to identify the ticket.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketid: {
          type: 'number',
          description: 'Unique ticket ID (internal)',
        },
        ticketnum: {
          type: 'string',
          description: 'Client-facing ticket number',
        },
        repliessort: {
          type: 'string',
          enum: ['ASC', 'DESC'],
          description: 'Sort order for replies (ASC or DESC)',
        },
      },
    },
    annotations: {
      title: 'Get Ticket Details',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_open_ticket',
    description:
      'Create a new support ticket in WHMCS. Requires department ID, subject, and message. Can be associated with a client or created with custom name/email.',
    inputSchema: {
      type: 'object',
      properties: {
        deptid: {
          type: 'number',
          description: 'Department ID where the ticket will be created (required)',
        },
        subject: {
          type: 'string',
          description: 'Ticket subject (required)',
        },
        message: {
          type: 'string',
          description: 'Initial ticket message (required)',
        },
        clientid: {
          type: 'number',
          description: 'Client ID to associate the ticket with',
        },
        userid: {
          type: 'number',
          description: 'User ID (when clientid is provided)',
        },
        contactid: {
          type: 'number',
          description: 'Contact ID (when clientid is provided)',
        },
        name: {
          type: 'string',
          description: 'Name of ticket opener (if not a client)',
        },
        email: {
          type: 'string',
          description: 'Email of ticket opener (if not a client)',
        },
        priority: {
          type: 'string',
          enum: ['Low', 'Medium', 'High'],
          description: 'Ticket priority level',
        },
        serviceid: {
          type: 'number',
          description: 'Associated service ID',
        },
        domainid: {
          type: 'number',
          description: 'Associated domain ID',
        },
        markdown: {
          type: 'boolean',
          description: 'Use markdown formatting in message',
        },
        noemail: {
          type: 'boolean',
          description: 'Do not send email notification',
        },
      },
      required: ['deptid', 'subject', 'message'],
    },
    annotations: {
      title: 'Create Support Ticket',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_add_ticket_reply',
    description:
      'Add a reply to an existing support ticket. Can be posted by admin, client, or with custom name/email.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketid: {
          type: 'number',
          description: 'Ticket ID to reply to (required)',
        },
        message: {
          type: 'string',
          description: 'Reply message content (required)',
        },
        clientid: {
          type: 'number',
          description: 'Client ID posting the reply',
        },
        contactid: {
          type: 'number',
          description: 'Contact ID posting the reply',
        },
        adminusername: {
          type: 'string',
          description: 'Admin username posting the reply',
        },
        name: {
          type: 'string',
          description: 'Name for reply (if not admin/client)',
        },
        email: {
          type: 'string',
          description: 'Email for reply (if not admin/client)',
        },
        status: {
          type: 'string',
          description: 'Change ticket status with this reply',
        },
        markdown: {
          type: 'boolean',
          description: 'Use markdown formatting in message',
        },
        noemail: {
          type: 'boolean',
          description: 'Do not send email notification',
        },
      },
      required: ['ticketid', 'message'],
    },
    annotations: {
      title: 'Add Ticket Reply',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_update_ticket',
    description:
      'Update properties of an existing ticket such as department, subject, priority, status, or flag.',
    inputSchema: {
      type: 'object',
      properties: {
        ticketid: {
          type: 'number',
          description: 'Ticket ID to update (required)',
        },
        deptid: {
          type: 'number',
          description: 'New department ID',
        },
        subject: {
          type: 'string',
          description: 'New ticket subject',
        },
        priority: {
          type: 'string',
          enum: ['Low', 'Medium', 'High'],
          description: 'New priority level',
        },
        status: {
          type: 'string',
          description: 'New ticket status',
        },
        userid: {
          type: 'number',
          description: 'New client ID to associate',
        },
        flag: {
          type: 'number',
          description: 'Admin ID to flag ticket to',
        },
        removeFlag: {
          type: 'boolean',
          description: 'Remove existing flag',
        },
      },
      required: ['ticketid'],
    },
    annotations: {
      title: 'Update Ticket',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  // Support Tools
  {
    name: 'whmcs_get_support_departments',
    description: 'List all support departments available in WHMCS.',
    inputSchema: {
      type: 'object',
      properties: {
        ignore_dept_assignments: {
          type: 'boolean',
          description: 'Ignore department assignments for the API user',
        },
      },
    },
    annotations: {
      title: 'List Support Departments',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_support_statuses',
    description: 'Get ticket status counts and colors.',
    inputSchema: {
      type: 'object',
      properties: {
        deptid: {
          type: 'number',
          description: 'Get counts for specific department ID',
        },
      },
    },
    annotations: {
      title: 'Get Support Statuses',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_ticket_counts',
    description: 'Get comprehensive ticket statistics and counts.',
    inputSchema: {
      type: 'object',
      properties: {
        ignoreDepartmentAssignments: {
          type: 'boolean',
          description: 'Ignore department assignments',
        },
        includeCountsByStatus: {
          type: 'boolean',
          description: 'Include counts grouped by status',
        },
      },
    },
    annotations: {
      title: 'Get Ticket Counts',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  // Client Tools
  {
    name: 'whmcs_get_clients',
    description: 'List clients with optional filters and pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        limitstart: {
          type: 'number',
          description: 'Starting offset for pagination',
        },
        limitnum: {
          type: 'number',
          description: 'Number of clients to return',
        },
        sorting: {
          type: 'string',
          enum: ['ASC', 'DESC'],
          description: 'Sort direction',
        },
        status: {
          type: 'string',
          enum: ['Active', 'Inactive', 'Closed'],
          description: 'Filter by status',
        },
        search: {
          type: 'string',
          description: 'Search term for email, name, or company',
        },
        orderby: {
          type: 'string',
          enum: ['id', 'firstname', 'lastname', 'companyname', 'email', 'groupid', 'datecreated', 'status'],
          description: 'Field to sort by',
        },
      },
    },
    annotations: {
      title: 'List Clients',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_clients_details',
    description: 'Get detailed information about a specific client, including stats.',
    inputSchema: {
      type: 'object',
      properties: {
        clientid: {
          type: 'number',
          description: 'Client ID to retrieve',
        },
        email: {
          type: 'string',
          description: 'Client email to search by',
        },
        stats: {
          type: 'boolean',
          description: 'Include additional client statistics',
        },
      },
    },
    annotations: {
      title: 'Get Client Details',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  // Product Tools
  {
    name: 'whmcs_get_products',
    description: 'List products/services available in WHMCS.',
    inputSchema: {
      type: 'object',
      properties: {
        pid: {
          type: ['number', 'string'],
          description: 'Specific product ID or comma-separated list',
        },
        gid: {
          type: 'number',
          description: 'Filter by product group ID',
        },
        module: {
          type: 'string',
          description: 'Filter by module name',
        },
      },
    },
    annotations: {
      title: 'List Products',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  // Order Tools
  {
    name: 'whmcs_get_orders',
    description: 'List orders with optional filters.',
    inputSchema: {
      type: 'object',
      properties: {
        limitstart: {
          type: 'number',
          description: 'Starting offset for pagination',
        },
        limitnum: {
          type: 'number',
          description: 'Number of orders to return',
        },
        id: {
          type: 'number',
          description: 'Specific order ID',
        },
        userid: {
          type: 'number',
          description: 'Filter by client ID',
        },
        requestor_id: {
          type: 'number',
          description: 'Filter by requestor ID',
        },
        status: {
          type: 'string',
          description: 'Filter by order status',
        },
      },
    },
    annotations: {
      title: 'List Orders',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  // Invoice Tools
  {
    name: 'whmcs_get_invoices',
    description: 'List invoices with optional filters and sorting.',
    inputSchema: {
      type: 'object',
      properties: {
        limitstart: {
          type: 'number',
          description: 'Starting offset for pagination',
        },
        limitnum: {
          type: 'number',
          description: 'Number of invoices to return',
        },
        userid: {
          type: 'number',
          description: 'Filter by client ID',
        },
        status: {
          type: 'string',
          description: 'Filter by invoice status (including Overdue)',
        },
        orderby: {
          type: 'string',
          enum: ['id', 'invoicenumber', 'date', 'duedate', 'total', 'status'],
          description: 'Field to sort by',
        },
        order: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order',
        },
      },
    },
    annotations: {
      title: 'List Invoices',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  // Extended Client Tools
  {
    name: 'whmcs_get_clients_products',
    description: 'Get products/services for a client.',
    inputSchema: {
      type: 'object',
      properties: {
        limitstart: { type: 'number' },
        limitnum: { type: 'number' },
        clientid: { type: 'number', description: 'Filter by client ID' },
        serviceid: { type: 'number', description: 'Specific service ID' },
        pid: { type: 'number', description: 'Product ID filter' },
        domain: { type: 'string', description: 'Domain name filter' },
        username2: { type: 'string' },
      },
    },
    annotations: {
      title: 'Get Client Products',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_clients_domains',
    description: 'Get domains for a client.',
    inputSchema: {
      type: 'object',
      properties: {
        limitstart: { type: 'number' },
        limitnum: { type: 'number' },
        clientid: { type: 'number', description: 'Filter by client ID' },
        domainid: { type: 'number', description: 'Specific domain ID' },
        domain: { type: 'string', description: 'Domain name filter' },
      },
    },
    annotations: {
      title: 'Get Client Domains',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  // System Tools
  {
    name: 'whmcs_get_activity_log',
    description: 'Get system activity log entries.',
    inputSchema: {
      type: 'object',
      properties: {
        limitstart: { type: 'number' },
        limitnum: { type: 'number' },
        clientid: { type: 'number' },
        date: { type: 'string', description: 'Date filter (localized format)' },
        user: { type: 'string', description: 'Username/email filter' },
        description: { type: 'string', description: 'Search in description' },
        ipaddress: { type: 'string', description: 'IP address filter' },
      },
    },
    annotations: {
      title: 'Get Activity Log',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_stats',
    description: 'Get comprehensive system statistics including income, orders, tickets.',
    inputSchema: {
      type: 'object',
      properties: {
        timeline_days: { type: 'number', description: 'Days of timeline data (max 90)' },
      },
    },
    annotations: {
      title: 'Get System Statistics',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_currencies',
    description: 'List all configured currencies.',
    inputSchema: { type: 'object', properties: {} },
    annotations: {
      title: 'List Currencies',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_payment_methods',
    description: 'List active payment methods.',
    inputSchema: { type: 'object', properties: {} },
    annotations: {
      title: 'List Payment Methods',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_admin_users',
    description: 'List administrator users.',
    inputSchema: {
      type: 'object',
      properties: {
        roleid: { type: 'number', description: 'Filter by role ID' },
        email: { type: 'string', description: 'Email filter (partial match)' },
        include_disabled: { type: 'boolean', description: 'Include disabled admins' },
      },
    },
    annotations: {
      title: 'List Admin Users',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_contacts',
    description: 'List client contacts with filters.',
    inputSchema: {
      type: 'object',
      properties: {
        limitstart: { type: 'number' },
        limitnum: { type: 'number' },
        userid: { type: 'number', description: 'Filter by client ID' },
        firstname: { type: 'string' },
        lastname: { type: 'string' },
        companyname: { type: 'string' },
        email: { type: 'string' },
        phonenumber: { type: 'string' },
        address1: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string' },
      },
    },
    annotations: {
      title: 'List Contacts',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_emails',
    description: 'Get emails sent to a client.',
    inputSchema: {
      type: 'object',
      properties: {
        clientid: { type: 'number', description: 'Client ID (required)' },
        limitstart: { type: 'number' },
        limitnum: { type: 'number' },
        date: { type: 'string', description: 'Date filter' },
        subject: { type: 'string', description: 'Subject search' },
      },
      required: ['clientid'],
    },
    annotations: {
      title: 'Get Client Emails',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  // Custom Combined Tools
  {
    name: 'whmcs_get_unpaid_invoices_detailed',
    description: 'Get all unpaid and overdue invoices with detailed information including client name, email, phone number, associated products, and invoice details. This tool automatically fetches and combines data from multiple API endpoints.',
    inputSchema: {
      type: 'object',
      properties: {
        limitstart: {
          type: 'number',
          description: 'Starting offset for pagination (default: 0)',
        },
        limitnum: {
          type: 'number',
          description: 'Number of invoices to return (default: 20)',
        },
      },
    },
    annotations: {
      title: 'Get Unpaid Invoices (Detailed)',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_get_all_unpaid_invoices_complete',
    description: 'Get ALL unpaid invoices with complete information: client details, invoice data, specific product for each invoice item, amount, and phone number. Lists unpaid and overdue invoices with complete product details.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum invoices to fetch (default: 1000, max: 5000)',
          minimum: 1,
          maximum: 5000
        },
        offset: {
          type: 'number',
          description: 'Number of invoices to skip before returning results (default: 0)',
          minimum: 0,
        },
      },
    },
    annotations: {
      title: 'Get All Unpaid Invoices (Complete)',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  // Service Management Tools
  {
    name: 'whmcs_module_suspend',
    description: 'Suspend a client service/product. This will run the module suspend action and update the service status to Suspended. Use with caution as it affects client access.',
    inputSchema: {
      type: 'object',
      properties: {
        serviceid: {
          type: 'number',
          description: 'The service ID to suspend (required)',
        },
        suspendreason: {
          type: 'string',
          description: 'Reason for suspension (e.g., "Non-payment", "Abuse", "Requested by client")',
        },
      },
      required: ['serviceid'],
    },
    annotations: {
      title: 'Suspend Service',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_module_unsuspend',
    description: 'Unsuspend a previously suspended client service/product. This will run the module unsuspend action and update the service status back to Active.',
    inputSchema: {
      type: 'object',
      properties: {
        serviceid: {
          type: 'number',
          description: 'The service ID to unsuspend (required)',
        },
      },
      required: ['serviceid'],
    },
    annotations: {
      title: 'Unsuspend Service',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_module_terminate',
    description: 'Terminate a client service/product permanently. WARNING: This is irreversible and will delete the service on the server. Use only when absolutely certain.',
    inputSchema: {
      type: 'object',
      properties: {
        serviceid: {
          type: 'number',
          description: 'The service ID to terminate (required)',
        },
      },
      required: ['serviceid'],
    },
    annotations: {
      title: 'Terminate Service',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_module_create',
    description: 'Provision/create a client service on the server. This runs the module create action to set up the service (e.g., create hosting account, provision VPS).',
    inputSchema: {
      type: 'object',
      properties: {
        serviceid: {
          type: 'number',
          description: 'The service ID to provision (required)',
        },
      },
      required: ['serviceid'],
    },
    annotations: {
      title: 'Create/Provision Service',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  // Order Management Tools
  {
    name: 'whmcs_accept_order',
    description: 'Accept and activate a pending order. This will provision services, register domains, and send welcome emails as configured.',
    inputSchema: {
      type: 'object',
      properties: {
        orderid: {
          type: 'number',
          description: 'The order ID to accept (required)',
        },
        serverid: {
          type: 'number',
          description: 'Server ID to provision services on (overrides product default)',
        },
        serviceusername: {
          type: 'string',
          description: 'Username for the service (overrides auto-generated)',
        },
        servicepassword: {
          type: 'string',
          description: 'Password for the service (overrides auto-generated)',
        },
        registrar: {
          type: 'string',
          description: 'Registrar module for domain registration',
        },
        autosetup: {
          type: 'boolean',
          description: 'Whether to automatically provision services (default: true)',
        },
        sendemail: {
          type: 'boolean',
          description: 'Whether to send order confirmation email (default: true)',
        },
      },
      required: ['orderid'],
    },
    annotations: {
      title: 'Accept Order',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_cancel_order',
    description: 'Cancel an order. This will cancel all associated services and domains.',
    inputSchema: {
      type: 'object',
      properties: {
        orderid: {
          type: 'number',
          description: 'The order ID to cancel (required)',
        },
        cancelsub: {
          type: 'boolean',
          description: 'Also cancel any associated subscriptions',
        },
        noemail: {
          type: 'boolean',
          description: 'Do not send cancellation email to client',
        },
      },
      required: ['orderid'],
    },
    annotations: {
      title: 'Cancel Order',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_delete_order',
    description: 'Permanently delete an order from the system. WARNING: This is irreversible and removes all record of the order.',
    inputSchema: {
      type: 'object',
      properties: {
        orderid: {
          type: 'number',
          description: 'The order ID to delete (required)',
        },
      },
      required: ['orderid'],
    },
    annotations: {
      title: 'Delete Order',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: 'whmcs_pending_order',
    description: 'Set an order back to Pending status. Useful for orders that need review or were incorrectly processed.',
    inputSchema: {
      type: 'object',
      properties: {
        orderid: {
          type: 'number',
          description: 'The order ID to set as pending (required)',
        },
      },
      required: ['orderid'],
    },
    annotations: {
      title: 'Set Order Pending',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
];

const tools: Tool[] = rawTools.map((tool) => ({
  ...tool,
  inputSchema: addResponseFormatToSchema(tool.inputSchema),
  outputSchema: genericOutputSchema,
}));

const toolTitleByName = new Map<string, string>(
  rawTools.map((tool) => [tool.name, tool.annotations?.title ?? tool.name])
);

const zNonNegativeInt = z.number().int().min(0);
const zPositiveInt = z.number().int().min(1);

const withResponseFormat = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object({
      ...shape,
      response_format: ResponseFormatSchema,
    })
    .strict();

const getTicketsSchema = withResponseFormat({
  limitstart: zNonNegativeInt.optional(),
  limitnum: zPositiveInt.optional(),
  deptid: zPositiveInt.optional(),
  clientid: zPositiveInt.optional(),
  email: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  ignore_dept_assignments: z.boolean().optional(),
});

const getTicketSchema = withResponseFormat({
  ticketid: zPositiveInt.optional(),
  ticketnum: z.string().min(1).optional(),
  repliessort: z.enum(['ASC', 'DESC']).optional(),
}).superRefine((data, ctx) => {
  if (!data.ticketid && !data.ticketnum) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either ticketid or ticketnum must be provided',
      path: ['ticketid'],
    });
  }
});

const openTicketSchema = withResponseFormat({
  deptid: zPositiveInt,
  subject: z.string().min(1),
  message: z.string().min(1),
  clientid: zPositiveInt.optional(),
  userid: zPositiveInt.optional(),
  contactid: zPositiveInt.optional(),
  name: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  serviceid: zPositiveInt.optional(),
  domainid: zPositiveInt.optional(),
  markdown: z.boolean().optional(),
  noemail: z.boolean().optional(),
});

const addTicketReplySchema = withResponseFormat({
  ticketid: zPositiveInt,
  message: z.string().min(1),
  clientid: zPositiveInt.optional(),
  contactid: zPositiveInt.optional(),
  adminusername: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  markdown: z.boolean().optional(),
  noemail: z.boolean().optional(),
});

const updateTicketSchema = withResponseFormat({
  ticketid: zPositiveInt,
  deptid: zPositiveInt.optional(),
  subject: z.string().min(1).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  status: z.string().min(1).optional(),
  userid: zPositiveInt.optional(),
  flag: zPositiveInt.optional(),
  removeFlag: z.boolean().optional(),
});

const getSupportDepartmentsSchema = withResponseFormat({
  ignore_dept_assignments: z.boolean().optional(),
});

const getSupportStatusesSchema = withResponseFormat({
  deptid: zPositiveInt.optional(),
});

const getTicketCountsSchema = withResponseFormat({
  ignoreDepartmentAssignments: z.boolean().optional(),
  includeCountsByStatus: z.boolean().optional(),
});

const getClientsSchema = withResponseFormat({
  limitstart: zNonNegativeInt.optional(),
  limitnum: zPositiveInt.optional(),
  sorting: z.enum(['ASC', 'DESC']).optional(),
  status: z.enum(['Active', 'Inactive', 'Closed']).optional(),
  search: z.string().min(1).optional(),
  orderby: z
    .enum(['id', 'firstname', 'lastname', 'companyname', 'email', 'groupid', 'datecreated', 'status'])
    .optional(),
});

const getClientsDetailsSchema = withResponseFormat({
  clientid: zPositiveInt.optional(),
  email: z.string().email().optional(),
  stats: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (!data.clientid && !data.email) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either clientid or email must be provided',
      path: ['clientid'],
    });
  }
});

const getProductsSchema = withResponseFormat({
  pid: z.union([zPositiveInt, z.string().min(1)]).optional(),
  gid: zPositiveInt.optional(),
  module: z.string().min(1).optional(),
});

const getOrdersSchema = withResponseFormat({
  limitstart: zNonNegativeInt.optional(),
  limitnum: zPositiveInt.optional(),
  id: zPositiveInt.optional(),
  userid: zPositiveInt.optional(),
  requestor_id: zPositiveInt.optional(),
  status: z.string().min(1).optional(),
});

const getInvoicesSchema = withResponseFormat({
  limitstart: zNonNegativeInt.optional(),
  limitnum: zPositiveInt.optional(),
  userid: zPositiveInt.optional(),
  status: z.string().min(1).optional(),
  orderby: z.enum(['id', 'invoicenumber', 'date', 'duedate', 'total', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const getClientsProductsSchema = withResponseFormat({
  limitstart: zNonNegativeInt.optional(),
  limitnum: zPositiveInt.optional(),
  clientid: zPositiveInt.optional(),
  serviceid: zPositiveInt.optional(),
  pid: zPositiveInt.optional(),
  domain: z.string().min(1).optional(),
  username2: z.string().min(1).optional(),
});

const getClientsDomainsSchema = withResponseFormat({
  limitstart: zNonNegativeInt.optional(),
  limitnum: zPositiveInt.optional(),
  clientid: zPositiveInt.optional(),
  domainid: zPositiveInt.optional(),
  domain: z.string().min(1).optional(),
});

const getActivityLogSchema = withResponseFormat({
  limitstart: zNonNegativeInt.optional(),
  limitnum: zPositiveInt.optional(),
  clientid: zPositiveInt.optional(),
  date: z.string().min(1).optional(),
  user: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  ipaddress: z.string().min(1).optional(),
});

const getStatsSchema = withResponseFormat({
  timeline_days: zPositiveInt.max(90).optional(),
});

const getCurrenciesSchema = withResponseFormat({});
const getPaymentMethodsSchema = withResponseFormat({});

const getAdminUsersSchema = withResponseFormat({
  roleid: zPositiveInt.optional(),
  email: z.string().email().optional(),
  include_disabled: z.boolean().optional(),
});

const getContactsSchema = withResponseFormat({
  limitstart: zNonNegativeInt.optional(),
  limitnum: zPositiveInt.optional(),
  userid: zPositiveInt.optional(),
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  companyname: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phonenumber: z.string().min(1).optional(),
  address1: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
});

const getEmailsSchema = withResponseFormat({
  clientid: zPositiveInt,
  limitstart: zNonNegativeInt.optional(),
  limitnum: zPositiveInt.optional(),
  date: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
});

const getUnpaidInvoicesDetailedSchema = withResponseFormat({
  limitstart: zNonNegativeInt.optional(),
  limitnum: zPositiveInt.optional(),
});

const getAllUnpaidInvoicesCompleteSchema = withResponseFormat({
  limit: zPositiveInt.max(5000).optional(),
  offset: zNonNegativeInt.optional(),
});

const moduleSuspendSchema = withResponseFormat({
  serviceid: zPositiveInt,
  suspendreason: z.string().min(1).optional(),
});

const moduleCommandSchema = withResponseFormat({
  serviceid: zPositiveInt,
});

const acceptOrderSchema = withResponseFormat({
  orderid: zPositiveInt,
  serverid: zPositiveInt.optional(),
  serviceusername: z.string().min(1).optional(),
  servicepassword: z.string().min(1).optional(),
  registrar: z.string().min(1).optional(),
  autosetup: z.boolean().optional(),
  sendemail: z.boolean().optional(),
});

const cancelOrderSchema = withResponseFormat({
  orderid: zPositiveInt,
  cancelsub: z.boolean().optional(),
  noemail: z.boolean().optional(),
});

const deleteOrderSchema = withResponseFormat({
  orderid: zPositiveInt,
});

const pendingOrderSchema = withResponseFormat({
  orderid: zPositiveInt,
});

// Create server instance
const server = new Server(
  {
    name: 'whmcs-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    const toolTitle = toolTitleByName.get(name) ?? name;

    switch (name) {
      case 'whmcs_get_tickets': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getTicketsSchema, args);
        const result = await whmcsClient.getTickets(params as GetTicketsParams);
        const count = Number(result.numreturned || result.tickets?.ticket?.length || 0);
        const offset = Number(result.startnumber ?? params.limitstart ?? 0);
        const total = Number(result.totalresults || 0);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      case 'whmcs_get_ticket': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getTicketSchema, args);
        const result = await whmcsClient.getTicket(params as GetTicketParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      case 'whmcs_open_ticket': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(openTicketSchema, args);
        const result = await whmcsClient.openTicket(params as OpenTicketParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      case 'whmcs_add_ticket_reply': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(addTicketReplySchema, args);
        const result = await whmcsClient.addTicketReply(params as AddTicketReplyParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      case 'whmcs_update_ticket': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(updateTicketSchema, args);
        const result = await whmcsClient.updateTicket(params as UpdateTicketParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      // Support Tools
      case 'whmcs_get_support_departments': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getSupportDepartmentsSchema, args);
        const result = await whmcsClient.getSupportDepartments(params as GetSupportDepartmentsParams);
        const count = result.departments?.department?.length ?? 0;
        const total = Number(result.totalresults || count);
        const pagination = buildPagination(total, count, 0);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      case 'whmcs_get_support_statuses': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getSupportStatusesSchema, args);
        const result = await whmcsClient.getSupportStatuses(params as GetSupportStatusesParams);
        const count = result.statuses?.status?.length ?? 0;
        const total = Number(result.totalresults || count);
        const pagination = buildPagination(total, count, 0);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      case 'whmcs_get_ticket_counts': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getTicketCountsSchema, args);
        const result = await whmcsClient.getTicketCounts(params as GetTicketCountsParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      // Client Tools
      case 'whmcs_get_clients': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getClientsSchema, args);
        const result = await whmcsClient.getClients(params as GetClientsParams);
        const count = Number(result.numreturned || result.clients?.client?.length || 0);
        const offset = Number(result.startnumber ?? params.limitstart ?? 0);
        const total = Number(result.totalresults || 0);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      case 'whmcs_get_clients_details': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getClientsDetailsSchema, args);
        const result = await whmcsClient.getClientsDetails(params as GetClientsDetailsParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      // Product Tools
      case 'whmcs_get_products': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getProductsSchema, args);
        const result = await whmcsClient.getProducts(params as GetProductsParams);
        const count = Number(result.numreturned || result.products?.product?.length || 0);
        const offset = Number(result.startnumber ?? 0);
        const total = Number(result.totalresults || 0);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      // Order Tools
      case 'whmcs_get_orders': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getOrdersSchema, args);
        const result = await whmcsClient.getOrders(params as GetOrdersParams);
        const count = Number(result.numreturned || result.orders?.order?.length || 0);
        const offset = Number(result.startnumber ?? params.limitstart ?? 0);
        const total = Number(result.totalresults || 0);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      // Invoice Tools
      case 'whmcs_get_invoices': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getInvoicesSchema, args);
        const result = await whmcsClient.getInvoices(params as GetInvoicesParams);
        const count = Number(result.numreturned || result.invoices?.invoice?.length || 0);
        const offset = Number(result.startnumber ?? params.limitstart ?? 0);
        const total = Number(result.totalresults || 0);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      // Extended Client Tools
      case 'whmcs_get_clients_products': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getClientsProductsSchema, args);
        const result = await whmcsClient.getClientsProducts(params as GetClientsProductsParams);
        const count = Number(result.numreturned || result.products?.product?.length || 0);
        const offset = Number(result.startnumber ?? params.limitstart ?? 0);
        const total = Number(result.totalresults || 0);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      case 'whmcs_get_clients_domains': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getClientsDomainsSchema, args);
        const result = await whmcsClient.getClientsDomains(params as GetClientsDomainsParams);
        const count = Number(result.numreturned || result.domains?.domain?.length || 0);
        const offset = Number(result.startnumber ?? params.limitstart ?? 0);
        const total = Number(result.totalresults || 0);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      // System Tools
      case 'whmcs_get_activity_log': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getActivityLogSchema, args);
        const result = await whmcsClient.getActivityLog(params as GetActivityLogParams);
        const count = Number(result.activity?.entry?.length || 0);
        const offset = Number(result.startnumber ?? params.limitstart ?? 0);
        const total = Number(result.totalresults || count);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      case 'whmcs_get_stats': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getStatsSchema, args);
        const result = await whmcsClient.getStats(params as GetStatsParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      case 'whmcs_get_currencies': {
        const result = await whmcsClient.getCurrencies();
        const { response_format: responseFormat = 'markdown' } = parseToolArgs(getCurrenciesSchema, args);
        const count = result.currencies?.currency?.length ?? 0;
        const total = Number(result.totalresults || count);
        const pagination = buildPagination(total, count, 0);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      case 'whmcs_get_payment_methods': {
        const result = await whmcsClient.getPaymentMethods();
        const { response_format: responseFormat = 'markdown' } = parseToolArgs(getPaymentMethodsSchema, args);
        const count = result.paymentmethods?.paymentmethod?.length ?? 0;
        const total = Number(result.totalresults || count);
        const pagination = buildPagination(total, count, 0);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      case 'whmcs_get_admin_users': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getAdminUsersSchema, args);
        const result = await whmcsClient.getAdminUsers(params as GetAdminUsersParams);
        const count = result.admin_users?.admin_user?.length ?? 0;
        const total = Number(result.count || count);
        const pagination = buildPagination(total, count, 0);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      case 'whmcs_get_contacts': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getContactsSchema, args);
        const result = await whmcsClient.getContacts(params as GetContactsParams);
        const count = Number(result.numreturned || result.contacts?.contact?.length || 0);
        const offset = Number(result.startnumber ?? params.limitstart ?? 0);
        const total = Number(result.totalresults || 0);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      case 'whmcs_get_emails': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getEmailsSchema, args);
        const result = await whmcsClient.getEmails(params as GetEmailsParams);
        const count = Number(result.numreturned || result.emails?.email?.length || 0);
        const offset = Number(result.startnumber ?? params.limitstart ?? 0);
        const total = Number(result.totalresults || 0);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      // Custom Combined Tools
      case 'whmcs_get_unpaid_invoices_detailed': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getUnpaidInvoicesDetailedSchema, args);
        const result = await whmcsClient.getUnpaidInvoicesDetailed(
          params as GetUnpaidInvoicesDetailedParams
        );
        const count = result.invoices?.length ?? 0;
        const offset = params.limitstart ?? 0;
        const total = Number(result.total_unpaid_invoices || count);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      case 'whmcs_get_all_unpaid_invoices_complete': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(getAllUnpaidInvoicesCompleteSchema, args);
        const result = await whmcsClient.getAllUnpaidInvoicesComplete(
          params as GetAllUnpaidInvoicesCompleteParams
        );
        const count = result.invoices?.length ?? 0;
        const offset = params.offset ?? 0;
        const total = Number(result.summary?.total_unpaid_invoices || count);
        const pagination = buildPagination(total, count, offset);
        return formatToolResponse(
          toolTitle,
          responseFormat,
          wrapData(result, pagination)
        );
      }

      // Service Management Tools
      case 'whmcs_module_suspend': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(moduleSuspendSchema, args);
        const result = await whmcsClient.moduleSuspend(params as ModuleSuspendParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      case 'whmcs_module_unsuspend': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(moduleCommandSchema, args);
        const result = await whmcsClient.moduleUnsuspend(params as ModuleCommandParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      case 'whmcs_module_terminate': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(moduleCommandSchema, args);
        const result = await whmcsClient.moduleTerminate(params as ModuleCommandParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      case 'whmcs_module_create': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(moduleCommandSchema, args);
        const result = await whmcsClient.moduleCreate(params as ModuleCommandParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      // Order Management Tools
      case 'whmcs_accept_order': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(acceptOrderSchema, args);
        const result = await whmcsClient.acceptOrder(params as AcceptOrderParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      case 'whmcs_cancel_order': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(cancelOrderSchema, args);
        const result = await whmcsClient.cancelOrder(params as CancelOrderParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      case 'whmcs_delete_order': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(deleteOrderSchema, args);
        const result = await whmcsClient.deleteOrder(params as DeleteOrderParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      case 'whmcs_pending_order': {
        const { response_format: responseFormat = 'markdown', ...params } = parseToolArgs(pendingOrderSchema, args);
        const result = await whmcsClient.pendingOrder(params as PendingOrderParams);
        return formatToolResponse(toolTitle, responseFormat, { data: result });
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WHMCS MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
