"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/app/page-header"
import { EmptyState, LoadingBlock } from "@/components/app/ui-states"
import { ReverseTransactionDialog } from "@/components/transactions/reverse-dialog"
import { getCustomer, getCustomerLedger } from "@/lib/api/customers"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { Customer, Transaction, TransactionType } from "@/lib/api/types"
import { TRANSACTION_TYPE_LABELS } from "@/lib/api/types"
import { formatDate, formatDateTime, formatMoney } from "@/lib/format"
import { toast } from "@/components/ui/toast"

function isDebit(tx: Transaction): boolean {
  if (tx.type === "credit_sale" || tx.type === "opening_balance") return true
  if (tx.type === "adjustment") return tx.adjustment_direction === "increase"
  if (tx.type === "payment") return false
  return Number(tx.amount) > 0
}

export default function CustomerLedgerPage() {
  const params = useParams<{ id: string }>()
  const customerId = params.id

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<Transaction[]>([])
  const [opening, setOpening] = useState("0")
  const [closing, setClosing] = useState("0")
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all")
  const [loading, setLoading] = useState(true)
  const [reverseId, setReverseId] = useState<string | null>(null)
  const pageSize = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cust, ledger] = await Promise.all([
        getCustomer(customerId),
        getCustomerLedger(customerId, {
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          type: typeFilter === "all" ? undefined : typeFilter,
          page,
          page_size: pageSize,
        }),
      ])
      setCustomer(cust)
      setItems(ledger.items)
      setOpening(ledger.opening_balance)
      setClosing(ledger.closing_balance)
      setTotal(ledger.total)
    } catch (error) {
      toast.add({
        title: "Could not load ledger",
        description: getApiErrorMessage(error),
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [customerId, dateFrom, dateTo, typeFilter, page])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <PageHeader
        title={customer ? `${customer.name} — Ledger` : "Ledger"}
        description="Chronological transactions with running balance."
        breadcrumb={[
          { label: "Customers", href: "/app/customers" },
          { label: customer?.name || "…", href: `/app/customers/${customerId}` },
          { label: "Ledger" },
        ]}
        actions={
          <>
            <Button
              render={<Link href={`/app/sales/new?customer_id=${customerId}`} />}
              nativeButton={false}
              className="bg-gold text-forest hover:bg-gold/90"
            >
              Credit sale
            </Button>
            <Button
              render={<Link href={`/app/payments/new?customer_id=${customerId}`} />}
              nativeButton={false}
              className="bg-forest text-cream hover:bg-forest/90"
            >
              Payment
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-forest/10 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1">
          <Label htmlFor="date_from" className="text-xs">
            From
          </Label>
          <Input
            id="date_from"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setPage(1)
              setDateFrom(e.target.value)
            }}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="date_to" className="text-xs">
            To
          </Label>
          <Input
            id="date_to"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setPage(1)
              setDateTo(e.target.value)
            }}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setPage(1)
              setTypeFilter((v as TransactionType | "all") || "all")
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="credit_sale">Credit sale</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
              <SelectItem value="opening_balance">Opening balance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-4 font-[family-name:var(--font-mono)] text-sm">
          <span className="text-ink/60">
            Opening{" "}
            <strong className="text-forest">{formatMoney(opening)}</strong>
          </span>
          <span className="text-ink/60">
            Closing{" "}
            <strong className="text-forest">{formatMoney(closing)}</strong>
          </span>
        </div>
      </div>

      {loading && <LoadingBlock label="Loading ledger…" />}

      {!loading && items.length === 0 && (
        <EmptyState
          title="No transactions"
          description="Record a credit sale or payment to start this ledger."
          action={
            <Button
              render={<Link href={`/app/sales/new?customer_id=${customerId}`} />}
              nativeButton={false}
              className="bg-forest text-cream hover:bg-forest/90"
            >
              Record sale
            </Button>
          }
        />
      )}

      {!loading && items.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-forest/10 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-right"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((tx) => {
                const debit = isDebit(tx)
                const remarks = [
                  tx.invoice_number && `Inv ${tx.invoice_number}`,
                  tx.payment_method,
                  tx.reference_number,
                  tx.description,
                  tx.is_reversal && "Reversal",
                ]
                  .filter(Boolean)
                  .join(" · ")

                return (
                  <TableRow key={tx.id} className={tx.is_reversal ? "opacity-70" : undefined}>
                    <TableCell className="whitespace-nowrap font-[family-name:var(--font-mono)] text-xs">
                      {tx.invoice_date
                        ? formatDate(tx.invoice_date)
                        : formatDateTime(tx.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {TRANSACTION_TYPE_LABELS[tx.type]}
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-mono)]">
                      {debit ? formatMoney(tx.amount) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-mono)]">
                      {!debit ? formatMoney(tx.amount) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-[family-name:var(--font-mono)] font-medium">
                      {formatMoney(tx.running_balance)}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-ink/60">
                      {remarks || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {!tx.is_reversal && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-risk-high"
                          onClick={() => setReverseId(tx.id)}
                        >
                          Reverse
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-forest/10 px-4 py-3 text-sm text-ink/60">
            <span>
              {total} transaction{total === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-forest/20"
              >
                Previous
              </Button>
              <span className="font-[family-name:var(--font-mono)] text-xs">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-forest/20"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <ReverseTransactionDialog
        transactionId={reverseId}
        open={!!reverseId}
        onOpenChange={(open) => {
          if (!open) setReverseId(null)
        }}
        onReversed={() => void load()}
      />
    </div>
  )
}
