"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import {
  MessageCircleMore,
  BookOpenText,
  ShieldAlert,
  FileBarChart,
  Bell,
  Users,
  ArrowRight,
  CheckCheck,
} from "lucide-react"

const FEATURES = [
  {
    icon: BookOpenText,
    title: "Digital customer ledger",
    desc: "Every credit sale and payment lands in one running balance per customer — no more three notebooks and a calculator.",
  },
  {
    icon: MessageCircleMore,
    title: "WhatsApp reminders",
    desc: "Reminders go out on WhatsApp automatically, in your own wording, with your payment details attached.",
  },
  {
    icon: ShieldAlert,
    title: "Credit risk score",
    desc: "See a customer's payment delay and risk level before you hand over more stock on credit.",
  },
  {
    icon: FileBarChart,
    title: "Statements & reports",
    desc: "Generate a clean PDF statement for any customer, any period, and share it straight to WhatsApp.",
  },
  {
    icon: Bell,
    title: "Owner alerts",
    desc: "Get notified when a large payment lands, a limit is crossed, or a reminder fails to send.",
  },
  {
    icon: Users,
    title: "Staff accounts",
    desc: "Give staff exactly the permissions they need — record sales, not delete records.",
  },
]

const STEPS = [
  {
    n: "01",
    title: "Import your khata",
    desc: "Bring in existing customers and opening balances from Excel or CSV in one go.",
  },
  {
    n: "02",
    title: "Record sales & payments",
    desc: "Every transaction updates the customer's outstanding balance instantly.",
  },
  {
    n: "03",
    title: "Reminders send themselves",
    desc: "Rules you set decide who gets reminded, and when — no manual follow-up.",
  },
  {
    n: "04",
    title: "Collections improve",
    desc: "Outstanding drops, risk scores update, and the statement reflects it all.",
  },
]

const LEDGER_ROWS = [
  { name: "Malik Traders", city: "Lahore", outstanding: "84,200", delay: "6 days", risk: "Low" },
  { name: "Rana Cloth House", city: "Faisalabad", outstanding: "212,900", delay: "21 days", risk: "Medium" },
  { name: "Ahmed Grocery Store", city: "Karachi", outstanding: "410,000", delay: "48 days", risk: "High" },
  { name: "Bilal Hardware", city: "Lahore", outstanding: "56,750", delay: "2 days", risk: "Low" },
] as const

const RISK_STYLES: Record<string, string> = {
  Low: "bg-[#2E9E63]/10 text-[#1F3D2E] border-[#2E9E63]/30",
  Medium: "bg-[#D4A63A]/15 text-[#7A5416] border-[#D4A63A]/40",
  High: "bg-[#7A2E2E]/10 text-[#7A2E2E] border-[#7A2E2E]/30",
}

export default function Home() {
  const [open, setOpen] = useState(false)
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
    setOpen(false)
    toast.add({
      title: "Request received",
      description: `We'll call ${businessName} within a day to set up your account.`,
      type: "success",
    })
    setBusinessName("")
    setPhone("")
  }

  return (
    <div className="min-h-screen bg-[#F7F1E4] font-[family-name:var(--font-body)] text-[#1B1B18]">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-[#1F3D2E]/10 bg-[#F7F1E4]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[#1F3D2E]">
            Wasooli
          </span>
          <nav className="hidden gap-8 text-sm font-medium text-[#1B1B18]/70 md:flex">
            <a href="#features" className="hover:text-[#1F3D2E]">Features</a>
            <a href="#how-it-works" className="hover:text-[#1F3D2E]">How it works</a>
            <a href="#preview" className="hover:text-[#1F3D2E]">See it in action</a>
          </nav>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1F3D2E] text-[#F7F1E4] hover:bg-[#1F3D2E]/90">
                Get a demo
              </Button>
            </DialogTrigger>
            <DemoDialogContent
              businessName={businessName}
              setBusinessName={setBusinessName}
              phone={phone}
              setPhone={setPhone}
              onSubmit={handleSubmit}
            />
          </Dialog>
        </div>
      </header>

      {/* HERO — ledger cover morphing into a WhatsApp bubble */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-6">
        <div className="grid gap-0 overflow-hidden rounded-2xl border border-[#1F3D2E]/10 shadow-sm md:grid-cols-[1.1fr_1fr]">
          {/* Left: ledger cover */}
          <div className="relative flex flex-col justify-between bg-[#1F3D2E] px-8 py-12 text-[#F7F1E4] md:px-12">
            <div
              className="pointer-events-none absolute inset-y-6 left-3 w-px bg-[repeating-linear-gradient(to_bottom,transparent,transparent_6px,#D4A63A55_6px,#D4A63A55_10px)]"
              aria-hidden
            />
            <div>
              <Badge className="mb-6 border border-[#D4A63A]/40 bg-transparent text-[#D4A63A]">
                Digital khata, WhatsApp reminders
              </Badge>
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
                Every rupee owed,
                <br />
                tracked and{" "}
                <span className="text-[#D4A63A]">recovered.</span>
              </h1>
              <p className="mt-5 max-w-md text-[#F7F1E4]/75">
                Bhool gaye kaun kitna udhaar de raha hai? Wasooli turns your credit
                register into a ledger that reminds customers for you — on WhatsApp,
                automatically.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => setOpen(true)}
                className="bg-[#D4A63A] text-[#1F3D2E] hover:bg-[#D4A63A]/90"
              >
                Get a demo <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#F7F1E4]/30 bg-transparent text-[#F7F1E4] hover:bg-[#F7F1E4]/10 hover:text-[#F7F1E4]"
              >
                See how it works
              </Button>
            </div>
          </div>

          {/* Right: WhatsApp bubble mockup */}
          <div className="flex flex-col justify-center gap-4 bg-[#EDE7D6] px-8 py-12 md:px-10">
            <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wide text-[#1B1B18]/50">
              Sent automatically · Today, 10:02 AM
            </span>
            <div className="ml-auto max-w-xs rounded-2xl rounded-tr-sm bg-[#2E9E63] px-4 py-3 text-sm text-white shadow-md">
              <p>Assalam-o-Alaikum, Rana Cloth House.</p>
              <p className="mt-2">
                Your outstanding balance is{" "}
                <span className="font-[family-name:var(--font-mono)] font-semibold">
                  Rs. 212,900
                </span>
                . Kindly clear at your earliest convenience.
              </p>
              <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-white/80">
                10:02 AM <CheckCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mr-auto max-w-xs rounded-2xl rounded-tl-sm border border-[#1F3D2E]/10 bg-white px-4 py-3 text-sm shadow-sm">
              Will pay by Friday, bhai. Please share the Easypaisa number again.
            </div>
            <Card className="mt-4 border-[#1F3D2E]/10 bg-white/70">
              <CardContent className="flex items-center justify-between py-3 text-sm">
                <span className="text-[#1B1B18]/60">Reminder logged to ledger</span>
                <Badge variant="outline" className={RISK_STYLES.Medium}>
                  Medium risk
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-[#1B1B18]/60">
          <span className="font-[family-name:var(--font-mono)]">
            Rs. 40Cr+ tracked
          </span>
          <Separator orientation="vertical" className="hidden h-4 md:block" />
          <span className="font-[family-name:var(--font-mono)]">1,200+ traders</span>
          <Separator orientation="vertical" className="hidden h-4 md:block" />
          <span className="font-[family-name:var(--font-mono)]">
            Avg. 11 day faster recovery
          </span>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#1F3D2E]">
            Everything a credit business runs on
          </h2>
          <p className="mt-3 text-[#1B1B18]/65">
            Built for how Pakistani traders already sell — on trust, on credit, and
            increasingly, on WhatsApp.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-[#1F3D2E]/10 bg-white">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F3D2E]/5">
                  <Icon className="h-5 w-5 text-[#1F3D2E]" />
                </div>
                <CardTitle className="font-[family-name:var(--font-display)] text-lg">
                  {title}
                </CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS — real sequence, so numbered */}
      <section id="how-it-works" className="border-y border-[#1F3D2E]/10 bg-[#1F3D2E]/[0.03] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-10 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#1F3D2E]">
            From opening a register to closing a balance
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative">
                <span className="font-[family-name:var(--font-mono)] text-sm text-[#D4A63A]">
                  {step.n}
                </span>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[#1F3D2E]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-[#1B1B18]/65">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-4 top-1 hidden h-px w-8 bg-[#1F3D2E]/15 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section id="preview" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-8 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#1F3D2E]">
          One ledger, every view an owner needs
        </h2>
        <Tabs defaultValue="ledger">
          <TabsList className="bg-[#1F3D2E]/5">
            <TabsTrigger value="ledger">Customer ledger</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger">
            <Card className="border-[#1F3D2E]/10">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Avg. delay</TableHead>
                      <TableHead>Risk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {LEDGER_ROWS.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-[#1B1B18]/60">{row.city}</TableCell>
                        <TableCell className="font-[family-name:var(--font-mono)]">
                          Rs. {row.outstanding}
                        </TableCell>
                        <TableCell className="text-[#1B1B18]/60">{row.delay}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={RISK_STYLES[row.risk]}>
                            {row.risk}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reminders">
            <Card className="border-[#1F3D2E]/10">
              <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
                {[
                  { label: "Sent today", value: "38" },
                  { label: "Delivered", value: "36" },
                  { label: "Promised to pay", value: "9" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-[#1F3D2E]/[0.04] p-4">
                    <p className="font-[family-name:var(--font-mono)] text-2xl font-semibold text-[#1F3D2E]">
                      {stat.value}
                    </p>
                    <p className="text-sm text-[#1B1B18]/60">{stat.label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="border-[#1F3D2E]/10">
              <CardContent className="flex flex-wrap gap-3 pt-6">
                {["Outstanding customers", "Overdue report", "Collection summary", "Sales report"].map(
                  (r) => (
                    <Badge key={r} variant="outline" className="border-[#1F3D2E]/20 px-3 py-1 text-[#1F3D2E]">
                      {r}
                    </Badge>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl bg-[#1F3D2E] px-8 py-14 text-center text-[#F7F1E4] md:px-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Stop chasing customers on the phone.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[#F7F1E4]/70">
            Set up your ledger in an afternoon. Let WhatsApp do the following up.
          </p>
          <Button
            size="lg"
            onClick={() => setOpen(true)}
            className="mt-6 bg-[#D4A63A] text-[#1F3D2E] hover:bg-[#D4A63A]/90"
          >
            Request a demo <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1F3D2E]/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-[#1B1B18]/50 md:flex-row">
          <span className="font-[family-name:var(--font-display)] text-[#1F3D2E]">Wasooli</span>
          <span>© {new Date().getFullYear()} Wasooli. Built for Pakistan's credit businesses.</span>
        </div>
      </footer>
    </div>
  )
}

function DemoDialogContent({
  businessName,
  setBusinessName,
  phone,
  setPhone,
  onSubmit,
}: {
  businessName: string
  setBusinessName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="font-[family-name:var(--font-display)]">
          See Wasooli on your own ledger
        </DialogTitle>
        <DialogDescription>
          Tell us a bit about your business — we'll set up a walkthrough.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="business-name">Business name</Label>
          <Input
            id="business-name"
            placeholder="e.g. Malik Traders"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">WhatsApp number</Label>
          <Input
            id="phone"
            placeholder="03xx-xxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="business-type">Business type</Label>
          <Select>
            <SelectTrigger id="business-type">
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wholesaler">Wholesaler</SelectItem>
              <SelectItem value="retailer">Retailer</SelectItem>
              <SelectItem value="distributor">Distributor</SelectItem>
              <SelectItem value="manufacturer">Manufacturer</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={onSubmit}
          className="w-full bg-[#1F3D2E] text-[#F7F1E4] hover:bg-[#1F3D2E]/90"
        >
          Request demo
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}