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
}
