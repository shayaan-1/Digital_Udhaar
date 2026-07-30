import Link from "next/link"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumb?: { label: string; href?: string }[]
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-ink/55">
            {breadcrumb.map((item, i) => (
              <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                {item.href ? (
                  <Link href={item.href} className="hover:text-forest">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-ink/70">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1
          className={cn(
            "font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-forest md:text-3xl"
          )}
        >
          {title}
        </h1>
        {description && <p className="mt-1.5 max-w-xl text-sm text-ink/65">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
