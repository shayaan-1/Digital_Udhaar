import { cn } from "@/lib/utils"

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-forest/20 bg-white/60 px-6 py-16 text-center",
        className
      )}
    >
      <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-forest">
        {title}
      </h3>
      {description && <p className="mt-2 max-w-sm text-sm text-ink/60">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-forest/10 bg-white px-6 py-16">
      <p className="font-[family-name:var(--font-mono)] text-sm tracking-wide text-ink/55">
        {label}
      </p>
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-forest/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-ink/55 uppercase">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-mono)] text-2xl font-medium tracking-tight text-forest">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  )
}
