"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { reverseTransaction } from "@/lib/api/transactions"
import { getApiErrorMessage } from "@/lib/api/errors"
import { toast } from "@/components/ui/toast"

export function ReverseTransactionDialog({
  transactionId,
  open,
  onOpenChange,
  onReversed,
}: {
  transactionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReversed: () => void
}) {
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!transactionId) return
    if (!reason.trim()) {
      toast.add({ title: "Reason required", type: "warning" })
      return
    }
    setSubmitting(true)
    try {
      await reverseTransaction(transactionId, { reason: reason.trim() })
      toast.add({ title: "Transaction reversed", type: "success" })
      setReason("")
      onOpenChange(false)
      onReversed()
    } catch (error) {
      toast.add({
        title: "Reversal failed",
        description: getApiErrorMessage(error),
        type: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)]">
            Reverse transaction
          </DialogTitle>
          <DialogDescription>
            Corrections are reversal-only. Enter a reason for the audit trail.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="reason">Reason</Label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder="e.g. Wrong amount entered"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-forest/20">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-risk-high text-cream hover:bg-risk-high/90"
          >
            {submitting ? "Reversing…" : "Reverse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
