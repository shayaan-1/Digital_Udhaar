"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"

type DemoRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DemoRequestDialog({ open, onOpenChange }: DemoRequestDialogProps) {
  const [businessName, setBusinessName] = useState("")
  const [phone, setPhone] = useState("")

  function handleSubmit() {
    if (!businessName || !phone) {
      toast.add({
        title: "Missing details",
        description: "Add your business name and phone number to continue.",
        type: "warning",
      })
      return
    }
    onOpenChange(false)
    toast.add({
      title: "Request received",
      description: `We'll call ${businessName} within a day to set up your account.`,
      type: "success",
    })
    setBusinessName("")
    setPhone("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)]">
            See Wasooli on your retailer ledger
          </DialogTitle>
          <DialogDescription>
            Tell us about your distribution business — we&apos;ll walk through
            risk, collections, and your outstanding.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="business-name">Distributor / business name</Label>
            <Input
              id="business-name"
              placeholder="e.g. Malik Distributors"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              placeholder="03xx-xxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="business-type">Trade vertical</Label>
            <Select>
              <SelectTrigger id="business-type">
                <SelectValue placeholder="Select vertical" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fmcg">FMCG distributor</SelectItem>
                <SelectItem value="pharma">Pharma distributor</SelectItem>
                <SelectItem value="hardware">Hardware / building materials</SelectItem>
                <SelectItem value="cloth">Cloth / wholesale</SelectItem>
                <SelectItem value="other">Other trade credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            className="w-full bg-[#1F3D2E] text-[#F7F1E4] hover:bg-[#1F3D2E]/90"
          >
            Request demo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
