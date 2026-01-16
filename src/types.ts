// Types for WHMCS API

export interface WHMCSConfig {
  identifier: string;
  secret: string;
  apiUrl: string;
}

export interface WHMCSBaseResponse {
  result: 'success' | 'error';
  message?: string;
}

// Ticket Types
export interface TicketAttachment {
  filename: string;
  index: string;
}

export interface Ticket {
  id: string;
  tid: string;
  deptid: string;
  deptname?: string;
  userid: string;
  contactid?: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  priority: string;
  date: string;
  lastreply: string;
  flag: string;
  requestor_name: string;
  requestor_type: string;
  requestor_email: string;
  owner_name?: string;
  attachments?: string | TicketAttachment[];
  admin?: string;
  service?: string;
  cc?: string;
}

export interface TicketReply {
  replyid: string;
  userid: string;
  name: string;
  email: string;
  date: string;
  message: string;
  attachment: string;
  attachments: string;
  admin: string;
  rating: string;
}

export interface TicketNote {
  noteid: string;
  message: string;
  admin: string;
  created: string;
  modified: string;
}

export interface GetTicketsResponse extends WHMCSBaseResponse {
  totalresults: number;
  startnumber: number;
  numreturned: number;
  tickets: {
    ticket: Ticket[];
  };
}

export interface GetTicketResponse extends WHMCSBaseResponse, Ticket {
  ticketid: string;
  c: string;
  replies: {
    reply: TicketReply[];
  };
  notes: {
    note: TicketNote[];
  };
}

export interface OpenTicketResponse extends WHMCSBaseResponse {
  id: string;
  tid: string;
  c: string;
}

export interface AddTicketReplyResponse extends WHMCSBaseResponse {}

export interface UpdateTicketResponse extends WHMCSBaseResponse {}

// Request Parameters
export interface GetTicketsParams {
  limitstart?: number;
  limitnum?: number;
  deptid?: number;
  clientid?: number;
  email?: string;
  status?: string;
  subject?: string;
  ignore_dept_assignments?: boolean;
}

export interface GetTicketParams {
  ticketid?: number;
  ticketnum?: string;
  repliessort?: 'ASC' | 'DESC';
}

export interface OpenTicketParams {
  deptid: number;
  subject: string;
  message: string;
  clientid?: number;
  userid?: number;
  contactid?: number;
  name?: string;
  email?: string;
  priority?: 'Low' | 'Medium' | 'High';
  created?: string;
  serviceid?: number;
  domainid?: number;
  admin?: boolean;
  noemail?: boolean;
  markdown?: boolean;
  customfields?: string;
  attachments?: string;
  preventClientClosure?: boolean;
}

export interface AddTicketReplyParams {
  ticketid: number;
  message: string;
  markdown?: boolean;
  clientid?: number;
  contactid?: number;
  adminusername?: string;
  name?: string;
  email?: string;
  status?: string;
  noemail?: boolean;
  customfields?: string;
  attachments?: string;
  created?: string;
}

export interface UpdateTicketParams {
  ticketid: number;
  deptid?: number;
  subject?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status?: string;
  userid?: number;
  flag?: number;
  removeFlag?: boolean;
}

// Support Department Types
export interface SupportDepartment {
  id: string;
  name: string;
  awaitingreply: string;
  opentickets: string;
}

export interface GetSupportDepartmentsParams {
  ignore_dept_assignments?: boolean;
}

export interface GetSupportDepartmentsResponse extends WHMCSBaseResponse {
  totalresults: number;
  departments: {
    department: SupportDepartment[];
  };
}

// Support Status Types
export interface SupportStatus {
  title: string;
  count: number;
  color: string;
}

export interface GetSupportStatusesParams {
  deptid?: number;
}

export interface GetSupportStatusesResponse extends WHMCSBaseResponse {
  totalresults: number;
  statuses: {
    status: SupportStatus[];
  };
}

// Ticket Counts Types
export interface TicketCountsByStatus {
  open: number;
  answered: number;
  customerreply: number;
  closed: number;
  onhold: number;
  inprogress: number;
}

export interface GetTicketCountsParams {
  ignoreDepartmentAssignments?: boolean;
  includeCountsByStatus?: boolean;
}

export interface GetTicketCountsResponse extends WHMCSBaseResponse {
  filteredDepartments: number[];
  allActive: number;
  awaitingReply: number;
  flaggedTickets: number;
  status: TicketCountsByStatus;
}

// Client Types
export interface Client {
  id: number;
  firstname: string;
  lastname: string;
  companyname: string;
  email: string;
  datecreated: string;
  groupid: number;
  status: string;
}

export interface ClientDetails extends Client {
  client_id: number;
  userid: number;
  uuid: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  countrycode: string;
  phonenumber: string;
  tax_id: string;
  credit: string;
  currency: number;
  language: string;
  email_preferences?: any;
  customfields?: any[];
  users?: any[];
}

export interface ClientStats {
  numdueinvoices: number;
  numoverdueinvoices: number;
  numpaidinvoices: number;
  numunpaidinvoices: number;
  numcancelledinvoices: number;
  numproducts: {
    active: number;
    pending: number;
    cancelled: number;
    suspended: number;
    terminated: number;
  };
  numdomains: {
    active: number;
    pending: number;
    cancelled: number;
    expired: number;
    transferred: number;
  };
  numquotes: number;
  numtickets: number;
  numaffiliatesignups: number;
}

export interface GetClientsParams {
  limitstart?: number;
  limitnum?: number;
  sorting?: 'ASC' | 'DESC';
  status?: 'Active' | 'Inactive' | 'Closed';
  search?: string;
  orderby?: 'id' | 'firstname' | 'lastname' | 'companyname' | 'email' | 'groupid' | 'datecreated' | 'status';
}

export interface GetClientsResponse extends WHMCSBaseResponse {
  totalresults: number;
  startnumber: number;
  numreturned: number;
  clients: {
    client: Client[];
  };
}

export interface GetClientsDetailsParams {
  clientid?: number;
  email?: string;
  stats?: boolean;
}

export interface GetClientsDetailsResponse extends WHMCSBaseResponse {
  client: ClientDetails;
  stats?: ClientStats;
}

// Product Types
export interface Product {
  pid: number;
  gid: number;
  type: string;
  name: string;
  slug: string;
  'product-url': string;
  description: string;
  module: string;
  paytype: string;
  allowqty: boolean;
  quantity_available?: number;
  pricing: any;
  customfields?: any[];
  configoptions?: any[];
}

export interface GetProductsParams {
  pid?: number | string;
  gid?: number;
  module?: string;
}

export interface GetProductsResponse extends WHMCSBaseResponse {
  totalresults: number;
  startnumber: number;
  numreturned: number;
  products: {
    product: Product[];
  };
}

// Order Types
export interface Order {
  id: number;
  ordernum: number;
  userid: number;
  requestor_id: number;
  contactid: number;
  date: string;
  nameservers: string;
  transfersecret: string;
  renewals: string;
  promocode: string;
  promotype: string;
  promovalue: string;
  orderdata: string;
  amount: string;
  paymentmethod: string;
  invoiceid: number;
  status: string;
  ipaddress: string;
  fraudmodule: string;
  fraudoutput: string;
  lineitems: any[];
}

export interface GetOrdersParams {
  limitstart?: number;
  limitnum?: number;
  id?: number;
  userid?: number;
  requestor_id?: number;
  status?: string;
}

export interface GetOrdersResponse extends WHMCSBaseResponse {
  totalresults: number;
  startnumber: number;
  numreturned: number;
  orders: {
    order: Order[];
  };
}

// Invoice Types
export interface Invoice {
  id: number;
  userid: number;
  invoicenum: string;
  date: string;
  duedate: string;
  datepaid: string;
  subtotal: string;
  credit: string;
  tax: string;
  tax2: string;
  total: string;
  balance: string;
  taxrate: string;
  taxrate2: string;
  status: string;
  paymentmethod: string;
  notes: string;
  ccgateway: boolean;
  currency_code: string;
  currency_prefix: string;
  currency_suffix: string;
}

export interface GetInvoicesParams {
  limitstart?: number;
  limitnum?: number;
  userid?: number;
  status?: string;
  orderby?: 'id' | 'invoicenumber' | 'date' | 'duedate' | 'total' | 'status';
  order?: 'asc' | 'desc';
}

export interface GetInvoicesResponse extends WHMCSBaseResponse {
  totalresults: number;
  startnumber: number;
  numreturned: number;
  invoices: {
    invoice: Invoice[];
  };
}

// Clients Products Types
export interface ClientProduct {
  id: number;
  clientid: number;
  orderid: number;
  pid: number;
  regdate: string;
  name: string;
  translated_name: string;
  groupname: string;
  translated_groupname: string;
  domain: string;
  dedicatedip: string;
  serverid: number;
  servername: string;
  serverip: string;
  serverhostname: string;
  suspensionreason: string;
  promoid: number;
  subscriptionid: string;
  producttype: string;
  productmodule: string;
  productpaytype: string;
  nextduedate: string;
  firstpaymentamount: string;
  recurringamount: string;
  paymentmethod: string;
  paymentmethodname: string;
  billingcycle: string;
  status: string;
  username: string;
  password: string;
  notes: string;
  diskusage: number;
  disklimit: number;
  bwusage: number;
  bwlimit: number;
  lastupdate: string;
  customfields: any;
  configoptions: any;
  pricing: any;
}

export interface GetClientsProductsParams {
  limitstart?: number;
  limitnum?: number;
  clientid?: number;
  serviceid?: number;
  pid?: number;
  domain?: string;
  username2?: string;
}

export interface GetClientsProductsResponse extends WHMCSBaseResponse {
  clientid?: number;
  serviceid?: number;
  pid?: number;
  domain?: string;
  totalresults: number;
  startnumber: number;
  numreturned: number;
  products: {
    product: ClientProduct[];
  };
}

// Clients Domains Types
export interface ClientDomain {
  id: number;
  userid: number;
  orderid: number;
  regtype: string;
  domainname: string;
  registrar: string;
  regperiod: number;
  firstpaymentamount: string;
  recurringamount: string;
  paymentmethod: string;
  paymentmethodname: string;
  regdate: string;
  expirydate: string;
  nextduedate: string;
  status: string;
  subscriptionid: string;
  promoid: number;
  dnsmanagement: boolean;
  emailforwarding: boolean;
  idprotection: boolean;
  donotrenew: boolean;
  notes: string;
}

export interface GetClientsDomainsParams {
  limitstart?: number;
  limitnum?: number;
  clientid?: number;
  domainid?: number;
  domain?: string;
}

export interface GetClientsDomainsResponse extends WHMCSBaseResponse {
  clientid?: number;
  domainid?: number;
  totalresults: number;
  startnumber: number;
  numreturned: number;
  domains: {
    domain: ClientDomain[];
  };
}

// Activity Log Types
export interface ActivityLogEntry {
  id: number;
  clientId: number;
  userId: number;
  adminId: number;
  date: string;
  description: string;
  username: string;
  ipaddress: string;
}

export interface GetActivityLogParams {
  limitstart?: number;
  limitnum?: number;
  clientid?: number;
  date?: string;
  user?: string;
  description?: string;
  ipaddress?: string;
}

export interface GetActivityLogResponse extends WHMCSBaseResponse {
  totalresults: number;
  startnumber: number;
  activity: {
    entry: ActivityLogEntry[];
  };
}

// Stats Types
export interface TimelineData {
  date: string;
  new_orders: number;
  accepted_orders: number;
  income: number;
  expenditure: number;
  new_tickets: number;
}

export interface GetStatsParams {
  timeline_days?: number;
}

export interface GetStatsResponse extends WHMCSBaseResponse {
  income_today: number;
  income_thismonth: number;
  income_thisyear: number;
  income_alltime: number;
  orders_today_cancelled: number;
  orders_today_pending: number;
  orders_today_fraud: number;
  orders_today_active: number;
  orders_today_total: number;
  orders_yesterday_cancelled: number;
  orders_yesterday_pending: number;
  orders_yesterday_fraud: number;
  orders_yesterday_active: number;
  orders_yesterday_total: number;
  orders_thismonth_total: number;
  orders_thisyear_total: number;
  orders_pending: number;
  tickets_open: number;
  tickets_answered: number;
  tickets_customerreply: number;
  tickets_closed: number;
  tickets_onhold: number;
  tickets_inprogress: number;
  tickets_allactive: number;
  tickets_awaitingreply: number;
  tickets_flaggedtickets: number;
  cancellations_pending: number;
  todoitems_due: number;
  networkissues_open: number;
  billableitems_uninvoiced: number;
  quotes_valid: number;
  staff_online: number;
  timeline_data?: TimelineData[];
}

// Currency Types
export interface Currency {
  id: number;
  code: string;
  prefix: string;
  suffix: string;
  format: number;
  rate: string;
}

export interface GetCurrenciesResponse extends WHMCSBaseResponse {
  totalresults: number;
  currencies: {
    currency: Currency[];
  };
}

// Payment Methods Types
export interface PaymentMethod {
  module: string;
  displayname: string;
}

export interface GetPaymentMethodsResponse extends WHMCSBaseResponse {
  totalresults: number;
  paymentmethods: {
    paymentmethod: PaymentMethod[];
  };
}

// Admin Users Types
export interface AdminUser {
  id: number;
  uuid: string;
  roleId: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  template: string;
  language: string;
  disabled: boolean;
  loginattempts: number;
  supportdepts: string;
  ticketnotifications: boolean;
  homewidgets: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface GetAdminUsersParams {
  roleid?: number;
  email?: string;
  include_disabled?: boolean;
}

export interface GetAdminUsersResponse extends WHMCSBaseResponse {
  count: number;
  admin_users: {
    admin_user: AdminUser[];
  };
}

// Contacts Types
export interface Contact {
  id: number;
  userid: number;
  firstname: string;
  lastname: string;
  companyname: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phonenumber: string;
  domainemails: boolean;
  generalemails: boolean;
  invoiceemails: boolean;
  productemails: boolean;
  supportemails: boolean;
  affiliateemails: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetContactsParams {
  limitstart?: number;
  limitnum?: number;
  userid?: number;
  firstname?: string;
  lastname?: string;
  companyname?: string;
  email?: string;
  phonenumber?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface GetContactsResponse extends WHMCSBaseResponse {
  totalresults: number;
  startnumber: number;
  numreturned: number;
  contacts: {
    contact: Contact[];
  };
}

// Emails Types
export interface EmailEntry {
  id: number;
  userid: number;
  subject: string;
  message: string;
  date: string;
  to: string;
  cc: string;
  bcc: string;
  attachments: string;
  pending: boolean;
  failed: boolean;
}

export interface GetEmailsParams {
  clientid: number;
  limitstart?: number;
  limitnum?: number;
  date?: string;
  subject?: string;
}

export interface GetEmailsResponse extends WHMCSBaseResponse {
  totalresults: number;
  startnumber: number;
  numreturned: number;
  emails: {
    email: EmailEntry[];
  };
}

// Module Command Types (Service Management)
export interface ModuleCommandParams {
  serviceid: number;
}

export interface ModuleSuspendParams extends ModuleCommandParams {
  suspendreason?: string;
}

export interface ModuleCommandResponse extends WHMCSBaseResponse {
  serviceid: number;
}

// Order Management Types
export interface AcceptOrderParams {
  orderid: number;
  serverid?: number;
  serviceusername?: string;
  servicepassword?: string;
  registrar?: string;
  sendregistrar?: boolean;
  autosetup?: boolean;
  sendemail?: boolean;
}

export interface AcceptOrderResponse extends WHMCSBaseResponse {
  orderid: number;
}

export interface CancelOrderParams {
  orderid: number;
  cancelsub?: boolean;
  noemail?: boolean;
}

export interface CancelOrderResponse extends WHMCSBaseResponse {}

export interface DeleteOrderParams {
  orderid: number;
}

export interface DeleteOrderResponse extends WHMCSBaseResponse {}

export interface PendingOrderParams {
  orderid: number;
}

export interface PendingOrderResponse extends WHMCSBaseResponse {}
