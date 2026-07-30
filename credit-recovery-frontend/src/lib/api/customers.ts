import { api } from "@/lib/api/client"
import type {
  CreditSaleContext,
  Customer,
  CustomerCreate,
  CustomerUpdate,
  PaginatedCustomers,
  PaginatedLedger,
  TransactionType,
} from "@/lib/api/types"

export type ListCustomersParams = {
  search?: string
  include_archived?: boolean
  page?: number
  page_size?: number
}

export async function listCustomers(params: ListCustomersParams = {}): Promise<PaginatedCustomers> {
  const { data } = await api.get<PaginatedCustomers>("/customers", { params })
  return data
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await api.get<Customer>(`/customers/${id}`)
  return data
}

export async function createCustomer(payload: CustomerCreate): Promise<Customer> {
  const { data } = await api.post<Customer>("/customers", payload)
  return data
}

export async function updateCustomer(id: string, payload: CustomerUpdate): Promise<Customer> {
  const { data } = await api.patch<Customer>(`/customers/${id}`, payload)
  return data
}

export async function archiveCustomer(id: string): Promise<Customer> {
  const { data } = await api.post<Customer>(`/customers/${id}/archive`)
  return data
}

export async function getCreditSaleContext(customerId: string): Promise<CreditSaleContext> {
  const { data } = await api.get<CreditSaleContext>(`/customers/${customerId}/credit-sale-context`)
  return data
}

export type LedgerParams = {
  date_from?: string
  date_to?: string
  type?: TransactionType
  page?: number
  page_size?: number
}

export async function getCustomerLedger(
  customerId: string,
  params: LedgerParams = {}
): Promise<PaginatedLedger> {
  const { data } = await api.get<PaginatedLedger>(`/customers/${customerId}/ledger`, { params })
  return data
}
