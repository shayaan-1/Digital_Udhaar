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
import { createAdjustment } from "@/lib/api/transactions"
import { getApiErrorMessage } from "@/lib/api/errors"
import { adjustmentSchema } from "@/lib/validations"
import { toast } from "@/components/ui/toast"

type FormValues = z.infer<typeof adjustmentSchema>

export function AdjustmentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetCustomer = searchParams.get("customer_id") || ""

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      customer_id: presetCustomer,
      amount: "",
      direction: "increase",
      description: "",
      reference_number: "",
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      await createAdjustment({
        customer_id: values.customer_id,
        amount: values.amount,
        direction: values.direction,
        description: values.description,
        reference_number: values.reference_number || null,
      })
      toast.add({ title: "Adjustment recorded", type: "success" })
      router.push(`/app/customers/${values.customer_id}/ledger`)
    } catch (error) {
      toast.add({
        title: "Adjustment failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    }
  }

  return (
    <div>
      <PageHeader
        title="Manual adjustment"
        description="Increase or decrease a customer’s outstanding balance with a required note."
        breadcrumb={[{ label: "Dashboard", href: "/app" }, { label: "Adjustment" }]}
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
            <Label>Direction *</Label>
            <Controller
              control={control}
              name="direction"
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
                    <SelectItem value="increase">Increase outstanding</SelectItem>
                    <SelectItem value="decrease">Decrease outstanding</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Reason *</Label>
            <Input id="description" {...register("description")} />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reference_number">Reference</Label>
            <Input id="reference_number" {...register("reference_number")} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-forest text-cream hover:bg-forest/90"
          >
            {isSubmitting ? "Saving…" : "Save adjustment"}
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
