export type Role = "owner" | "manager" | "staff"

export type CreditStatus = "active" | "restricted" | "blocked"

export type TransactionType = "credit_sale" | "payment" | "adjustment" | "opening_balance"

export type AdjustmentDirection = "increase" | "decrease"

export type AccessTokenResponse = {
  access_token: string
  token_type: string
  expires_in_minutes: number
  user_id: string
  business_id: string
  role: Role
}

export type SignupRequest = {
  business_name: string
  email: string
  password: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type Business = {
  id: string
  name: string
  logo_url: string | null
  address: string | null
  phone: string | null
  whatsapp_number: string | null
  currency: string
  payment_instructions: string | null
  created_at: string
  updated_at: string
}

export type BusinessUpdate = {
  name?: string
  address?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  currency?: string
  payment_instructions?: string | null
}

export type CustomerListItem = {
  id: string
  name: string
  business_name: string | null
  mobile_number: string
  credit_status: CreditStatus
  current_outstanding: string
  credit_limit: string
  archived_at: string | null
}

export type Customer = {
  id: string
  name: string
  business_name: string | null
  mobile_number: string
  whatsapp_number: string | null
  address: string | null
  city: string | null
  notes: string | null
  credit_limit: string
  opening_balance: string
  credit_status: CreditStatus
  current_outstanding: string
  total_purchases: string
  total_payments: string
  last_purchase_date: string | null
  last_payment_date: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type CustomerCreate = {
  name: string
  mobile_number: string
  business_name?: string | null
  whatsapp_number?: string | null
  address?: string | null
  city?: string | null
  notes?: string | null
  credit_limit?: string
  opening_balance?: string
  credit_status?: CreditStatus
}

export type CustomerUpdate = {
  name?: string
  mobile_number?: string
  business_name?: string | null
  whatsapp_number?: string | null
  address?: string | null
  city?: string | null
  notes?: string | null
  credit_limit?: string
  credit_status?: CreditStatus
}

export type PaginatedCustomers = {
  items: CustomerListItem[]
  total: number
  page: number
  page_size: number
}

export type CreditSaleContext = {
  customer_id: string
  current_outstanding: string
  credit_limit: string
  credit_status: CreditStatus
  available_credit: string
  average_payment_delay_days: number
  risk_rating: string
}

export type Transaction = {
  id: string
  customer_id: string
  type: TransactionType
  amount: string
  invoice_number: string | null
  invoice_date: string | null
  payment_method: string | null
  adjustment_direction: AdjustmentDirection | null
  reference_number: string | null
  description: string | null
  is_reversal: boolean
  reversed_transaction_id: string | null
  running_balance: string
  created_by: string
  created_at: string
}

export type CreditSaleCreate = {
  customer_id: string
  amount: string
  invoice_number: string
  invoice_date: string
  description?: string | null
  override_credit_limit?: boolean
}

export type PaymentCreate = {
  customer_id: string
  amount: string
  payment_date: string
  payment_method: string
  reference_number?: string | null
  description?: string | null
}

export type AdjustmentCreate = {
  customer_id: string
  amount: string
  direction: AdjustmentDirection
  description: string
  reference_number?: string | null
}

export type ReversalCreate = {
  reason: string
}

export type PaginatedLedger = {
  items: Transaction[]
  total: number
  page: number
  page_size: number
  opening_balance: string
  closing_balance: string
}

export type DashboardSummary = {
  todays_credit_sales: string
  todays_payments: string
  total_outstanding: string
  total_customers: number
  active_customers: number
  archived_customers: number
}

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "easypaisa", label: "Easypaisa" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "other", label: "Other" },
] as const

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  credit_sale: "Credit sale",
  payment: "Payment",
  adjustment: "Adjustment",
  opening_balance: "Opening balance",
}
