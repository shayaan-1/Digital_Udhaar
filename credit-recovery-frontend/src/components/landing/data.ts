import {
  Smartphone,
  BookOpenText,
  ShieldAlert,
  FileBarChart,
  Bell,
  Users,
  type LucideIcon,
} from "lucide-react"

export type Feature = {
  icon: LucideIcon
  title: string
  desc: string
}

export type Step = {
  n: string
  title: string
  desc: string
}

export type LedgerRow = {
  name: string
  city: string
  outstanding: string
  delay: string
  risk: "Low" | "Medium" | "High"
}

export const FEATURES: Feature[] = [
  {
    icon: BookOpenText,
    title: "Digital retailer ledger",
    desc: "Every credit sale and payment lands in one running balance per retailer — immutable, audit-ready, always current.",
  },
  {
    icon: Smartphone,
    title: "SMS-first reminders",
    desc: "Collection reminders go out by SMS by default — any handset, no WhatsApp approval wait. WhatsApp is optional when you want it.",
  },
  {
    icon: ShieldAlert,
    title: "Live credit risk score",
    desc: "See payment delay, utilization, and risk level before you extend more stock — not after the write-off.",
  },
  {
    icon: FileBarChart,
    title: "Statements & reports",
    desc: "Professional retailer statements and receivables reports you can export or share on any connected channel.",
  },
  {
    icon: Bell,
    title: "Owner alerts",
    desc: "Get notified when a large payment lands, a limit is crossed, a reminder fails, or a retailer turns high-risk.",
  },
  {
    icon: Users,
    title: "Staff accounts",
    desc: "Give counter staff and salesmen exactly the permissions they need — record sales, not delete records.",
  },
]

export const STEPS: Step[] = [
  {
    n: "01",
    title: "Import your retailers",
    desc: "Bring in existing retailers and opening balances from Excel or CSV in one go.",
  },
  {
    n: "02",
    title: "Record sales & payments",
    desc: "Every transaction updates outstanding balance and recalculates the retailer’s risk score.",
  },
  {
    n: "03",
    title: "Reminders run on schedule",
    desc: "Rules you set decide who gets reminded, when, and on which channel — SMS by default.",
  },
  {
    n: "04",
    title: "Collections tighten",
    desc: "Outstanding drops, high-risk retailers surface early, and statements stay in sync.",
  },
]

export const LEDGER_ROWS: LedgerRow[] = [
  { name: "Malik Karyana", city: "Lahore", outstanding: "84,200", delay: "6 days", risk: "Low" },
  { name: "Rana General Store", city: "Faisalabad", outstanding: "212,900", delay: "21 days", risk: "Medium" },
  { name: "Ahmed Super Mart", city: "Karachi", outstanding: "410,000", delay: "48 days", risk: "High" },
  { name: "Bilal Hardware", city: "Lahore", outstanding: "56,750", delay: "2 days", risk: "Low" },
]

export const RISK_STYLES: Record<LedgerRow["risk"], string> = {
  Low: "bg-[#2E9E63]/10 text-[#1F3D2E] border-[#2E9E63]/30",
  Medium: "bg-[#D4A63A]/15 text-[#7A5416] border-[#D4A63A]/40",
  High: "bg-[#7A2E2E]/10 text-[#7A2E2E] border-[#7A2E2E]/30",
}

export const REMINDER_STATS = [
  { label: "Sent today (SMS)", value: "38" },
  { label: "Delivered", value: "36" },
  { label: "Promised to pay", value: "9" },
] as const

export const REPORT_LABELS = [
  "Outstanding retailers",
  "Overdue report",
  "Collection summary",
  "Sales report",
] as const
