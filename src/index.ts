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

// Define tools with annotations
const tools: Tool[] = [
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
      properties: {},
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
        }
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

// Create server instance
const server = new Server(
  {
    name: 'whmcs-mcp',
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

    switch (name) {
      case 'whmcs_get_tickets': {
        const params = args as GetTicketsParams;
        const result = await whmcsClient.getTickets(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_ticket': {
        const params = args as GetTicketParams;
        const result = await whmcsClient.getTicket(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_open_ticket': {
        const params = args as unknown as OpenTicketParams;
        const result = await whmcsClient.openTicket(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_add_ticket_reply': {
        const params = args as unknown as AddTicketReplyParams;
        const result = await whmcsClient.addTicketReply(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_update_ticket': {
        const params = args as unknown as UpdateTicketParams;
        const result = await whmcsClient.updateTicket(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Support Tools
      case 'whmcs_get_support_departments': {
        const params = args as GetSupportDepartmentsParams;
        const result = await whmcsClient.getSupportDepartments(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_support_statuses': {
        const params = args as GetSupportStatusesParams;
        const result = await whmcsClient.getSupportStatuses(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_ticket_counts': {
        const params = args as GetTicketCountsParams;
        const result = await whmcsClient.getTicketCounts(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Client Tools
      case 'whmcs_get_clients': {
        const params = args as GetClientsParams;
        const result = await whmcsClient.getClients(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_clients_details': {
        const params = args as GetClientsDetailsParams;
        const result = await whmcsClient.getClientsDetails(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Product Tools
      case 'whmcs_get_products': {
        const params = args as GetProductsParams;
        const result = await whmcsClient.getProducts(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Order Tools
      case 'whmcs_get_orders': {
        const params = args as GetOrdersParams;
        const result = await whmcsClient.getOrders(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Invoice Tools
      case 'whmcs_get_invoices': {
        const params = args as GetInvoicesParams;
        const result = await whmcsClient.getInvoices(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Extended Client Tools
      case 'whmcs_get_clients_products': {
        const params = args as GetClientsProductsParams;
        const result = await whmcsClient.getClientsProducts(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_clients_domains': {
        const params = args as GetClientsDomainsParams;
        const result = await whmcsClient.getClientsDomains(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // System Tools
      case 'whmcs_get_activity_log': {
        const params = args as GetActivityLogParams;
        const result = await whmcsClient.getActivityLog(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_stats': {
        const params = args as GetStatsParams;
        const result = await whmcsClient.getStats(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_currencies': {
        const result = await whmcsClient.getCurrencies();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_payment_methods': {
        const result = await whmcsClient.getPaymentMethods();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_admin_users': {
        const params = args as GetAdminUsersParams;
        const result = await whmcsClient.getAdminUsers(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_contacts': {
        const params = args as GetContactsParams;
        const result = await whmcsClient.getContacts(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_emails': {
        const params = args as unknown as GetEmailsParams;
        const result = await whmcsClient.getEmails(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Custom Combined Tools
      case 'whmcs_get_unpaid_invoices_detailed': {
        const result = await whmcsClient.getUnpaidInvoicesDetailed();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_get_all_unpaid_invoices_complete': {
        const params = args as { limit?: number };
        const result = await whmcsClient.getAllUnpaidInvoicesComplete(params.limit || 1000);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Service Management Tools
      case 'whmcs_module_suspend': {
        const params = args as ModuleSuspendParams;
        const result = await whmcsClient.moduleSuspend(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_module_unsuspend': {
        const params = args as ModuleCommandParams;
        const result = await whmcsClient.moduleUnsuspend(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_module_terminate': {
        const params = args as ModuleCommandParams;
        const result = await whmcsClient.moduleTerminate(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_module_create': {
        const params = args as ModuleCommandParams;
        const result = await whmcsClient.moduleCreate(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Order Management Tools
      case 'whmcs_accept_order': {
        const params = args as AcceptOrderParams;
        const result = await whmcsClient.acceptOrder(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_cancel_order': {
        const params = args as CancelOrderParams;
        const result = await whmcsClient.cancelOrder(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_delete_order': {
        const params = args as DeleteOrderParams;
        const result = await whmcsClient.deleteOrder(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'whmcs_pending_order': {
        const params = args as PendingOrderParams;
        const result = await whmcsClient.pendingOrder(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
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
