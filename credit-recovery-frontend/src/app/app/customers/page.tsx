"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { listCustomers, archiveCustomer } from "@/lib/api/customers"
import { getApiErrorMessage } from "@/lib/api/errors"
import type { CustomerListItem } from "@/lib/api/types"
import { formatMoney } from "@/lib/format"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

function statusBadge(status: string) {
  const styles =
    status === "blocked"
      ? "border-risk-high/30 bg-risk-high/10 text-risk-high"
      : status === "restricted"
        ? "border-risk-medium/30 bg-risk-medium/10 text-risk-medium"
        : "border-forest/20 bg-forest/5 text-forest"
  return (
    <Badge variant="outline" className={cn("capitalize", styles)}>
      {status}
    </Badge>
  )
}

export default function CustomersPage() {
  const router = useRouter()
  const [items, setItems] = useState<CustomerListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [includeArchived, setIncludeArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const pageSize = 20

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, includeArchived])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listCustomers({
        search: debouncedSearch || undefined,
        include_archived: includeArchived,
        page,
        page_size: pageSize,
      })
      setItems(data.items)
      setTotal(data.total)
    } catch (error) {
      toast.add({
        title: "Could not load retailers",
        description: getApiErrorMessage(error),
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, includeArchived, page])

  useEffect(() => {
    void load()
  }, [load])

  async function handleArchive(id: string, name: string) {
    if (!window.confirm(`Archive ${name}? Their ledger history is kept.`)) return
    try {
      await archiveCustomer(id)
      toast.add({ title: "Retailer archived", type: "success" })
      void load()
    } catch (error) {
      toast.add({
        title: "Archive failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <PageHeader
        title="Retailers"
        description="Search, edit, and manage your retailer credit accounts."
        actions={
          <Button
            render={<Link href="/app/customers/new" />}
            nativeButton={false}
            className="bg-gold text-forest hover:bg-gold/90"
          >
            Add retailer
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by shop name or mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-white"
        />
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="size-4 rounded border-forest/30"
          />
          Show archived
        </label>
      </div>

      {loading && <LoadingBlock label="Loading retailers…" />}

      {!loading && items.length === 0 && (
        <EmptyState
          title="No retailers yet"
          description="Add your first retailer to start recording credit sales."
          action={
            <Button
              render={<Link href="/app/customers/new" />}
              nativeButton={false}
              className="bg-forest text-cream hover:bg-forest/90"
            >
              Add retailer
            </Button>
          }
        />
      )}

      {!loading && items.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-forest/10 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Credit limit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/app/customers/${c.id}`)}
                >
                  <TableCell>
                    <div className="font-medium text-forest">{c.name}</div>
                    {c.business_name && (
                      <div className="text-xs text-ink/50">{c.business_name}</div>
                    )}
                    {c.archived_at && (
                      <Badge variant="outline" className="mt-1 text-ink/50">
                        Archived
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-[family-name:var(--font-mono)] text-sm">
                    {c.mobile_number}
                  </TableCell>
                  <TableCell>{statusBadge(c.credit_status)}</TableCell>
                  <TableCell className="text-right font-[family-name:var(--font-mono)]">
                    {formatMoney(c.current_outstanding)}
                  </TableCell>
                  <TableCell className="text-right font-[family-name:var(--font-mono)]">
                    {formatMoney(c.credit_limit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {!c.archived_at && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-ink/60"
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleArchive(c.id, c.name)
                        }}
                      >
                        Archive
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-forest/10 px-4 py-3 text-sm text-ink/60">
            <span>
              {total} retailer{total === 1 ? "" : "s"}
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
    </div>
  )
}
