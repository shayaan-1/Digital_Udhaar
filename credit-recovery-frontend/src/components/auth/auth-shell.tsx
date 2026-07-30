import Link from "next/link"

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <header className="border-b border-forest/10 px-6 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-forest"
          >
            Wasooli
          </Link>
          <Link href="/" className="text-sm text-ink/60 hover:text-forest">
            Back to home
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-forest/10 bg-white p-8 shadow-sm">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-forest">
            {title}
          </h1>
          <p className="mt-2 text-sm text-ink/65">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
