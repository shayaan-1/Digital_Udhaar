import {
  MessageCircleMore,
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

export const STEPS: Step[] = [
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

export const LEDGER_ROWS: LedgerRow[] = [
  { name: "Malik Traders", city: "Lahore", outstanding: "84,200", delay: "6 days", risk: "Low" },
  { name: "Rana Cloth House", city: "Faisalabad", outstanding: "212,900", delay: "21 days", risk: "Medium" },
  { name: "Ahmed Grocery Store", city: "Karachi", outstanding: "410,000", delay: "48 days", risk: "High" },
  { name: "Bilal Hardware", city: "Lahore", outstanding: "56,750", delay: "2 days", risk: "Low" },
]

export const RISK_STYLES: Record<LedgerRow["risk"], string> = {
  Low: "bg-[#2E9E63]/10 text-[#1F3D2E] border-[#2E9E63]/30",
  Medium: "bg-[#D4A63A]/15 text-[#7A5416] border-[#D4A63A]/40",
  High: "bg-[#7A2E2E]/10 text-[#7A2E2E] border-[#7A2E2E]/30",
}

export const REMINDER_STATS = [
  { label: "Sent today", value: "38" },
  { label: "Delivered", value: "36" },
  { label: "Promised to pay", value: "9" },
] as const

export const REPORT_LABELS = [
  "Outstanding customers",
  "Overdue report",
  "Collection summary",
  "Sales report",
] as const
