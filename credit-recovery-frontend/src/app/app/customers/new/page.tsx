"use client"

import { useRouter } from "next/navigation"
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
import { createCustomer } from "@/lib/api/customers"
import { getApiErrorMessage } from "@/lib/api/errors"
import { customerCreateSchema } from "@/lib/validations"
import { toast } from "@/components/ui/toast"

type FormValues = z.infer<typeof customerCreateSchema>

export default function NewCustomerPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(customerCreateSchema),
    defaultValues: {
      name: "",
      mobile_number: "",
      business_name: "",
      whatsapp_number: "",
      address: "",
      city: "",
      notes: "",
      credit_limit: "0",
      opening_balance: "0",
      credit_status: "active",
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      const customer = await createCustomer({
        name: values.name,
        mobile_number: values.mobile_number,
        business_name: values.business_name || null,
        whatsapp_number: values.whatsapp_number || null,
        address: values.address || null,
        city: values.city || null,
        notes: values.notes || null,
        credit_limit: values.credit_limit,
        opening_balance: values.opening_balance,
        credit_status: values.credit_status,
      })
      toast.add({ title: "Customer added", type: "success" })
      router.push(`/app/customers/${customer.id}`)
    } catch (error) {
      toast.add({
        title: "Could not add customer",
        description: getApiErrorMessage(error),
        type: "error",
      })
    }
  }

  return (
    <div>
      <PageHeader
        title="Add customer"
        description="Name and mobile are required."
        breadcrumb={[
          { label: "Customers", href: "/app/customers" },
          { label: "New" },
        ]}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl space-y-5 rounded-xl border border-forest/10 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile_number">Mobile *</Label>
            <Input
              id="mobile_number"
              aria-invalid={!!errors.mobile_number}
              {...register("mobile_number")}
            />
            {errors.mobile_number && (
              <p className="text-sm text-destructive">{errors.mobile_number.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">WhatsApp</Label>
            <Input id="whatsapp_number" {...register("whatsapp_number")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="business_name">Business name</Label>
            <Input id="business_name" {...register("business_name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credit_limit">Credit limit</Label>
            <Input id="credit_limit" {...register("credit_limit")} />
            {errors.credit_limit && (
              <p className="text-sm text-destructive">{errors.credit_limit.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="opening_balance">Opening balance</Label>
            <Input id="opening_balance" {...register("opening_balance")} />
            {errors.opening_balance && (
              <p className="text-sm text-destructive">{errors.opening_balance.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Credit status</Label>
            <Controller
              control={control}
              name="credit_status"
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              {...register("notes")}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-forest text-cream hover:bg-forest/90"
          >
            {isSubmitting ? "Saving…" : "Save customer"}
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
