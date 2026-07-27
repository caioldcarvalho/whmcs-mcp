import { createHash } from 'node:crypto';
import axios, { AxiosInstance } from 'axios';
import { isJsonEncodingError, parseWhmcsXml } from './xml.js';
import type {
  WHMCSConfig,
  GetTicketsParams,
  GetTicketsResponse,
  GetTicketParams,
  GetTicketResponse,
  Invoice,
  ClientProduct,
  ClientDetails,
  OpenTicketParams,
  OpenTicketResponse,
  AddTicketReplyParams,
  AddTicketReplyResponse,
  UpdateTicketParams,
  UpdateTicketResponse,
  GetSupportDepartmentsParams,
  GetSupportDepartmentsResponse,
  GetSupportStatusesParams,
  GetSupportStatusesResponse,
  GetTicketCountsParams,
  GetTicketCountsResponse,
  GetClientsParams,
  GetClientsResponse,
  GetClientsDetailsParams,
  GetClientsDetailsResponse,
  GetProductsParams,
  GetProductsResponse,
  GetOrdersParams,
  GetOrdersResponse,
  GetInvoicesParams,
  GetInvoicesResponse,
  GetClientsProductsParams,
  GetClientsProductsResponse,
  GetClientsDomainsParams,
  GetClientsDomainsResponse,
  GetActivityLogParams,
  GetActivityLogResponse,
  GetStatsParams,
  GetStatsResponse,
  GetCurrenciesResponse,
  GetPaymentMethodsResponse,
  GetAdminUsersParams,
  GetAdminUsersResponse,
  GetContactsParams,
  GetContactsResponse,
  GetEmailsParams,
  GetEmailsResponse,
  GetUnpaidInvoicesDetailedParams,
  GetAllUnpaidInvoicesCompleteParams,
  FindInvoiceGapsParams,
  FindInvoiceGapsResult,
  FindInvoiceGapsClient,
  ListClientsWithPendingInvoicesParams,
  ListClientsWithPendingInvoicesResult,
  PendingInvoiceClient,
  ModuleCommandParams,
  ModuleSuspendParams,
  ModuleCommandResponse,
  AcceptOrderParams,
  AcceptOrderResponse,
  CancelOrderParams,
  CancelOrderResponse,
  DeleteOrderParams,
  DeleteOrderResponse,
  PendingOrderParams,
  PendingOrderResponse,
} from './types.js';

export class WHMCSClient {
  private client: AxiosInstance;
  private authParams: Record<string, string>;

  constructor(config: WHMCSConfig) {
    this.authParams = this.getAuthParams(config);

    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  private getAuthParams(config: WHMCSConfig): Record<string, string> {
    if (config.identifier && config.secret) {
      return {
        identifier: config.identifier,
        secret: config.secret,
      };
    }

    if (config.username && config.password) {
      return {
        username: config.username,
        password: this.toWhmcsPasswordHash(config.password),
      };
    }

    throw new Error('WHMCS credentials are missing');
  }

  private toWhmcsPasswordHash(password: string): string {
    if (/^[a-f0-9]{32}$/i.test(password)) {
      return password;
    }

    return createHash('md5').update(password).digest('hex');
  }

  private parseDate(dateValue: string | undefined): Date | null {
    if (!dateValue || dateValue === '0000-00-00') return null;
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }

  private getMonthKey(dateValue: Date): string {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private getMonthStart(dateValue: Date): Date {
    return new Date(dateValue.getFullYear(), dateValue.getMonth(), 1);
  }

  private getMonthRange(months: number): { start: Date; end: Date; keys: string[] } {
    const end = this.getMonthStart(new Date());
    const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
    const keys: string[] = [];
    const cursor = new Date(start.getTime());
    while (cursor <= end) {
      keys.push(this.getMonthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return { start, end, keys };
  }

  private async listInvoicesByStatusSince(status: string, startDate: Date): Promise<Invoice[]> {
    const invoices: Invoice[] = [];
    const pageSize = 100;
    let page = 0;

    while (true) {
      const response = await this.getInvoices({
        status,
        limitstart: page * pageSize,
        limitnum: pageSize,
        orderby: 'date',
        order: 'desc',
      });

      const batch = response.invoices?.invoice || [];
      if (batch.length === 0) {
        break;
      }

      let reachedOlder = false;
      for (const invoice of batch) {
        const invoiceDate = this.parseDate(invoice.date);
        if (invoiceDate && invoiceDate < startDate) {
          reachedOlder = true;
          break;
        }
        invoices.push(invoice);
      }

      if (reachedOlder || batch.length < pageSize) {
        break;
      }
      page += 1;
    }

    return invoices;
  }

  private async listInvoicesForStatuses(
    statuses: string[],
    startDate: Date
  ): Promise<Invoice[]> {
    const all: Invoice[] = [];
    for (const status of statuses) {
      const invoices = await this.listInvoicesByStatusSince(status, startDate);
      all.push(...invoices);
    }
    return all;
  }

  private async listAllClientProducts(): Promise<ClientProduct[]> {
    const products: ClientProduct[] = [];
    const pageSize = 250;
    let page = 0;
    let total = 0;

    while (true) {
      const response = await this.getClientsProducts({
        limitstart: page * pageSize,
        limitnum: pageSize,
      });

      const batch = response.products?.product || [];
      products.push(...batch);

      total = Number(response.totalresults || products.length);
      if (products.length >= total || batch.length < pageSize) {
        break;
      }
      page += 1;
    }

    return products;
  }

  private async request<T>(action: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await this.post(action, params, 'json');

      if (response.data.result === 'error') {
        // WHMCS fails to encode JSON when a record holds non-UTF-8 bytes, which
        // makes calls like GetClientsProducts permanently unusable. XML has no
        // such encoder, so retry there and parse it into the same shape.
        if (isJsonEncodingError(response.data.message)) {
          return await this.requestAsXml<T>(action, params);
        }
        throw new Error(response.data.message || 'WHMCS API error');
      }

      return response.data as T;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const body = error.response?.data;
        const detail = typeof body === 'string' ? body : body?.message;
        throw new Error(
          `WHMCS API request failed: ${error.message}${detail ? ` — ${detail}` : ''}`
        );
      }
      throw error;
    }
  }

  private post(action: string, params: Record<string, any>, responseType: 'json' | 'xml') {
    const requestParams = new URLSearchParams({
      action,
      ...this.authParams,
      responsetype: responseType,
      ...this.serializeParams(params),
    });

    return this.client.post('', requestParams.toString());
  }

  private async requestAsXml<T>(action: string, params: Record<string, any>): Promise<T> {
    const response = await this.post(action, params, 'xml');
    const body = typeof response.data === 'string' ? response.data : String(response.data ?? '');
    const parsed = parseWhmcsXml(body);

    if (parsed.result === 'error') {
      throw new Error(typeof parsed.message === 'string' ? parsed.message : 'WHMCS API error');
    }

    return parsed as T;
  }

  private serializeParams(params: Record<string, any>): Record<string, string> {
    const serialized: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        serialized[key] = String(value);
      }
    }

    return serialized;
  }

  // Connection check

  async checkConnection(): Promise<{ whmcsVersion: string }> {
    try {
      const result = await this.request<{ whmcs_version: string }>('WhmcsDetails');
      return { whmcsVersion: result.whmcs_version };
    } catch (error) {
      if (error instanceof Error) {
        // Extract IP from WHMCS error messages like "Invalid IP 1.2.3.4"
        const ipMatch = error.message.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        if (ipMatch) {
          throw new Error(
            `Your IP ${ipMatch[1]} is not whitelisted in WHMCS API Security settings. ` +
            `Add it at Configuration > System Settings > API Credentials > IP Whitelist.`
          );
        }
      }
      throw error;
    }
  }

  // Ticket Methods

  async getTickets(params: GetTicketsParams = {}): Promise<GetTicketsResponse> {
    return this.request<GetTicketsResponse>('GetTickets', params);
  }

  async getTicket(params: GetTicketParams): Promise<GetTicketResponse> {
    if (!params.ticketid && !params.ticketnum) {
      throw new Error('Either ticketid or ticketnum must be provided');
    }
    return this.request<GetTicketResponse>('GetTicket', params);
  }

  async openTicket(params: OpenTicketParams): Promise<OpenTicketResponse> {
    return this.request<OpenTicketResponse>('OpenTicket', params);
  }

  async addTicketReply(params: AddTicketReplyParams): Promise<AddTicketReplyResponse> {
    return this.request<AddTicketReplyResponse>('AddTicketReply', params);
  }

  async updateTicket(params: UpdateTicketParams): Promise<UpdateTicketResponse> {
    return this.request<UpdateTicketResponse>('UpdateTicket', params);
  }

  // Support Methods

  async getSupportDepartments(params: GetSupportDepartmentsParams = {}): Promise<GetSupportDepartmentsResponse> {
    return this.request<GetSupportDepartmentsResponse>('GetSupportDepartments', params);
  }

  async getSupportStatuses(params: GetSupportStatusesParams = {}): Promise<GetSupportStatusesResponse> {
    return this.request<GetSupportStatusesResponse>('GetSupportStatuses', params);
  }

  async getTicketCounts(params: GetTicketCountsParams = {}): Promise<GetTicketCountsResponse> {
    return this.request<GetTicketCountsResponse>('GetTicketCounts', params);
  }

  // Client Methods

  async getClients(params: GetClientsParams = {}): Promise<GetClientsResponse> {
    return this.request<GetClientsResponse>('GetClients', params);
  }

  async getClientsDetails(params: GetClientsDetailsParams): Promise<GetClientsDetailsResponse> {
    if (!params.clientid && !params.email) {
      throw new Error('Either clientid or email must be provided');
    }
    return this.request<GetClientsDetailsResponse>('GetClientsDetails', params);
  }

  // Product Methods

  async getProducts(params: GetProductsParams = {}): Promise<GetProductsResponse> {
    return this.request<GetProductsResponse>('GetProducts', params);
  }

  // Order Methods

  async getOrders(params: GetOrdersParams = {}): Promise<GetOrdersResponse> {
    return this.request<GetOrdersResponse>('GetOrders', params);
  }

  // Invoice Methods

  async getInvoices(params: GetInvoicesParams = {}): Promise<GetInvoicesResponse> {
    return this.request<GetInvoicesResponse>('GetInvoices', params);
  }

  // Extended Client Methods

  async getClientsProducts(params: GetClientsProductsParams = {}): Promise<GetClientsProductsResponse> {
    return this.request<GetClientsProductsResponse>('GetClientsProducts', params);
  }

  async getClientsDomains(params: GetClientsDomainsParams = {}): Promise<GetClientsDomainsResponse> {
    return this.request<GetClientsDomainsResponse>('GetClientsDomains', params);
  }

  // System Methods

  async getActivityLog(params: GetActivityLogParams = {}): Promise<GetActivityLogResponse> {
    return this.request<GetActivityLogResponse>('GetActivityLog', params);
  }

  async getStats(params: GetStatsParams = {}): Promise<GetStatsResponse> {
    return this.request<GetStatsResponse>('GetStats', params);
  }

  async getCurrencies(): Promise<GetCurrenciesResponse> {
    return this.request<GetCurrenciesResponse>('GetCurrencies');
  }

  async getPaymentMethods(): Promise<GetPaymentMethodsResponse> {
    return this.request<GetPaymentMethodsResponse>('GetPaymentMethods');
  }

  async getAdminUsers(params: GetAdminUsersParams = {}): Promise<GetAdminUsersResponse> {
    return this.request<GetAdminUsersResponse>('GetAdminUsers', params);
  }

  async getContacts(params: GetContactsParams = {}): Promise<GetContactsResponse> {
    return this.request<GetContactsResponse>('GetContacts', params);
  }

  async getEmails(params: GetEmailsParams): Promise<GetEmailsResponse> {
    return this.request<GetEmailsResponse>('GetEmails', params);
  }

  // Service Management Methods (Module Commands)

  async moduleSuspend(params: ModuleSuspendParams): Promise<ModuleCommandResponse> {
    return this.request<ModuleCommandResponse>('ModuleSuspend', params);
  }

  async moduleUnsuspend(params: ModuleCommandParams): Promise<ModuleCommandResponse> {
    return this.request<ModuleCommandResponse>('ModuleUnsuspend', params);
  }

  async moduleTerminate(params: ModuleCommandParams): Promise<ModuleCommandResponse> {
    return this.request<ModuleCommandResponse>('ModuleTerminate', params);
  }

  async moduleCreate(params: ModuleCommandParams): Promise<ModuleCommandResponse> {
    return this.request<ModuleCommandResponse>('ModuleCreate', params);
  }

  // Order Management Methods

  async acceptOrder(params: AcceptOrderParams): Promise<AcceptOrderResponse> {
    return this.request<AcceptOrderResponse>('AcceptOrder', params);
  }

  async cancelOrder(params: CancelOrderParams): Promise<CancelOrderResponse> {
    return this.request<CancelOrderResponse>('CancelOrder', params);
  }

  async deleteOrder(params: DeleteOrderParams): Promise<DeleteOrderResponse> {
    return this.request<DeleteOrderResponse>('DeleteOrder', params);
  }

  async pendingOrder(params: PendingOrderParams): Promise<PendingOrderResponse> {
    return this.request<PendingOrderResponse>('PendingOrder', params);
  }

  // Custom Combined Methods

  async getAllUnpaidInvoicesComplete(
    options: GetAllUnpaidInvoicesCompleteParams = {}
  ): Promise<any> {
    try {
      const limit = options.limit ?? 1000;
      const offset = options.offset ?? 0;
      const targetCount = offset + limit;

      console.error(
        `Buscando faturas nao pagas (offset: ${offset}, limite: ${limit})...`
      );
      
      // Buscar todas as faturas não pagas em páginas
      const allUnpaidInvoices: any[] = [];
      const pageSize = 100; // Tamanho da página
      let currentPage = 0;
      let hasMore = true;
      let totalAvailable = 0;

      // Buscar faturas "Unpaid" e "Overdue"
      for (const status of ['Unpaid', 'Overdue']) {
        console.error(`Buscando faturas com status: ${status}`);
        currentPage = 0;
        hasMore = true;
        let statusTotal = 0;

        while (hasMore && allUnpaidInvoices.length < targetCount) {
          const invoicesResponse = await this.getInvoices({
            status,
            limitstart: currentPage * pageSize,
            limitnum: Math.min(pageSize, targetCount - allUnpaidInvoices.length)
          });

          const invoices = invoicesResponse.invoices?.invoice || [];

          if (currentPage === 0) {
            statusTotal = Number(invoicesResponse.totalresults || invoices.length);
          }
          
          if (invoices.length === 0) {
            hasMore = false;
            continue;
          }

          allUnpaidInvoices.push(...invoices);
          currentPage++;

          // Se retornou menos que o pageSize, não há mais páginas
          if (invoices.length < pageSize) {
            hasMore = false;
          }
        }

        totalAvailable += statusTotal;
      }

      const sliceStart = Math.min(offset, allUnpaidInvoices.length);
      const sliceEnd = Math.min(offset + limit, allUnpaidInvoices.length);
      const pagedInvoices = allUnpaidInvoices.slice(sliceStart, sliceEnd);

      console.error(`Total de faturas encontradas: ${allUnpaidInvoices.length}`);
      console.error(`Total de faturas retornadas: ${pagedInvoices.length}`);

      // Para cada fatura, buscar detalhes completos
      const detailedInvoices = [];
      let processed = 0;

      for (const invoice of pagedInvoices) {
        try {
          processed++;
          if (processed % 10 === 0 && pagedInvoices.length > 0) {
            console.error(`Processando fatura ${processed}/${pagedInvoices.length}...`);
          }

          // Buscar detalhes do cliente
          let clientDetails: any;
          try {
            clientDetails = await this.getClientsDetails({ clientid: invoice.userid });
          } catch (error) {
            console.error(`Erro ao buscar cliente ${invoice.userid}:`, error instanceof Error ? error.message : 'Erro desconhecido');
            clientDetails = { client: {} };
          }

          // Buscar itens da fatura (usando GetInvoice para ter os line items)
          let invoiceItems: any[] = [];
          try {
            // Nota: WHMCS não tem endpoint direto para itens de fatura
            // Vamos usar GetClientsProducts para aproximar
            const clientProducts = await this.getClientsProducts({
              clientid: invoice.userid
            });
            invoiceItems = clientProducts.products?.product || [];
          } catch (error) {
            console.error(`Erro ao buscar produtos da fatura ${invoice.id}:`, error instanceof Error ? error.message : 'Erro desconhecido');
            invoiceItems = [];
          }

          // Construir linha da fatura
          const baseInvoiceData = {
            invoice_id: invoice.id,
            invoice_number: invoice.invoicenum || `INV-${invoice.id}`,
            client_id: invoice.userid,
            client_name: `${clientDetails.client?.firstname || ''} ${clientDetails.client?.lastname || ''}`.trim() || 'Nome não disponível',
            client_email: clientDetails.client?.email || 'Email não disponível',
            client_phone: clientDetails.client?.phonenumber || 'Telefone não disponível',
            invoice_total: `${invoice.currencyprefix || 'R$ '}${invoice.total || '0.00'}${invoice.currencysuffix || ''}`,
            invoice_subtotal: `${invoice.currencyprefix || 'R$ '}${invoice.subtotal || '0.00'}${invoice.currencysuffix || ''}`,
            invoice_status: invoice.status,
            invoice_date: invoice.date,
            invoice_duedate: invoice.duedate,
            payment_method: invoice.paymentmethod || 'Não especificado',
            currency_code: invoice.currencycode || 'BRL',
            days_overdue: this.calculateDaysOverdue(invoice.duedate)
          };

          // Se não há produtos específicos na fatura, adicionar linha genérica
          if (invoiceItems.length === 0) {
            detailedInvoices.push({
              ...baseInvoiceData,
              product_id: 'N/A',
              product_name: 'Produto não identificado',
              product_description: 'Informação de produto não disponível',
              line_total: baseInvoiceData.invoice_total
            });
          } else {
            // Adicionar uma linha para cada produto
            for (const product of invoiceItems) {
              detailedInvoices.push({
                ...baseInvoiceData,
                product_id: product.pid || 'N/A',
                product_name: product.name || product.productname || 'Produto sem nome',
                product_description: product.notes || product.description || 'Sem descrição',
                line_total: `${invoice.currencyprefix || 'R$ '}${product.firstpaymentamount || product.amount || '0.00'}${invoice.currencysuffix || ''}`
              });
            }
          }

        } catch (error) {
          console.error(`Erro processando fatura ${invoice.id}:`, error instanceof Error ? error.message : 'Erro desconhecido');
          
          // Adicionar entrada com erro para não perder a fatura
          detailedInvoices.push({
            invoice_id: invoice.id,
            invoice_number: invoice.invoicenum || `INV-${invoice.id}`,
            client_id: invoice.userid,
            client_name: 'ERRO - Cliente não encontrado',
            client_email: 'ERRO',
            client_phone: 'ERRO',
            product_id: 'ERRO',
            product_name: 'ERRO ao carregar produto',
            product_description: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            invoice_total: `${invoice.currencyprefix || 'R$ '}${invoice.total || '0.00'}${invoice.currencysuffix || ''}`,
            invoice_subtotal: `${invoice.currencyprefix || 'R$ '}${invoice.subtotal || '0.00'}${invoice.currencysuffix || ''}`,
            line_total: `${invoice.currencyprefix || 'R$ '}${invoice.total || '0.00'}${invoice.currencysuffix || ''}`,
            invoice_status: invoice.status,
            invoice_date: invoice.date,
            invoice_duedate: invoice.duedate,
            payment_method: invoice.paymentmethod || 'Não especificado',
            currency_code: invoice.currencycode || 'BRL',
            days_overdue: this.calculateDaysOverdue(invoice.duedate),
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      console.error(`Processamento concluído: ${detailedInvoices.length} linhas geradas`);

      // Calcular totais
      const totalAmount = pagedInvoices.reduce((sum, inv) => {
        return sum + parseFloat(inv.total || '0');
      }, 0);

      return {
        result: 'success',
        summary: {
          total_unpaid_invoices: totalAvailable || allUnpaidInvoices.length,
          returned_invoices: pagedInvoices.length,
          total_detail_lines: detailedInvoices.length,
          total_amount_unpaid: `R$ ${totalAmount.toFixed(2)}`,
          processed_at: new Date().toISOString()
        },
        invoices: detailedInvoices
      };

    } catch (error) {
      console.error('Erro em getAllUnpaidInvoicesComplete:', error);
      return {
        result: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        invoices: []
      };
    }
  }

  private calculateDaysOverdue(dueDate: string): number {
    if (!dueDate || dueDate === '0000-00-00') return 0;
    
    try {
      const due = new Date(dueDate);
      const now = new Date();
      const diffTime = now.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
    }
  }

  async getUnpaidInvoicesDetailed(
    params: GetUnpaidInvoicesDetailedParams = {}
  ): Promise<any> {
    const limitstart = params.limitstart ?? 0;
    const limitnum = params.limitnum ?? 20;
    const targetCount = limitstart + limitnum;

    // Get all unpaid and overdue invoices
    const unpaidInvoices = await this.getInvoices({ status: 'Unpaid', limitnum: targetCount });
    const overdueInvoices = await this.getInvoices({ status: 'Overdue', limitnum: targetCount });
    const totalAvailable =
      Number(unpaidInvoices.totalresults || unpaidInvoices.invoices?.invoice?.length || 0) +
      Number(overdueInvoices.totalresults || overdueInvoices.invoices?.invoice?.length || 0);

    // Combine both invoice lists
    const allUnpaidInvoices = [
      ...(unpaidInvoices.invoices?.invoice || []),
      ...(overdueInvoices.invoices?.invoice || [])
    ];
    const pagedInvoices = allUnpaidInvoices.slice(limitstart, limitstart + limitnum);

    // For each invoice, get client details and products
    const detailedInvoices = await Promise.all(
      pagedInvoices.map(async (invoice) => {
        try {
          // Get client details
          const clientDetails = await this.getClientsDetails({
            clientid: invoice.userid
          });

          // Get client products
          const clientProducts = await this.getClientsProducts({
            clientid: invoice.userid
          });

          // Extract phone number from client details
          const phoneNumber = clientDetails.client?.phonenumber || 'N/A';

          // Get product names for this client
          const productNames = clientProducts.products?.product
            ?.map(p => p.name)
            .join(', ') || 'N/A';

          return {
            invoice_id: invoice.id,
            invoice_number: invoice.invoicenum,
            client_id: invoice.userid,
            client_name: `${clientDetails.client?.firstname || ''} ${clientDetails.client?.lastname || ''}`.trim(),
            client_email: clientDetails.client?.email || 'N/A',
            client_phone: phoneNumber,
            products: productNames,
            invoice_total: invoice.total,
            invoice_balance: invoice.balance,
            invoice_status: invoice.status,
            invoice_date: invoice.date,
            invoice_duedate: invoice.duedate,
            payment_method: invoice.paymentmethod,
            currency_code: invoice.currency_code,
            currency_prefix: invoice.currency_prefix,
            currency_suffix: invoice.currency_suffix,
          };
        } catch (error) {
          // If we can't get details for this invoice, return basic info
          return {
            invoice_id: invoice.id,
            invoice_number: invoice.invoicenum,
            client_id: invoice.userid,
            client_name: 'Error fetching details',
            client_email: 'N/A',
            client_phone: 'N/A',
            products: 'N/A',
            invoice_total: invoice.total,
            invoice_balance: invoice.balance,
            invoice_status: invoice.status,
            invoice_date: invoice.date,
            invoice_duedate: invoice.duedate,
            payment_method: invoice.paymentmethod,
            currency_code: invoice.currency_code,
            currency_prefix: invoice.currency_prefix,
            currency_suffix: invoice.currency_suffix,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return {
      result: 'success',
      total_unpaid_invoices: totalAvailable,
      returned_invoices: detailedInvoices.length,
      invoices: detailedInvoices,
    };
  }

  async findInvoiceGaps(params: FindInvoiceGapsParams = {}): Promise<FindInvoiceGapsResult> {
    const months = params.months ?? 6;
    const includeStatuses = params.include_statuses ?? ['Paid', 'Unpaid', 'Overdue'];
    const excludeStatuses = new Set((params.exclude_statuses ?? ['Cancelled']).map((s) => s.toLowerCase()));
    const { start, end, keys: expectedMonths } = this.getMonthRange(months);

    const invoices = await this.listInvoicesForStatuses(includeStatuses, start);
    const filteredInvoices = invoices.filter((invoice) => {
      const status = invoice.status?.toLowerCase();
      return status ? !excludeStatuses.has(status) : true;
    });

    const invoicesByClient = new Map<number, Invoice[]>();
    for (const invoice of filteredInvoices) {
      const list = invoicesByClient.get(invoice.userid) ?? [];
      list.push(invoice);
      invoicesByClient.set(invoice.userid, list);
    }

    let eligibleClients = new Set(invoicesByClient.keys());
    const clientStartMonth = new Map<number, Date>();

    if (params.only_monthly_active) {
      const products = await this.listAllClientProducts();
      const monthlyActive = products.filter(
        (product) => product.status === 'Active' && product.billingcycle === 'Monthly'
      );
      eligibleClients = new Set(monthlyActive.map((product) => product.clientid));

      for (const product of monthlyActive) {
        const regDate = this.parseDate(product.regdate);
        if (!regDate) continue;
        const current = clientStartMonth.get(product.clientid);
        if (!current || regDate < current) {
          clientStartMonth.set(product.clientid, regDate);
        }
      }
    }

    const clientCache = new Map<number, ClientDetails>();
    const clients: FindInvoiceGapsClient[] = [];

    for (const clientId of eligibleClients) {
      const clientInvoices = invoicesByClient.get(clientId) ?? [];
      const presentMonths = new Set<string>();
      let lastInvoiceDate: Date | null = null;

      for (const invoice of clientInvoices) {
        const invoiceDate = this.parseDate(invoice.date);
        if (!invoiceDate) continue;
        if (invoiceDate < start || invoiceDate > end) continue;
        presentMonths.add(this.getMonthKey(invoiceDate));
        if (!lastInvoiceDate || invoiceDate > lastInvoiceDate) {
          lastInvoiceDate = invoiceDate;
        }
      }

      let expected = expectedMonths;
      const startDate = clientStartMonth.get(clientId);
      if (startDate) {
        const adjustedStart = this.getMonthStart(startDate);
        expected = expectedMonths.filter((monthKey) => {
          const [year, month] = monthKey.split('-').map(Number);
          const value = new Date(year, month - 1, 1);
          return value >= adjustedStart;
        });
      }

      const missing = expected.filter((monthKey) => !presentMonths.has(monthKey));
      if (missing.length === 0) {
        continue;
      }

      let clientDetails = clientCache.get(clientId);
      if (!clientDetails) {
        const response = await this.getClientsDetails({ clientid: clientId });
        clientDetails = response.client;
        clientCache.set(clientId, clientDetails);
      }

      clients.push({
        client_id: clientId,
        name: `${clientDetails.firstname || ''} ${clientDetails.lastname || ''}`.trim(),
        email: clientDetails.email || '',
        phone: clientDetails.phonenumber || '',
        missing_months: missing,
        last_invoice_date: lastInvoiceDate ? lastInvoiceDate.toISOString().slice(0, 10) : null,
      });
    }

    return {
      result: 'success',
      summary: {
        months,
        window_start: start.toISOString().slice(0, 10),
        window_end: end.toISOString().slice(0, 10),
        clients_checked: eligibleClients.size,
        clients_with_gaps: clients.length,
      },
      clients,
    };
  }

  async listClientsWithPendingInvoices(
    params: ListClientsWithPendingInvoicesParams = {}
  ): Promise<ListClientsWithPendingInvoicesResult> {
    const months = params.months ?? 6;
    const { start, end } = this.getMonthRange(months);
    const invoices = await this.listInvoicesForStatuses(['Unpaid', 'Overdue'], start);

    const clientsMap = new Map<number, PendingInvoiceClient>();
    let totalDue = 0;
    let totalInvoices = 0;

    for (const invoice of invoices) {
      const invoiceDate = this.parseDate(invoice.date);
      if (!invoiceDate || invoiceDate < start || invoiceDate > end) continue;
      const clientId = invoice.userid;
      const amount = Number.parseFloat(invoice.balance || invoice.total || '0') || 0;

      totalDue += amount;
      totalInvoices += 1;

      let client = clientsMap.get(clientId);
      if (!client) {
        const response = await this.getClientsDetails({ clientid: clientId });
        const details = response.client;
        client = {
          client_id: clientId,
          name: `${details.firstname || ''} ${details.lastname || ''}`.trim(),
          email: details.email || '',
          phone: details.phonenumber || '',
          pending_invoices: 0,
          total_due: '0.00',
          last_invoice_date: null,
        };
        clientsMap.set(clientId, client);
      }

      client.pending_invoices += 1;
      client.total_due = (Number.parseFloat(client.total_due) + amount).toFixed(2);
      const last = client.last_invoice_date ? new Date(client.last_invoice_date) : null;
      if (!last || invoiceDate > last) {
        client.last_invoice_date = invoiceDate.toISOString().slice(0, 10);
      }
    }

    return {
      result: 'success',
      summary: {
        months,
        window_start: start.toISOString().slice(0, 10),
        window_end: end.toISOString().slice(0, 10),
        clients_with_pending: clientsMap.size,
        pending_invoices: totalInvoices,
        total_due: totalDue.toFixed(2),
      },
      clients: Array.from(clientsMap.values()),
    };
  }
}
