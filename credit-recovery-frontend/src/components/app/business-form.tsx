"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { getMyBusiness, updateMyBusiness } from "@/lib/api/businesses"
import { getApiErrorMessage } from "@/lib/api/errors"
import { businessSchema } from "@/lib/validations"
import { LoadingBlock } from "@/components/app/ui-states"

type BusinessForm = z.infer<typeof businessSchema>

export function BusinessFormFields({
  onSuccess,
  submitLabel = "Save changes",
  showSkip,
  onSkip,
}: {
  onSuccess?: () => void
  submitLabel?: string
  showSkip?: boolean
  onSkip?: () => void
}) {
  const [loading, setLoading] = useState(true)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      whatsapp_number: "",
      currency: "PKR",
      payment_instructions: "",
    },
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const biz = await getMyBusiness()
        if (cancelled) return
        reset({
          name: biz.name,
          address: biz.address ?? "",
          phone: biz.phone ?? "",
          whatsapp_number: biz.whatsapp_number ?? "",
          currency: biz.currency || "PKR",
          payment_instructions: biz.payment_instructions ?? "",
        })
      } catch (error) {
        toast.add({
          title: "Could not load profile",
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
  }, [reset])

  async function onSubmit(values: BusinessForm) {
    try {
      await updateMyBusiness({
        name: values.name,
        address: values.address || null,
        phone: values.phone || null,
        whatsapp_number: values.whatsapp_number || null,
        currency: values.currency,
        payment_instructions: values.payment_instructions || null,
      })
      toast.add({
        title: "Saved",
        description: "Business profile updated.",
        type: "success",
      })
      onSuccess?.()
    } catch (error) {
      toast.add({
        title: "Save failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    }
  }

  if (loading) return <LoadingBlock label="Loading business profile…" />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Business name</Label>
        <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp_number">WhatsApp number</Label>
          <Input id="whatsapp_number" {...register("whatsapp_number")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register("address")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Input id="currency" {...register("currency")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="payment_instructions">Payment instructions</Label>
        <textarea
          id="payment_instructions"
          rows={4}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="Bank details, JazzCash / Easypaisa numbers…"
          {...register("payment_instructions")}
        />
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-forest text-cream hover:bg-forest/90"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
        {showSkip && onSkip && (
          <Button type="button" variant="outline" onClick={onSkip} className="border-forest/20">
            Skip for now
          </Button>
        )}
      </div>
    </form>
  )
}
