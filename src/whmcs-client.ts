import axios, { AxiosInstance } from 'axios';
import type {
  WHMCSConfig,
  GetTicketsParams,
  GetTicketsResponse,
  GetTicketParams,
  GetTicketResponse,
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
} from './types.js';

export class WHMCSClient {
  private client: AxiosInstance;
  private identifier: string;
  private secret: string;

  constructor(config: WHMCSConfig) {
    this.identifier = config.identifier;
    this.secret = config.secret;

    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  private async request<T>(action: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const requestParams = new URLSearchParams({
        action,
        identifier: this.identifier,
        secret: this.secret,
        responsetype: 'json',
        ...this.serializeParams(params),
      });

      const response = await this.client.post('', requestParams.toString());

      if (response.data.result === 'error') {
        throw new Error(response.data.message || 'WHMCS API error');
      }

      return response.data as T;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`WHMCS API request failed: ${error.message}`);
      }
      throw error;
    }
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

  // Custom Combined Methods

  async getAllUnpaidInvoicesComplete(limit: number = 1000): Promise<any> {
    try {
      console.error(`Buscando faturas não pagas (limite: ${limit})...`);
      
      // Buscar todas as faturas não pagas em páginas
      const allUnpaidInvoices: any[] = [];
      const pageSize = 100; // Tamanho da página
      let currentPage = 0;
      let totalFetched = 0;
      let hasMore = true;

      // Buscar faturas "Unpaid" e "Overdue"
      for (const status of ['Unpaid', 'Overdue']) {
        console.error(`Buscando faturas com status: ${status}`);
        currentPage = 0;
        hasMore = true;

        while (hasMore && totalFetched < limit) {
          const invoicesResponse = await this.getInvoices({
            status,
            limitstart: currentPage * pageSize,
            limitnum: Math.min(pageSize, limit - totalFetched)
          });

          const invoices = invoicesResponse.invoices?.invoice || [];
          
          if (invoices.length === 0) {
            hasMore = false;
            continue;
          }

          allUnpaidInvoices.push(...invoices);
          totalFetched += invoices.length;
          currentPage++;

          // Se retornou menos que o pageSize, não há mais páginas
          if (invoices.length < pageSize) {
            hasMore = false;
          }
        }
      }

      console.error(`Total de faturas encontradas: ${allUnpaidInvoices.length}`);

      // Para cada fatura, buscar detalhes completos
      const detailedInvoices = [];
      let processed = 0;

      for (const invoice of allUnpaidInvoices) {
        try {
          processed++;
          if (processed % 10 === 0) {
            console.error(`Processando fatura ${processed}/${allUnpaidInvoices.length}...`);
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
      const totalAmount = allUnpaidInvoices.reduce((sum, inv) => {
        return sum + parseFloat(inv.total || '0');
      }, 0);

      return {
        result: 'success',
        summary: {
          total_unpaid_invoices: allUnpaidInvoices.length,
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

  async getUnpaidInvoicesDetailed(): Promise<any> {
    // Get all unpaid and overdue invoices
    const unpaidInvoices = await this.getInvoices({ status: 'Unpaid', limitnum: 10 });
    const overdueInvoices = await this.getInvoices({ status: 'Overdue', limitnum: 10 });

    // Combine both invoice lists
    const allUnpaidInvoices = [
      ...(unpaidInvoices.invoices?.invoice || []),
      ...(overdueInvoices.invoices?.invoice || [])
    ];

    // For each invoice, get client details and products
    const detailedInvoices = await Promise.all(
      allUnpaidInvoices.map(async (invoice) => {
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
      total_unpaid_invoices: detailedInvoices.length,
      invoices: detailedInvoices,
    };
  }
}
