export function formatMoney(value: string | number | null | undefined, currency = "Rs."): string {
  if (value === null || value === undefined || value === "") return `${currency} 0.00`
  const n = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(n)) return `${currency} 0.00`
  const formatted = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
  return `${currency} ${formatted}`
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function toAmountString(value: string | number): string {
  const n = typeof value === "number" ? value : Number(value)
  if (Number.isNaN(n)) return "0.00"
  return n.toFixed(2)
}
