"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/app/page-header"
import { EmptyState, LoadingBlock, StatCard } from "@/components/app/ui-states"
import {
  archiveCustomer,
  getCustomer,
  updateCustomer,
} from "@/lib/api/customers"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { Customer } from "@/lib/api/types"
import { formatDate, formatMoney } from "@/lib/format"
import { toast } from "@/components/ui/toast"

const editSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  mobile_number: z
    .string()
    .trim()
    .min(1, "Mobile is required")
    .refine((v) => (v.match(/\d/g) || []).length >= 7, "Mobile number does not look valid"),
  business_name: z.string().max(255).optional().nullable(),
  whatsapp_number: z.string().max(20).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  credit_limit: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount"),
  credit_status: z.enum(["active", "restricted", "blocked"]),
})
type FormValues = z.infer<typeof editSchema>

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getCustomer(id)
        if (cancelled) return
        setCustomer(data)
        reset({
          name: data.name,
          mobile_number: data.mobile_number,
          business_name: data.business_name ?? "",
          whatsapp_number: data.whatsapp_number ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          notes: data.notes ?? "",
          credit_limit: String(data.credit_limit),
          credit_status: data.credit_status,
        })
      } catch (error) {
        toast.add({
          title: "Retailer not found",
          description: getApiErrorMessage(error),
          type: "error",
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, reset])

  async function onSubmit(values: FormValues) {
    try {
      const updated = await updateCustomer(id, {
        name: values.name,
        mobile_number: values.mobile_number,
        business_name: values.business_name || null,
        whatsapp_number: values.whatsapp_number || null,
        address: values.address || null,
        city: values.city || null,
        notes: values.notes || null,
        credit_limit: values.credit_limit,
        credit_status: values.credit_status,
      })
      setCustomer(updated)
      setEditing(false)
      toast.add({ title: "Retailer updated", type: "success" })
    } catch (error) {
      toast.add({
        title: "Update failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    }
  }

  async function handleArchive() {
    if (!customer) return
    if (!window.confirm(`Archive ${customer.name}?`)) return
    try {
      const updated = await archiveCustomer(id)
      setCustomer(updated)
      toast.add({ title: "Retailer archived", type: "success" })
    } catch (error) {
      toast.add({
        title: "Archive failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    }
  }

  if (loading) return <LoadingBlock label="Loading retailer…" />
  if (!customer) {
    return (
      <EmptyState
        title="Retailer not found"
        action={
          <Button render={<Link href="/app/customers" />} nativeButton={false}>
            Back to list
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={customer.business_name || customer.mobile_number}
        breadcrumb={[
          { label: "Retailers", href: "/app/customers" },
          { label: customer.name },
        ]}
        actions={
          <>
            <Button
              render={<Link href={`/app/customers/${id}/ledger`} />}
              nativeButton={false}
              variant="outline"
              className="border-forest/20"
            >
              View ledger
            </Button>
            <Button
              render={<Link href={`/app/sales/new?customer_id=${id}`} />}
              nativeButton={false}
              className="bg-gold text-forest hover:bg-gold/90"
            >
              Credit sale
            </Button>
            <Button
              render={<Link href={`/app/payments/new?customer_id=${id}`} />}
              nativeButton={false}
              className="bg-forest text-cream hover:bg-forest/90"
            >
              Record payment
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Outstanding" value={formatMoney(customer.current_outstanding)} />
        <StatCard label="Credit limit" value={formatMoney(customer.credit_limit)} />
        <StatCard label="Total purchases" value={formatMoney(customer.total_purchases)} />
        <StatCard label="Total payments" value={formatMoney(customer.total_payments)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="capitalize border-forest/20 text-forest">
          {customer.credit_status}
        </Badge>
        {customer.archived_at && (
          <Badge variant="outline" className="text-ink/50">
            Archived {formatDate(customer.archived_at)}
          </Badge>
        )}
        <span className="text-xs text-ink/50">
          Last purchase {formatDate(customer.last_purchase_date)} · Last payment{" "}
          {formatDate(customer.last_payment_date)}
        </span>
      </div>

      <div className="rounded-xl border border-forest/10 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-forest">
            Details
          </h2>
          <div className="flex gap-2">
            {!editing && (
              <Button
                size="sm"
                variant="outline"
                className="border-forest/20"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
            {!customer.archived_at && (
              <Button size="sm" variant="ghost" onClick={handleArchive}>
                Archive
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              render={<Link href={`/app/adjustments/new?customer_id=${id}`} />}
              nativeButton={false}
            >
              Adjust balance
            </Button>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Shop / retailer name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile</Label>
                <Input id="mobile_number" {...register("mobile_number")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp (optional)</Label>
                <Input id="whatsapp_number" {...register("whatsapp_number")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_name">Business name</Label>
                <Input id="business_name" {...register("business_name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Credit limit</Label>
                <Input id="credit_limit" {...register("credit_limit")} />
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
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  rows={3}
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
                  {...register("notes")}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-forest text-cream hover:bg-forest/90"
              >
                {isSubmitting ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-forest/20"
                onClick={() => {
                  setEditing(false)
                  reset()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink/50">Mobile</dt>
              <dd className="font-[family-name:var(--font-mono)]">{customer.mobile_number}</dd>
            </div>
            <div>
              <dt className="text-ink/50">WhatsApp (optional)</dt>
              <dd>{customer.whatsapp_number || "—"}</dd>
            </div>
            <div>
              <dt className="text-ink/50">City</dt>
              <dd>{customer.city || "—"}</dd>
            </div>
            <div>
              <dt className="text-ink/50">Address</dt>
              <dd>{customer.address || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-ink/50">Notes</dt>
              <dd>{customer.notes || "—"}</dd>
            </div>
            <div>
              <dt className="text-ink/50">Opening balance</dt>
              <dd className="font-[family-name:var(--font-mono)]">
                {formatMoney(customer.opening_balance)}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  )
}
