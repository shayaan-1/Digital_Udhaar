"use client"

import { useEffect, useState } from "react"
import { listCustomers } from "@/lib/api/customers"
import type { CustomerListItem } from "@/lib/api/types"
import { formatMoney } from "@/lib/format"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CustomerPicker({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}) {
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await listCustomers({ page: 1, page_size: 100, include_archived: false })
        if (!cancelled) setCustomers(data.items)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-2">
      <Label>Retailer</Label>
      <Select
        value={value || undefined}
        onValueChange={(v) => {
          if (v) onChange(v)
        }}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading…" : "Select retailer"} />
        </SelectTrigger>
        <SelectContent>
          {customers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name} · {formatMoney(c.current_outstanding)} outstanding
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
