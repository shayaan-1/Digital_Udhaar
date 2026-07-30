"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/app/page-header"
import { CustomerPicker } from "@/components/transactions/customer-picker"
import { getCreditSaleContext } from "@/lib/api/customers"
import { createCreditSale } from "@/lib/api/transactions"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { CreditSaleContext } from "@/lib/api/types"
import { formatMoney, todayISO } from "@/lib/format"
import { creditSaleSchema } from "@/lib/validations"
import { toast } from "@/components/ui/toast"

type FormValues = z.infer<typeof creditSaleSchema>

export function CreditSaleForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetCustomer = searchParams.get("customer_id") || ""
  const [context, setContext] = useState<CreditSaleContext | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(creditSaleSchema),
    defaultValues: {
      customer_id: presetCustomer,
      amount: "",
      invoice_number: "",
      invoice_date: todayISO(),
      description: "",
      override_credit_limit: false,
    },
  })

  const customerId = watch("customer_id")
  const amount = watch("amount")
  const override = watch("override_credit_limit")

  useEffect(() => {
    if (!customerId) {
      setContext(null)
      return
    }
    let cancelled = false
    async function load() {
      try {
        const ctx = await getCreditSaleContext(customerId)
        if (!cancelled) setContext(ctx)
      } catch {
        if (!cancelled) setContext(null)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [customerId])

  const overLimit = useMemo(() => {
    if (!context || !amount || Number.isNaN(Number(amount))) return false
    return Number(amount) > Number(context.available_credit)
  }, [context, amount])

  async function onSubmit(values: FormValues) {
    if (overLimit && !values.override_credit_limit) {
      toast.add({
        title: "Over credit limit",
        description: "Confirm the override checkbox to proceed.",
        type: "warning",
      })
      return
    }
    try {
      await createCreditSale({
        customer_id: values.customer_id,
        amount: values.amount,
        invoice_number: values.invoice_number,
        invoice_date: values.invoice_date,
        description: values.description || null,
        override_credit_limit: values.override_credit_limit,
      })
      toast.add({ title: "Credit sale recorded", type: "success" })
      router.push(`/app/customers/${values.customer_id}/ledger`)
    } catch (error) {
      toast.add({
        title: "Sale failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    }
  }

  return (
    <div>
      <PageHeader
        title="Record credit sale"
        description="Invoice on credit against a customer’s account."
        breadcrumb={[{ label: "Dashboard", href: "/app" }, { label: "Credit sale" }]}
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl space-y-5 rounded-xl border border-forest/10 bg-white p-6 shadow-sm"
      >
        <Controller
          control={control}
          name="customer_id"
          render={({ field }) => (
            <CustomerPicker value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.customer_id && (
          <p className="text-sm text-destructive">{errors.customer_id.message}</p>
        )}

        {context && (
          <div className="rounded-lg border border-forest/10 bg-sand/60 px-4 py-3 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                Outstanding:{" "}
                <strong className="font-[family-name:var(--font-mono)]">
                  {formatMoney(context.current_outstanding)}
                </strong>
              </span>
              <span>
                Limit:{" "}
                <strong className="font-[family-name:var(--font-mono)]">
                  {formatMoney(context.credit_limit)}
                </strong>
              </span>
              <span>
                Available:{" "}
                <strong className="font-[family-name:var(--font-mono)]">
                  {formatMoney(context.available_credit)}
                </strong>
              </span>
            </div>
          </div>
        )}

        {overLimit && (
          <div className="rounded-lg border border-risk-high/30 bg-risk-high/10 px-4 py-3 text-sm text-risk-high">
            This sale exceeds available credit. Confirm owner override below to continue.
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input id="amount" placeholder="0.00" {...register("amount")} />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice_date">Invoice date *</Label>
            <Input id="invoice_date" type="date" max={todayISO()} {...register("invoice_date")} />
            {errors.invoice_date && (
              <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="invoice_number">Invoice number *</Label>
            <Input id="invoice_number" {...register("invoice_number")} />
            {errors.invoice_number && (
              <p className="text-sm text-destructive">{errors.invoice_number.message}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Notes</Label>
            <Input id="description" {...register("description")} />
          </div>
        </div>

        {overLimit && (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4"
              checked={override}
              onChange={(e) => setValue("override_credit_limit", e.target.checked)}
            />
            <span>I confirm this over-limit sale as the owner.</span>
          </label>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gold text-forest hover:bg-gold/90"
          >
            {isSubmitting ? "Saving…" : "Save sale"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-forest/20"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
