import { api, newIdempotencyKey } from "@/lib/api/client"
import type {
  AdjustmentCreate,
  CreditSaleCreate,
  PaymentCreate,
  ReversalCreate,
  Transaction,
} from "@/lib/api/types"

function idempotentHeaders() {
  return { "Idempotency-Key": newIdempotencyKey() }
}

export async function createCreditSale(payload: CreditSaleCreate): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/transactions/credit-sale", payload, {
    headers: idempotentHeaders(),
  })
  return data
}

export async function createPayment(payload: PaymentCreate): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/transactions/payment", payload, {
    headers: idempotentHeaders(),
  })
  return data
}

export async function createAdjustment(payload: AdjustmentCreate): Promise<Transaction> {
  const { data } = await api.post<Transaction>("/transactions/adjustment", payload, {
    headers: idempotentHeaders(),
  })
  return data
}

export async function reverseTransaction(
  transactionId: string,
  payload: ReversalCreate
): Promise<Transaction> {
  const { data } = await api.post<Transaction>(
    `/transactions/${transactionId}/reverse`,
    payload,
    { headers: idempotentHeaders() }
  )
  return data
}
