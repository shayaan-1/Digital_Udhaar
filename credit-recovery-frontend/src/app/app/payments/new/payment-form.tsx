"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { PageHeader } from "@/components/app/page-header"
import { CustomerPicker } from "@/components/transactions/customer-picker"
import { createPayment } from "@/lib/api/transactions"
import { getApiErrorMessage } from "@/lib/api/errors"
import { PAYMENT_METHODS } from "@/lib/api/types"
import { todayISO } from "@/lib/format"
import { paymentSchema } from "@/lib/validations"
import { toast } from "@/components/ui/toast"

type FormValues = z.infer<typeof paymentSchema>

export function PaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetCustomer = searchParams.get("customer_id") || ""

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customer_id: presetCustomer,
      amount: "",
      payment_date: todayISO(),
      payment_method: "cash",
      reference_number: "",
      description: "",
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      await createPayment({
        customer_id: values.customer_id,
        amount: values.amount,
        payment_date: values.payment_date,
        payment_method: values.payment_method,
        reference_number: values.reference_number || null,
        description: values.description || null,
      })
      toast.add({ title: "Payment recorded", type: "success" })
      router.push(`/app/customers/${values.customer_id}/ledger`)
    } catch (error) {
      toast.add({
        title: "Payment failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    }
  }

  return (
    <div>
      <PageHeader
        title="Record payment"
        description="Apply a payment against a customer’s outstanding balance."
        breadcrumb={[{ label: "Dashboard", href: "/app" }, { label: "Payment" }]}
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

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input id="amount" placeholder="0.00" {...register("amount")} />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment date *</Label>
            <Input id="payment_date" type="date" max={todayISO()} {...register("payment_date")} />
          </div>
          <div className="space-y-2">
            <Label>Payment method *</Label>
            <Controller
              control={control}
              name="payment_method"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    if (v) field.onChange(v)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference</Label>
            <Input id="reference_number" {...register("reference_number")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Notes</Label>
            <Input id="description" {...register("description")} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-forest text-cream hover:bg-forest/90"
          >
            {isSubmitting ? "Saving…" : "Save payment"}
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
